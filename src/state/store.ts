import { SimpleType, SimpleTypeKind, SimpleTypeUnion } from "ts-simple-type";
import * as tsModule from "typescript";
import { SourceFile } from "typescript";
import * as ts from "typescript/lib/tsserverlibrary";
import { AnalyzeComponentsResult, ComponentDefinition, ComponentDiagnostic } from "web-component-analyzer";
import { HtmlAttr, HtmlAttrTarget, HtmlDataCollection, HtmlEvent, HtmlMember, HtmlProp, HtmlSlot, HtmlTag, mergeHtmlAttrs, mergeHtmlEvents, mergeHtmlTags } from "../parsing/parse-html-data/html-tag";
import {
	HtmlNodeAttr,
	HtmlNodeAttrKind,
	IHtmlNodeAttr,
	IHtmlNodeAttrEventListener,
	IHtmlNodeAttrProp,
	IHtmlNodeBooleanAttribute
} from "../parsing/text-document/html-document/parse-html-node/types/html-node-attr-types";
import { HtmlNode } from "../parsing/text-document/html-document/parse-html-node/types/html-node-types";
import { iterableDefined } from "../util/iterable-util";
import { lazy } from "../util/util";
import { Config } from "./config";

export class TsLitPluginHtmlDataSource {
	private _globalTags = new Map<string, HtmlTag>();
	get globalTags(): ReadonlyMap<string, HtmlTag> {
		return this._globalTags;
	}

	private _globalAttributes = new Map<string, HtmlAttr>();
	get globalAttributes(): ReadonlyMap<string, HtmlAttr> {
		return this._globalAttributes;
	}

	private _globalEvents = new Map<string, HtmlEvent>();
	get globalEvents(): ReadonlyMap<string, HtmlEvent> {
		return this._globalEvents;
	}

	absorbCollection(collection: Partial<HtmlDataCollection>) {
		if (collection.tags != null) {
			// For now, lowercase all names because "parse5" doesn't distinguish when parsing
			collection.tags.forEach(tag => this._globalTags.set(tag.tagName.toLowerCase(), tag));
		}

		if (collection.attrs != null) {
			// For now, lowercase all names because "parse5" doesn't distinguish when parsing
			collection.attrs.forEach(attr => this._globalAttributes.set(attr.name.toLowerCase(), attr));
		}

		if (collection.events != null) {
			// For now, lowercase all names because "parse5" doesn't distinguish when parsing
			collection.events.forEach(evt => this._globalEvents.set(evt.name.toLowerCase(), evt));
		}
	}

	forgetCollection({ tags, events, attrs }: Partial<Record<keyof HtmlDataCollection, string[]>>) {
		if (tags != null) tags.forEach(tagName => this._globalTags.delete(tagName));
		if (events != null) events.forEach(tagName => this._globalEvents.delete(tagName));
		if (attrs != null) attrs.forEach(tagName => this._globalAttributes.delete(tagName));
	}

	getGlobalTag(tagName: string): HtmlTag | undefined {
		return this._globalTags.get(tagName);
	}

	getGlobalAttribute(attrName: string): HtmlAttr | undefined {
		return this._globalAttributes.get(attrName);
	}

	getGlobalEvent(eventName: string): HtmlEvent | undefined {
		return this._globalEvents.get(eventName);
	}
}

export enum HtmlStoreDataSource {
	DECLARED = 0,
	USER = 1,
	BUILD_IN = 2
}

export class TsLitPluginHtmlStore {
	private subclassExtensions = new Map<string, HtmlTag>();

	private htmlDataSources: TsLitPluginHtmlDataSource[] = (() => {
		const array: TsLitPluginHtmlDataSource[] = [];
		array[HtmlStoreDataSource.BUILD_IN] = new TsLitPluginHtmlDataSource();
		array[HtmlStoreDataSource.USER] = new TsLitPluginHtmlDataSource();
		array[HtmlStoreDataSource.DECLARED] = new TsLitPluginHtmlDataSource();
		return array;
	})();

	private combinedHtmlDataSource = new TsLitPluginHtmlDataSource();

	private relatedForTagName = {
		attrs: new Map<string, ReadonlyMap<string, HtmlAttr>>(),
		events: new Map<string, ReadonlyMap<string, HtmlEvent>>(),
		slots: new Map<string, ReadonlyMap<string, HtmlSlot>>(),
		props: new Map<string, ReadonlyMap<string, HtmlProp>>()
	};

	get globalTags(): ReadonlyMap<string, HtmlTag> {
		return this.combinedHtmlDataSource.globalTags;
	}

	invalidateCache(collection?: Partial<Record<keyof HtmlDataCollection, string[]>>) {
		if (collection == null) {
			Object.values(this.relatedForTagName).forEach(map => map.clear());
			return;
		}

		const { events, attrs, tags } = collection;

		if (tags && tags.length > 0) {
			Object.values(this.relatedForTagName).forEach(map => tags.forEach(tagName => map.delete(tagName)));
		}

		if (attrs && attrs.length > 0) {
			this.relatedForTagName.attrs.clear();
		}

		if (events && events.length > 0) {
			this.relatedForTagName.events.clear();
		}
	}

	mergeDataSourcesAndInvalidate(collection: Partial<Record<keyof HtmlDataCollection, string[]>>) {
		const { tags, attrs, events } = collection;

		if (tags != null) {
			for (const tagName of tags) {
				const allTags = iterableDefined(this.htmlDataSources.map(r => r.getGlobalTag(tagName)));

				if (allTags.length > 0) {
					const mergedTags = allTags.length === 1 ? allTags : mergeHtmlTags(allTags);
					this.combinedHtmlDataSource.absorbCollection({ tags: mergedTags });
				}
			}
		}

		if (attrs != null) {
			for (const attrName of attrs) {
				const allAttrs = iterableDefined(this.htmlDataSources.map(r => r.getGlobalAttribute(attrName)));

				if (allAttrs.length > 0) {
					const mergedAttrs = allAttrs.length === 1 ? allAttrs : mergeHtmlAttrs(allAttrs);
					this.combinedHtmlDataSource.absorbCollection({ attrs: mergedAttrs });
				}
			}
		}

		if (events != null) {
			for (const eventName of events) {
				const allEvents = iterableDefined(this.htmlDataSources.map(r => r.getGlobalEvent(eventName)));

				if (allEvents.length > 0) {
					const mergedEvents = allEvents.length === 1 ? allEvents : mergeHtmlEvents(allEvents);
					this.combinedHtmlDataSource.absorbCollection({ events: mergedEvents });
				}
			}
		}

		this.invalidateCache(collection);
	}

	forgetCollection(collection: Partial<Record<keyof HtmlDataCollection, string[]>>, dataSource?: HtmlStoreDataSource) {
		if (dataSource == null) {
			this.htmlDataSources.forEach(ds => ds.forgetCollection(collection));
		} else {
			this.htmlDataSources[dataSource].forgetCollection(collection);
		}

		this.combinedHtmlDataSource.forgetCollection(collection);
		this.mergeDataSourcesAndInvalidate(collection);
	}

	absorbCollection(collection: HtmlDataCollection, register: HtmlStoreDataSource) {
		this.htmlDataSources[register].absorbCollection(collection);

		this.mergeDataSourcesAndInvalidate({
			tags: collection.tags.map(t => t.tagName),
			events: collection.events.map(t => t.name),
			attrs: collection.attrs.map(t => t.name)
		});
	}

	getHtmlTag(tagName: string): HtmlTag | undefined {
		return this.combinedHtmlDataSource.getGlobalTag(tagName);
	}

	absorbSubclassExtension(name: string, extension: HtmlTag) {
		this.subclassExtensions.set(name, extension);
	}

	getSubclassExtensions(tagName: string): HtmlTag[] {
		// Right now, always return "HTMLElement" subclass extension
		const extension = this.subclassExtensions.get("HTMLElement");
		return extension != null ? [extension] : [];
	}

	getAllAttributesForTag(tagName: string): ReadonlyMap<string, HtmlAttr> {
		if (!this.relatedForTagName.attrs.has(tagName)) {
			this.relatedForTagName.attrs.set(tagName, mergeRelatedMembers(this.iterateAllAttributesForNode(tagName)));
		}

		return this.relatedForTagName.attrs.get(tagName)!;
	}

	getAllPropertiesForTag(tagName: string): ReadonlyMap<string, HtmlProp> {
		if (!this.relatedForTagName.props.has(tagName)) {
			this.relatedForTagName.props.set(tagName, mergeRelatedMembers(this.iterateAllPropertiesForNode(tagName)));
		}

		return this.relatedForTagName.props.get(tagName)!;
	}

	getAllEventsForTag(tagName: string): ReadonlyMap<string, HtmlEvent> {
		if (!this.relatedForTagName.events.has(tagName)) {
			this.relatedForTagName.events.set(tagName, mergeRelatedEvents(this.iterateAllEventsForNode(tagName)));
		}

		return this.relatedForTagName.events.get(tagName)!;
	}

	getAllSlotForTag(tagName: string): ReadonlyMap<string, HtmlSlot> {
		if (!this.relatedForTagName.slots.has(tagName)) {
			this.relatedForTagName.slots.set(tagName, mergeRelatedSlots(this.iterateAllSlotsForNode(tagName)));
		}

		return this.relatedForTagName.slots.get(tagName)!;
	}

	private iterateGlobalAttributes(): Iterable<HtmlAttr> {
		return this.combinedHtmlDataSource.globalAttributes.values();
	}

	private iterateGlobalEvents(): Iterable<HtmlEvent> {
		return this.combinedHtmlDataSource.globalEvents.values();
	}

	private *iterateAllPropertiesForNode(tagName: string): Iterable<HtmlProp> {
		// Html tag properties
		const htmlTag = this.getHtmlTag(tagName);
		if (htmlTag != null) yield* htmlTag.properties;

		// Extension properties
		const extensions = this.getSubclassExtensions(tagName);
		for (const extTag of extensions) {
			yield* extTag.properties;
		}
	}

	private *iterateAllEventsForNode(tagName: string): Iterable<HtmlEvent> {
		// Html tag events
		const htmlTag = this.getHtmlTag(tagName);
		if (htmlTag != null) yield* htmlTag.events;

		// Extension events
		const extensions = this.getSubclassExtensions(tagName);
		for (const extTag of extensions) {
			yield* extTag.events;
		}

		// All events on other tags (because they bubble)
		for (const tag of this.globalTags.values()) {
			if (tag.tagName !== tagName) {
				yield* tag.events;
			}
		}

		// Global events
		yield* this.iterateGlobalEvents();
	}

	private *iterateAllAttributesForNode(tagName: string): Iterable<HtmlAttr> {
		// Html tag attributes
		const htmlTag = this.getHtmlTag(tagName);
		if (htmlTag != null) yield* htmlTag.attributes;

		// Extension attributes
		const extensions = this.getSubclassExtensions(tagName);
		for (const extTag of extensions) {
			yield* extTag.attributes;
		}

		// Global attributes
		yield* this.iterateGlobalAttributes();
	}

	private *iterateAllSlotsForNode(tagName: string): Iterable<HtmlSlot> {
		// Html tag attributes
		const htmlTag = this.getHtmlTag(tagName);
		if (htmlTag != null) yield* htmlTag.slots;

		// Extension attributes
		const extensions = this.getSubclassExtensions(tagName);
		for (const extTag of extensions) {
			yield* extTag.slots;
		}
	}
}

/**
 * The main store that this ts-plugin uses.
 */
export class TsLitPluginStore {
	config!: Config;
	sourceFileDiagnostics = new Map<SourceFile, ComponentDiagnostic[]>();
	importedComponentDefinitionsInFile = new Map<string, ComponentDefinition[]>();
	analysisResultForFile = new Map<string, AnalyzeComponentsResult>();
	private definitionForTagName = new Map<string, ComponentDefinition>();
	private htmlStore = new TsLitPluginHtmlStore();

	constructor(public ts: typeof tsModule, public info: ts.server.PluginCreateInfo) {}

	absorbAnalysisResult(sourceFile: SourceFile, result: AnalyzeComponentsResult) {
		this.analysisResultForFile.set(sourceFile.fileName, result);

		result.componentDefinitions.forEach(definition => {
			this.definitionForTagName.set(definition.tagName, definition);
		});
	}

	absorbSubclassExtension(name: string, extension: HtmlTag) {
		this.htmlStore.absorbSubclassExtension(name, extension);
	}

	absorbCollection(collection: HtmlDataCollection, register: HtmlStoreDataSource) {
		this.htmlStore.absorbCollection(collection, register);
	}

	forgetTagsDefinedInFile(sourceFile: SourceFile) {
		const result = this.analysisResultForFile.get(sourceFile.fileName);
		if (result == null) return;

		result.componentDefinitions.forEach(definition => {
			this.definitionForTagName.delete(definition.tagName);
		});

		const tagNames = result.componentDefinitions.map(d => d.tagName);
		const eventNames = result.globalEvents.map(e => e.name);

		this.htmlStore.forgetCollection({ tags: tagNames, events: eventNames }, HtmlStoreDataSource.DECLARED);
	}

	getDefinitionsWithDeclarationInFile(sourceFile: SourceFile): ComponentDefinition[] {
		return Array.from(this.definitionForTagName.values()).filter(d =>
			[d.declaration.node, ...(d.declaration.inheritNodes || [])].map(n => n.getSourceFile()).find(sf => sf.fileName === sourceFile.fileName)
		);
	}

	getDefinitionForTagName(tagName: string): ComponentDefinition | undefined {
		return this.definitionForTagName.get(tagName);
	}

	getHtmlTag(htmlNode: HtmlNode | string): HtmlTag | undefined {
		return this.htmlStore.getHtmlTag(typeof htmlNode === "string" ? htmlNode : htmlNode.tagName);
	}

	getGlobalTags(): Iterable<HtmlTag> {
		return this.htmlStore.globalTags.values();
	}

	getAllAttributesForTag(htmlNode: HtmlNode | string): Iterable<HtmlAttr> {
		return this.htmlStore.getAllAttributesForTag(typeof htmlNode === "string" ? htmlNode : htmlNode.tagName).values();
	}

	getAllPropertiesForTag(htmlNode: HtmlNode | string): Iterable<HtmlProp> {
		return this.htmlStore.getAllPropertiesForTag(typeof htmlNode === "string" ? htmlNode : htmlNode.tagName).values();
	}

	getAllEventsForTag(htmlNode: HtmlNode | string): Iterable<HtmlEvent> {
		return this.htmlStore.getAllEventsForTag(typeof htmlNode === "string" ? htmlNode : htmlNode.tagName).values();
	}

	getAllSlotsForTag(htmlNode: HtmlNode | string): Iterable<HtmlSlot> {
		return this.htmlStore.getAllSlotForTag(typeof htmlNode === "string" ? htmlNode : htmlNode.tagName).values();
	}

	getHtmlAttrTarget(htmlNodeAttr: IHtmlNodeAttrProp): HtmlProp | undefined;
	getHtmlAttrTarget(htmlNodeAttr: IHtmlNodeAttr | IHtmlNodeBooleanAttribute): HtmlAttr | undefined;
	getHtmlAttrTarget(htmlNodeAttr: IHtmlNodeAttr | IHtmlNodeBooleanAttribute | IHtmlNodeAttrProp): HtmlMember | undefined;
	getHtmlAttrTarget(htmlNodeAttr: IHtmlNodeAttrEventListener): HtmlEvent | undefined;
	getHtmlAttrTarget(htmlNodeAttr: HtmlNodeAttr): HtmlAttrTarget | undefined;
	getHtmlAttrTarget(htmlNodeAttr: HtmlNodeAttr): HtmlAttrTarget | undefined {
		const name = htmlNodeAttr.name.toLowerCase();

		switch (htmlNodeAttr.kind) {
			case HtmlNodeAttrKind.EVENT_LISTENER:
				return this.htmlStore.getAllEventsForTag(htmlNodeAttr.htmlNode.tagName).get(name);

			case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
			case HtmlNodeAttrKind.ATTRIBUTE:
				return this.htmlStore.getAllAttributesForTag(htmlNodeAttr.htmlNode.tagName).get(name);

			case HtmlNodeAttrKind.PROPERTY:
				return this.htmlStore.getAllPropertiesForTag(htmlNodeAttr.htmlNode.tagName).get(name);
		}
	}

	getDefinitionsInFile(sourceFile: SourceFile): ComponentDefinition[] {
		const result = this.analysisResultForFile.get(sourceFile.fileName);
		return (result != null && result.componentDefinitions) || [];
	}

	/**
	 * Returns if a component for a specific file has been imported.
	 * @param fileName
	 * @param tagName
	 */
	hasTagNameBeenImported(fileName: string, tagName: string): boolean {
		for (const file of this.importedComponentDefinitionsInFile.get(fileName) || []) {
			if (file.tagName === tagName) {
				return true;
			}
		}

		return false;
	}
}

function mergeRelatedMembers<T extends HtmlMember>(attrs: Iterable<T>): ReadonlyMap<string, T> {
	const mergedMembers = new Map<string, T>();
	for (const attr of attrs) {
		// For now, lowercase all names because "parse5" doesn't distinguish between uppercase and lowercase
		const name = attr.name.toLowerCase();

		const existingAttr = mergedMembers.get(name);
		if (existingAttr == null) {
			mergedMembers.set(name, attr);
		} else {
			const prevType = existingAttr.getType;
			mergedMembers.set(name, {
				...existingAttr,
				description: undefined,
				required: existingAttr.required && attr.required,
				builtIn: existingAttr.required && attr.required,
				fromTagName: existingAttr.fromTagName || attr.fromTagName,
				getType: lazy(() => mergeRelatedTypeToUnion(prevType(), attr.getType())),
				related: existingAttr.related == null ? [existingAttr, attr] : [...existingAttr.related, attr]
			});
		}
	}
	return mergedMembers;
}

function mergeRelatedTypeToUnion(typeA: SimpleType, typeB: SimpleType): SimpleType {
	if (typeA.kind === typeB.kind) {
		switch (typeA.kind) {
			case SimpleTypeKind.ANY:
				return typeA;
		}
	}

	switch (typeA.kind) {
		case SimpleTypeKind.UNION:
			if (typeB.kind === SimpleTypeKind.ANY && typeA.types.find(t => t.kind === SimpleTypeKind.ANY) != null) {
				return typeA;
			} else {
				return {
					...typeA,
					types: [...typeA.types, typeB]
				};
			}
	}

	return {
		kind: SimpleTypeKind.UNION,
		types: [typeA, typeB]
	} as SimpleTypeUnion;
}

function mergeRelatedSlots(slots: Iterable<HtmlSlot>): ReadonlyMap<string, HtmlSlot> {
	const mergedSlots = new Map<string, HtmlSlot>();
	for (const slot of slots) {
		// For now, lowercase all names because "parse5" doesn't distinguish between uppercase and lowercase
		const name = slot.name.toLowerCase();

		mergedSlots.set(name, slot);
	}
	return mergedSlots;
}

function mergeRelatedEvents(events: Iterable<HtmlEvent>): ReadonlyMap<string, HtmlEvent> {
	const mergedAttrs = new Map<string, HtmlEvent>();
	for (const event of events) {
		// For now, lowercase all names because "parse5" doesn't distinguish between uppercase and lowercase
		const name = event.name.toLowerCase();

		const existingAttr = mergedAttrs.get(name);
		if (existingAttr == null) {
			mergedAttrs.set(name, event);
		} else {
			const prevType = existingAttr.getType;
			mergedAttrs.set(name, {
				...existingAttr,
				global: existingAttr.global && event.global,
				description: undefined,
				getType: lazy(() => mergeRelatedTypeToUnion(prevType(), event.getType())),
				related: existingAttr.related == null ? [existingAttr, event] : [...existingAttr.related, event],
				fromTagName: existingAttr.fromTagName || event.fromTagName
			});
		}
	}
	return mergedAttrs;
}

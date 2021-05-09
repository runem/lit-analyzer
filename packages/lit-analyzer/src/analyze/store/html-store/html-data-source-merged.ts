import { SimpleType, SimpleTypeUnion } from "ts-simple-type";
import {
	HtmlAttr,
	HtmlCssPart,
	HtmlDataCollection,
	HtmlEvent,
	HtmlMember,
	HtmlProp,
	HtmlSlot,
	HtmlTag,
	mergeCssParts,
	mergeHtmlAttrs,
	mergeHtmlEvents,
	mergeHtmlProps,
	mergeHtmlSlots,
	mergeHtmlTags,
	NamedHtmlDataCollection,
	HtmlCssProperty,
	mergeCssProperties
} from "../../parse/parse-html-data/html-tag";
import { lazy } from "../../util/general-util";
import { iterableDefined } from "../../util/iterable-util";
import { HtmlDataSource } from "./html-data-source";

export enum HtmlDataSourceKind {
	DECLARED = 0,
	USER = 1,
	BUILT_IN = 2,
	BUILT_IN_DECLARED = 3
}

export class HtmlDataSourceMerged {
	private subclassExtensions = new Map<string, HtmlTag>();

	private htmlDataSources: HtmlDataSource[] = (() => {
		const array: HtmlDataSource[] = [];
		array[HtmlDataSourceKind.BUILT_IN] = new HtmlDataSource();
		array[HtmlDataSourceKind.BUILT_IN_DECLARED] = new HtmlDataSource();
		array[HtmlDataSourceKind.USER] = new HtmlDataSource();
		array[HtmlDataSourceKind.DECLARED] = new HtmlDataSource();
		return array;
	})();

	private combinedHtmlDataSource = new HtmlDataSource();

	private relatedForTagName = {
		attrs: new Map<string, ReadonlyMap<string, HtmlAttr>>(),
		events: new Map<string, ReadonlyMap<string, HtmlEvent>>(),
		slots: new Map<string, ReadonlyMap<string, HtmlSlot>>(),
		props: new Map<string, ReadonlyMap<string, HtmlProp>>(),
		cssParts: new Map<string, ReadonlyMap<string, HtmlCssPart>>(),
		cssProperties: new Map<string, ReadonlyMap<string, HtmlCssProperty>>()
	};

	get globalTags(): ReadonlyMap<string, HtmlTag> {
		return this.combinedHtmlDataSource.globalTags;
	}

	invalidateCache(collection: NamedHtmlDataCollection): void {
		const {
			tags,
			global: { attributes, events, cssParts }
		} = collection;

		if (tags && tags.length > 0) {
			const allCaches = Object.values(this.relatedForTagName);
			for (const tagName of tags) {
				// Clear caches for the tag name
				for (const map of allCaches) {
					map.delete(tagName);
				}

				// "events", "css parts" and "css custom properties" are all considered "global" when returning matches
				// Therefore we clear all caches if any invalidated tag included those
				const tag = this.getHtmlTag(tagName);
				if (tag != null) {
					if ((tag.events.length || 0) > 0) {
						this.relatedForTagName.events.clear();
					}

					if ((tag.cssParts.length || 0) > 0) {
						this.relatedForTagName.cssParts.clear();
					}

					if ((tag.cssProperties.length || 0) > 0) {
						this.relatedForTagName.cssProperties.clear();
					}
				}
			}
		}

		if (attributes && attributes.length > 0) {
			this.relatedForTagName.attrs.clear();
		}

		if (events && events.length > 0) {
			this.relatedForTagName.events.clear();
		}

		if (cssParts && cssParts.length > 0) {
			this.relatedForTagName.cssParts.clear();
		}
	}

	mergeDataSourcesAndInvalidate(collection: NamedHtmlDataCollection): void {
		const {
			tags,
			global: { events, attributes, properties, slots, cssParts, cssProperties }
		} = collection;

		this.invalidateCache(collection);

		if (tags != null) {
			for (const tagName of tags) {
				const allTags = iterableDefined(this.htmlDataSources.map(r => r.getGlobalTag(tagName)));

				if (allTags.length > 0) {
					const mergedTags = allTags.length === 1 ? allTags : mergeHtmlTags(allTags);
					this.combinedHtmlDataSource.absorbCollection({ tags: mergedTags });
				}
			}
		}

		if (attributes != null) {
			for (const attrName of attributes) {
				const allAttrs = iterableDefined(this.htmlDataSources.map(r => r.getGlobalAttribute(attrName)));

				if (allAttrs.length > 0) {
					const mergedAttrs = allAttrs.length === 1 ? allAttrs : mergeHtmlAttrs(allAttrs);
					this.combinedHtmlDataSource.absorbCollection({ global: { attributes: mergedAttrs } });
				}
			}
		}

		if (events != null) {
			for (const eventName of events) {
				const allEvents = iterableDefined(this.htmlDataSources.map(r => r.getGlobalEvent(eventName)));

				if (allEvents.length > 0) {
					const mergedEvents = allEvents.length === 1 ? allEvents : mergeHtmlEvents(allEvents);
					this.combinedHtmlDataSource.absorbCollection({ global: { events: mergedEvents } });
				}
			}
		}

		if (properties != null) {
			for (const propName of properties) {
				const allProps = iterableDefined(this.htmlDataSources.map(r => r.getGlobalProperty(propName)));

				if (allProps.length > 0) {
					const mergedProps = allProps.length === 1 ? allProps : mergeHtmlProps(allProps);
					this.combinedHtmlDataSource.absorbCollection({ global: { properties: mergedProps } });
				}
			}
		}

		if (slots != null) {
			for (const slotName of slots) {
				const allSlots = iterableDefined(this.htmlDataSources.map(r => r.getGlobalSlot(slotName)));

				if (allSlots.length > 0) {
					const mergedSlots = allSlots.length === 1 ? allSlots : mergeHtmlSlots(allSlots);
					this.combinedHtmlDataSource.absorbCollection({ global: { slots: mergedSlots } });
				}
			}
		}

		if (cssProperties != null) {
			for (const cssPartName of cssProperties) {
				const allCssProps = iterableDefined(this.htmlDataSources.map(r => r.getGlobalCssProperty(cssPartName)));

				if (allCssProps.length > 0) {
					const mergedCssProps = allCssProps.length === 1 ? allCssProps : mergeCssProperties(allCssProps);
					this.combinedHtmlDataSource.absorbCollection({ global: { cssProperties: mergedCssProps } });
				}
			}
		}

		if (cssParts != null) {
			for (const cssPartName of cssParts) {
				const allCssParts = iterableDefined(this.htmlDataSources.map(r => r.getGlobalCssPart(cssPartName)));

				if (allCssParts.length > 0) {
					const mergedCssParts = allCssParts.length === 1 ? allCssParts : mergeCssParts(allCssParts);
					this.combinedHtmlDataSource.absorbCollection({ global: { cssParts: mergedCssParts } });
				}
			}
		}
	}

	forgetCollection(collection: NamedHtmlDataCollection, dataSource?: HtmlDataSourceKind): void {
		if (dataSource == null) {
			this.htmlDataSources.forEach(ds => ds.forgetCollection(collection));
		} else {
			this.htmlDataSources[dataSource].forgetCollection(collection);
		}

		this.mergeDataSourcesAndInvalidate(collection);
		this.combinedHtmlDataSource.forgetCollection(collection);
	}

	absorbCollection(collection: HtmlDataCollection, register: HtmlDataSourceKind): void {
		this.htmlDataSources[register].absorbCollection(collection);

		this.mergeDataSourcesAndInvalidate({
			tags: collection.tags.map(t => t.tagName),
			global: {
				events: collection.global?.events?.map(t => t.name),
				attributes: collection.global?.attributes?.map(a => a.name),
				properties: collection.global?.properties?.map(p => p.name),
				slots: collection.global?.slots?.map(s => s.name),
				cssParts: collection.global?.cssParts?.map(s => s.name),
				cssProperties: collection.global?.cssProperties?.map(s => s.name)
			}
		});
	}

	getHtmlTag(tagName: string): HtmlTag | undefined {
		return this.combinedHtmlDataSource.getGlobalTag(tagName);
	}

	absorbSubclassExtension(name: string, extension: HtmlTag): void {
		this.subclassExtensions.set(name, extension);
	}

	getSubclassExtensions(tagName?: string): HtmlTag[] {
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

	getAllCssPartsForTag(tagName: string): ReadonlyMap<string, HtmlCssPart> {
		if (!this.relatedForTagName.cssParts.has(tagName)) {
			this.relatedForTagName.cssParts.set(tagName, mergeRelatedCssParts(this.iterateAllCssPartsForNode(tagName)));
		}

		return this.relatedForTagName.cssParts.get(tagName)!;
	}

	getAllCssPropertiesForTag(tagName: string): ReadonlyMap<string, HtmlCssProperty> {
		if (!this.relatedForTagName.cssProperties.has(tagName)) {
			this.relatedForTagName.cssProperties.set(tagName, mergeRelatedCssProperties(this.iterateAllCssPropertiesForNode(tagName)));
		}

		return this.relatedForTagName.cssProperties.get(tagName)!;
	}

	private iterateGlobalAttributes(): Iterable<HtmlAttr> {
		return this.combinedHtmlDataSource.globalAttributes.values();
	}

	private iterateGlobalEvents(): Iterable<HtmlEvent> {
		return this.combinedHtmlDataSource.globalEvents.values();
	}

	private iterateGlobalProperties(): Iterable<HtmlProp> {
		return this.combinedHtmlDataSource.globalProperties.values();
	}

	private iterateGlobalSlots(): Iterable<HtmlSlot> {
		return this.combinedHtmlDataSource.globalSlots.values();
	}

	private iterateGlobalCssParts(): Iterable<HtmlCssPart> {
		return this.combinedHtmlDataSource.globalCssParts.values();
	}

	private iterateGlobalCssProperties(): Iterable<HtmlCssPart> {
		return this.combinedHtmlDataSource.globalCssProperties.values();
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

		// Global propertjes
		yield* this.iterateGlobalProperties();
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
		if (htmlTag == null || htmlTag.events.length === 0) {
			for (const tag of this.globalTags.values()) {
				if (tag.tagName !== tagName) {
					yield* tag.events;
				}
			}

			// Global events
			yield* this.iterateGlobalEvents();
		} else {
			// If we emitted some events from the main html tag, don't emit these events again
			const eventNameSet = new Set(htmlTag.events.map(e => e.name));

			for (const tag of this.globalTags.values()) {
				if (tag.tagName !== tagName) {
					for (const evt of tag.events) {
						if (!eventNameSet.has(evt.name)) {
							yield evt;
						}
					}
				}
			}

			// Global events
			for (const evt of this.iterateGlobalEvents()) {
				if (!eventNameSet.has(evt.name)) {
					yield evt;
				}
			}
		}
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

		// Global slots
		yield* this.iterateGlobalSlots();
	}

	private *iterateAllCssPartsForNode(tagName: string): Iterable<HtmlCssPart> {
		if (tagName === "") {
			// Iterate all css parts for all tags if no tag name has been given
			for (const tag of this.combinedHtmlDataSource.globalTags.values()) {
				yield* tag.cssParts;
			}
		} else {
			const htmlTag = this.getHtmlTag(tagName);
			if (htmlTag != null) yield* htmlTag.cssParts;
		}

		// Extension attributes
		const extensions = this.getSubclassExtensions(tagName);
		for (const extTag of extensions) {
			yield* extTag.cssParts;
		}

		// Global slots
		yield* this.iterateGlobalCssParts();
	}

	private *iterateAllCssPropertiesForNode(tagName: string): Iterable<HtmlCssProperty> {
		if (tagName === "") {
			// Iterate all css custom properties for all tags
			for (const tag of this.combinedHtmlDataSource.globalTags.values()) {
				yield* tag.cssProperties;
			}
		} else {
			const htmlTag = this.getHtmlTag(tagName);
			if (htmlTag != null) yield* htmlTag.cssProperties;
		}

		// Extension attributes
		const extensions = this.getSubclassExtensions(tagName);
		for (const extTag of extensions) {
			yield* extTag.cssProperties;
		}

		// Global slots
		yield* this.iterateGlobalCssProperties();
	}
}

function mergeRelatedMembers<T extends HtmlMember>(members: Iterable<T>): ReadonlyMap<string, T> {
	const mergedMembers = new Map<string, T>();
	for (const member of members) {
		// For now, lowercase all names because "parse5" doesn't distinguish between uppercase and lowercase
		const name = member.name.toLowerCase();

		const existingMember = mergedMembers.get(name);
		if (existingMember == null) {
			mergedMembers.set(name, member);
		} else {
			const prevType = existingMember.getType;
			mergedMembers.set(name, {
				...existingMember,
				description: undefined,
				required: existingMember.required && member.required,
				builtIn: existingMember.required && member.required,
				fromTagName: existingMember.fromTagName || member.fromTagName,
				getType: lazy(() => mergeRelatedTypeToUnion(prevType(), member.getType())),
				related: existingMember.related == null ? [existingMember, member] : [...existingMember.related, member]
			});
		}
	}
	return mergedMembers;
}

function mergeRelatedTypeToUnion(typeA: SimpleType, typeB: SimpleType, { collapseAny = true }: { collapseAny?: boolean } = {}): SimpleType {
	if (typeA.kind === typeB.kind) {
		return typeA;
	}

	if (collapseAny) {
		if (typeB.kind === "ANY") {
			return typeA;
		} else if (typeA.kind === "ANY") {
			return typeB;
		}
	}

	if (typeA.kind === "UNION" && typeB.kind === "UNION") {
		if (collapseAny) {
			if (typeA.types.some(t => t.kind === "ANY")) {
				return typeB;
			}

			if (typeB.types.some(t => t.kind === "ANY")) {
				return typeA;
			}
		}

		return {
			...typeA,
			types: Array.from(new Set([...typeA.types, ...typeB.types]))
		};
	}

	return {
		kind: "UNION",
		types: [typeA, typeB]
	} as SimpleTypeUnion;
}

function mergeNamedRelated<T extends { name: string; related?: T[] }>(items: Iterable<T>): ReadonlyMap<string, T> {
	const merged = new Map<string, T>();

	for (const item of items) {
		// For now, lowercase all names because "parse5" doesn't distinguish between uppercase and lowercase
		const name = item.name.toLowerCase();

		const existingItem = merged.get(name);

		if (existingItem != null) {
			merged.set(name, {
				...item,
				related: existingItem.related == null ? [existingItem, item] : [existingItem.related, item]
			});
		} else {
			merged.set(name, item);
		}
	}

	return merged;
}

function mergeRelatedSlots(slots: Iterable<HtmlSlot>): ReadonlyMap<string, HtmlSlot> {
	return mergeNamedRelated(slots);
}

function mergeRelatedCssParts(cssParts: Iterable<HtmlCssPart>): ReadonlyMap<string, HtmlCssPart> {
	return mergeNamedRelated(cssParts);
}

function mergeRelatedCssProperties(cssProperties: Iterable<HtmlCssPart>): ReadonlyMap<string, HtmlCssProperty> {
	return mergeNamedRelated(cssProperties);
}

function mergeRelatedEvents(events: Iterable<HtmlEvent>): ReadonlyMap<string, HtmlEvent> {
	const mergedAttrs = new Map<string, HtmlEvent>();
	for (const event of events) {
		// For now, lowercase all names because "parse5" doesn't distinguish between uppercase and lowercase
		const name = event.name.toLowerCase();

		const existingEvent = mergedAttrs.get(name);
		if (existingEvent == null) {
			mergedAttrs.set(name, event);
		} else {
			const prevType = existingEvent.getType;
			mergedAttrs.set(name, {
				...existingEvent,
				global: existingEvent.global && event.global,
				description: undefined,
				getType: lazy(() => mergeRelatedTypeToUnion(prevType(), event.getType(), { collapseAny: false })),
				related: existingEvent.related == null ? [existingEvent, event] : [...existingEvent.related, event],
				fromTagName: existingEvent.fromTagName || event.fromTagName
			});
		}
	}
	return mergedAttrs;
}

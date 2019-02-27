import * as tsModule from "typescript";
import { SourceFile } from "typescript";
import * as ts from "typescript/lib/tsserverlibrary";
import { ComponentTagName } from "../parsing/parse-components/component-types";
import { HtmlAttr, HtmlTag } from "../parsing/parse-html-data/html-tag";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../parsing/text-document/html-document/parse-html-node/types/html-node-attr-types";
import { HtmlNode } from "../parsing/text-document/html-document/parse-html-node/types/html-node-types";
import { AttributeDeclaration, ComponentDeclaration, ComponentDefinition, PropertyDeclaration } from "../parsing/web-component-analyzer/types/component-types";
import { EventDeclaration } from "../parsing/web-component-analyzer/types/event-types";
import { AttrName, FileName, TagName } from "../types/alias";
import { caseInsensitiveCmp } from "../util/util";
import { Config } from "./config";

/**
 * The main store that this ts-plugin uses.
 */
export class TsLitPluginStore {
	config!: Config;

	importedComponentDefinitionsInFile = new Map<FileName, ComponentDefinition[]>();
	definitionsInFile = new Map<FileName, ComponentDefinition[]>();
	private definitions = new Map<TagName, ComponentDefinition>();

	private globalTags = new Map<TagName, HtmlTag>();
	private globalAttributes = new Map<AttrName, HtmlAttr>();

	//private globalEvents = new Map<EventName, HtmlAttr>();

	get allHtmlTags(): HtmlTag[] {
		return Array.from(this.globalTags.values());
	}

	get allGlobalHtmlTagAttrs(): HtmlAttr[] {
		return Array.from(this.globalAttributes.values());
	}

	constructor(public ts: typeof tsModule, public info: ts.server.PluginCreateInfo) {}

	absorbComponentDefinitions(sourceFile: SourceFile, definitions: ComponentDefinition[]) {
		this.definitionsInFile.set(sourceFile.fileName, definitions);

		definitions.forEach(definition => {
			this.definitions.set(definition.tagName, definition);
		});
	}

	absorbHtmlTags(htmlTags: HtmlTag[]) {
		htmlTags.forEach(htmlTag => {
			this.globalTags.set(htmlTag.name, htmlTag);
		});
	}

	absorbGlobalHtmlAttributes(htmlAttrs: HtmlAttr[]) {
		htmlAttrs.forEach(htmlAttr => {
			this.globalAttributes.set(htmlAttr.name, htmlAttr);
		});
	}

	getDefinitionsWithDeclarationInFile(sourceFile: SourceFile): ComponentDefinition[] {
		return Array.from(this.definitions.values()).filter(d => [d.declaration.node, ...(d.declaration.extends || [])].map(n => n.getSourceFile()).find(sf => sf.fileName === sourceFile.fileName));
	}

	getDefinitionForTagName(tagName: TagName): ComponentDefinition | undefined {
		return this.definitions.get(tagName);
	}

	getAttributeDeclaration(htmlNodeAttr: HtmlNodeAttr): PropertyDeclaration | AttributeDeclaration | EventDeclaration | undefined {
		const decl = this.getComponentDeclaration(htmlNodeAttr.htmlNode);
		if (decl == null) return undefined;

		switch (htmlNodeAttr.kind) {
			case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
			case HtmlNodeAttrKind.ATTRIBUTE:
				return decl.attributes.find(attr => caseInsensitiveCmp(attr.name, htmlNodeAttr.name));
			case HtmlNodeAttrKind.EVENT_LISTENER:
				return decl.events.find(event => caseInsensitiveCmp(event.name, htmlNodeAttr.name));
			case HtmlNodeAttrKind.PROP:
				return decl.properties.find(prop => prop.name === htmlNodeAttr.name);
		}
	}

	getComponentDeclaration(htmlNode: HtmlNode): ComponentDeclaration | undefined {
		const htmlTag = this.getHtmlTag(htmlNode);
		return htmlTag == null ? undefined : this.definitions.has(htmlTag.name) ? this.definitions.get(htmlTag.name)!.declaration : undefined;
	}

	getComponentDefinition(htmlNode: HtmlNode): ComponentDefinition | undefined {
		const htmlTag = this.getHtmlTag(htmlNode);
		return htmlTag == null ? undefined : this.definitions.get(htmlTag.name);
	}

	getHtmlTagAttrs(htmlNode: HtmlNode): HtmlAttr[] {
		const htmlTag = this.getHtmlTag(htmlNode);

		return [...((htmlTag != null ? htmlTag.attributes : []) || []), ...this.allGlobalHtmlTagAttrs];
	}

	getHtmlTag(htmlNode: HtmlNode): HtmlTag | undefined {
		return this.globalTags.get(htmlNode.tagName);
	}

	getHtmlTagAttr(htmlAttr: HtmlNodeAttr): HtmlAttr | undefined {
		const htmlTag = this.globalTags.get(htmlAttr.htmlNode.tagName);

		if (htmlTag != null) {
			const result = htmlTag.attributes.find(htmlTagAttr => caseInsensitiveCmp(htmlTagAttr.name, htmlAttr.name));

			if (result != null) {
				return result;
			}
		}

		return this.globalAttributes.get(htmlAttr.name);
	}

	invalidateTagsDefinedInFile(sourceFile: SourceFile) {
		const definitions = this.definitionsInFile.get(sourceFile.fileName) || [];

		definitions.forEach(definition => {
			this.globalTags.delete(definition.tagName);
			this.definitions.delete(definition.tagName);
		});
	}

	/**
	 * Returns if a component for a specific file has been imported.
	 * @param fileName
	 * @param tagName
	 */
	hasTagNameBeenImported(fileName: string, tagName: ComponentTagName): boolean {
		for (const file of this.importedComponentDefinitionsInFile.get(fileName) || []) {
			if (file.tagName === tagName) {
				return true;
			}
		}

		return false;
	}
}

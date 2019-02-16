import * as tsModule from "typescript";
import { SourceFile } from "typescript";
import * as ts from "typescript/lib/tsserverlibrary";
import { ComponentTagName, IComponentDeclaration, IComponentDeclarationProp, IComponentDefinition } from "../parsing/parse-components/component-types";
import { HtmlTag, HtmlTagAttr } from "../parsing/parse-html-data/html-tag";
import { TextDocument } from "../parsing/text-document/text-document";
import { AttrName, FileName, TagName } from "../types/alias";
import { HtmlNodeAttr } from "../types/html-node-attr-types";
import { HtmlNode } from "../types/html-node-types";
import { HtmlReport } from "../types/html-report-types";
import { caseInsensitiveCmp } from "../util/util";
import { Config } from "./config";

/**
 * The main store that this ts-plugin uses.
 */
export class TsLitPluginStore {
	config!: Config;

	importedComponentDefinitionsInFile = new Map<FileName, IComponentDefinition[]>();
	definitionsInFile = new Map<FileName, IComponentDefinition[]>();
	private definitions = new Map<TagName, IComponentDefinition>();
	private tags = new Map<TagName, HtmlTag>();
	private attributes = new Map<AttrName, HtmlTagAttr>();
	private documents = new WeakMap<SourceFile, TextDocument[]>();
	private htmlReportsForHtml = new WeakMap<HtmlNode | HtmlNodeAttr, HtmlReport[]>();

	get allHtmlTags(): HtmlTag[] {
		return Array.from(this.tags.values());
	}

	get allGlobalHtmlTagAttrs(): HtmlTagAttr[] {
		return Array.from(this.attributes.values());
	}

	constructor(public ts: typeof tsModule, public info: ts.server.PluginCreateInfo) {}

	absorbHtmlDefinitions(sourceFile: SourceFile, definitions: IComponentDefinition[]) {
		this.definitionsInFile.set(sourceFile.fileName, definitions);

		definitions.forEach(definition => {
			this.definitions.set(definition.tagName, definition);
		});
	}

	absorbHtmlTags(htmlTags: HtmlTag[]) {
		htmlTags.forEach(htmlTag => {
			this.tags.set(htmlTag.name, htmlTag);
		});
	}

	absorbGlobalHtmlAttributes(htmlAttrs: HtmlTagAttr[]) {
		htmlAttrs.forEach(htmlAttr => {
			this.attributes.set(htmlAttr.name, htmlAttr);
		});
	}

	absorbDocumentsForFile(sourceFile: SourceFile, documents: TextDocument[]) {
		this.documents.set(sourceFile, documents);
	}

	absorbReports(source: HtmlNode | HtmlNodeAttr, reports: HtmlReport[]) {
		this.htmlReportsForHtml.set(source, reports);
	}

	getDefinitionsWithDeclarationInFile(sourceFile: SourceFile): IComponentDefinition[] {
		return Array.from(this.definitions.values()).filter(d => d.declaration.fileName === sourceFile.fileName);
	}

	getDefinitionForTagName(tagName: TagName): IComponentDefinition | undefined {
		return this.definitions.get(tagName);
	}

	getComponentDeclarationProp(htmlNodeAttr: HtmlNodeAttr): IComponentDeclarationProp | undefined {
		const decl = this.getComponentDeclaration(htmlNodeAttr.htmlNode);
		return decl == null ? undefined : decl.props.find(prop => caseInsensitiveCmp(prop.name, htmlNodeAttr.name));
	}

	getComponentDeclaration(htmlNode: HtmlNode): IComponentDeclaration | undefined {
		const htmlTag = this.getHtmlTag(htmlNode);
		return htmlTag == null ? undefined : this.definitions.has(htmlTag.name) ? this.definitions.get(htmlTag.name)!.declaration : undefined;
	}

	getHtmlTagAttrs(htmlNode: HtmlNode): HtmlTagAttr[] {
		const htmlTag = this.getHtmlTag(htmlNode);

		return [...((htmlTag != null ? htmlTag.attributes : []) || []), ...this.allGlobalHtmlTagAttrs];
	}

	getHtmlTag(htmlNode: HtmlNode): HtmlTag | undefined {
		return this.tags.get(htmlNode.tagName);
	}

	getHtmlTagAttr(htmlAttr: HtmlNodeAttr): HtmlTagAttr | undefined {
		const htmlTag = this.tags.get(htmlAttr.htmlNode.tagName);

		if (htmlTag != null) {
			const result = htmlTag.attributes.find(htmlTagAttr => caseInsensitiveCmp(htmlTagAttr.name, htmlAttr.name));

			if (result != null) {
				return result;
			}
		}

		return this.attributes.get(htmlAttr.name);
	}

	getReportsForHtmlNodeOrAttr(source: HtmlNode | HtmlNodeAttr): HtmlReport[] {
		return this.htmlReportsForHtml.get(source) || [];
	}

	getDocumentsForFile(file: SourceFile): TextDocument[] {
		return this.documents.get(file) || [];
	}

	invalidateTagsDefinedInFile(sourceFile: SourceFile) {
		const definitions = this.definitionsInFile.get(sourceFile.fileName) || [];

		definitions.forEach(definition => {
			this.tags.delete(definition.tagName);
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

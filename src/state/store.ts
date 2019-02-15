import * as tsModule from "typescript";
import { SourceFile } from "typescript";
import * as ts from "typescript/lib/tsserverlibrary";
import { ExtensionCollectionExtension } from "../extensions/extension-collection-extension";
import { HtmlDocumentCollection } from "../parsing/html-document/html-document-collection";
import { ComponentTagName, IComponentDeclaration, IComponentDeclarationProp, IComponentsInFile } from "../parsing/parse-components/component-types";
import { HtmlTag, HtmlTagAttr } from "../parsing/parse-data/html-tag";
import { HtmlNodeAttr } from "../types/html-node-attr-types";
import { HtmlNode } from "../types/html-node-types";
import { HtmlReport } from "../types/html-report-types";
import { Config } from "./config";

export type FileName = string;

/**
 * The main store that this ts-plugin uses.
 */
export class TsLitPluginStore {
	config!: Config;

	extension = new ExtensionCollectionExtension([]);
	componentsInFile = new Map<FileName, IComponentsInFile>();
	importedComponentsInFile = new Map<FileName, IComponentsInFile[]>();
	allTagNameFileNames = new Map<ComponentTagName, FileName>();
	allComponents = new Map<ComponentTagName, IComponentDeclaration>();

	// NEW
	declarations = new Map<HtmlTag, IComponentDeclaration>();
	tags = new Map<string, HtmlTag>();
	attributes = new Map<string, HtmlTagAttr>();

	// Deprecated???
	private htmlReportsForHtml = new WeakMap<HtmlNode | HtmlNodeAttr, HtmlReport[]>();
	private htmlDocumentCache = new WeakMap<SourceFile, HtmlDocumentCollection>();

	get allHtmlTags(): HtmlTag[] {
		return Array.from(this.tags.values());
	}

	get allGlobalHtmlTagAttrs(): HtmlTagAttr[] {
		return Array.from(this.attributes.values());
	}

	constructor(public ts: typeof tsModule, public info: ts.server.PluginCreateInfo) {}

	getComponentDeclarationProp(htmlAttr: HtmlNodeAttr): IComponentDeclarationProp | undefined {
		return undefined;
	}

	getComponentDeclaration(tagName: string): IComponentDeclaration | undefined {
		return undefined;
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
			const result = htmlTag.attributes.find(htmlTagAttr => htmlTagAttr.name === htmlAttr.name);

			if (result != null) {
				return result;
			}
		}

		return this.attributes.get(htmlAttr.name);
	}

	getReportsForHtmlNodeOrAttr(source: HtmlNode | HtmlNodeAttr): HtmlReport[] {
		return this.htmlReportsForHtml.get(source) || [];
	}

	absorbReports(source: HtmlNode | HtmlNodeAttr, reports: HtmlReport[]) {
		this.htmlReportsForHtml.set(source, reports);
	}

	/**
	 * Returns all html documents in a specific file.
	 * @param file
	 */
	getDocumentsCollectionForFile(file: SourceFile): HtmlDocumentCollection {
		return this.htmlDocumentCache.get(file) || new HtmlDocumentCollection(file, [], this.ts);
	}

	/**
	 * Returns if a component for a specific file has been imported.
	 * @param fileName
	 * @param tagName
	 */
	hasTagNameBeenImported(fileName: string, tagName: ComponentTagName): boolean {
		for (const file of this.importedComponentsInFile.get(fileName) || []) {
			if (file.components.has(tagName)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Saves html documents for a specific source file.
	 * @param sourceFile
	 * @param documentCollection
	 */
	absorbHtmlDocumentCollection(sourceFile: SourceFile, documentCollection: HtmlDocumentCollection) {
		this.htmlDocumentCache.set(sourceFile, documentCollection);
	}

	/**
	 * Saves components for a specific source file.
	 * @param sourceFile
	 * @param result
	 */
	absorbComponentsInFile(sourceFile: SourceFile, result: IComponentsInFile) {
		// Absorb the new file result and elements
		this.componentsInFile.set(sourceFile.fileName, result);
		Array.from(result.components.entries()).forEach(([tagName, element]) => {
			this.allComponents.set(tagName, element);
			this.allTagNameFileNames.set(tagName, sourceFile.fileName);
		});
	}

	/**
	 * Removes all information about a source file in order to clear the cache.
	 * @param sourceFile
	 */
	invalidateSourceFile(sourceFile: SourceFile) {
		this.importedComponentsInFile.delete(sourceFile.fileName);

		const existingResult = this.componentsInFile.get(sourceFile.fileName);
		if (existingResult != null) {
			Array.from(existingResult.components.entries()).forEach(([tagName]) => {
				this.allComponents.delete(tagName);
				this.allTagNameFileNames.delete(tagName);
			});
		}
	}
}

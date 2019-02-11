import * as tsModule from "typescript";
import { SourceFile } from "typescript";
import * as ts from "typescript/lib/tsserverlibrary";
import { ExtensionCollectionExtension } from "../extensions/extension-collection-extension";
import { HtmlDocumentCollection } from "../html-document/html-document-collection";
import { IHtmlAttrBase } from "../html-document/types/html-attr-types";
import { IHtmlNodeBase } from "../html-document/types/html-node-types";
import { IHtmlReportBase } from "../html-document/types/html-report-types";
import { ComponentTagName, IComponentDeclaration, IComponentsInFile } from "../parse-components/component-types";
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
	private htmlReportsForHtml = new Map<IHtmlNodeBase | IHtmlAttrBase, IHtmlReportBase[]>();
	private htmlDocumentCache = new WeakMap<SourceFile, HtmlDocumentCollection>();

	constructor(public ts: typeof tsModule, public info: ts.server.PluginCreateInfo) {}

	getReportsForHtmlNodeOrAttr(source: IHtmlNodeBase | IHtmlAttrBase): IHtmlReportBase[] {
		return this.htmlReportsForHtml.get(source) || [];
	}

	absorbReports(source: IHtmlNodeBase | IHtmlAttrBase, reports: IHtmlReportBase[]) {
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

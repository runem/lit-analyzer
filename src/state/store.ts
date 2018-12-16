import { basename } from "path";
import * as tsModule from "typescript";
import { SourceFile } from "typescript";
import * as ts from "typescript/lib/tsserverlibrary";
import { ExtensionCollectionExtension } from "../extensions/extension-collection-extension";
import { ComponentTagName, IComponentDeclaration, IComponentsInFile } from "../parse-components/component-types";
import { IHtmlTemplateResult } from "../parse-html-nodes/i-html-template-result";
import { IHtmlTemplate } from "../parse-html-nodes/types/html-node-types";
import { logger } from "../util/logger";
import { IConfig } from "./config";

export type FileName = string;

/**
 * The main store that this ts-plugin uses.
 */
export class TsHtmlPluginStore {
	config!: IConfig;
	extension = new ExtensionCollectionExtension([]);

	htmlTemplatesInFile = new Map<FileName, IHtmlTemplateResult>();
	componentsInFile = new Map<FileName, IComponentsInFile>();
	importedComponentsInFile = new Map<FileName, IComponentsInFile[]>();

	allTagNameFileNames = new Map<ComponentTagName, FileName>();
	allComponents = new Map<ComponentTagName, IComponentDeclaration>();

	constructor(public ts: typeof tsModule, public info: ts.server.PluginCreateInfo) {}

	/**
	 * Returns all html templates in a specific file.
	 * @param fileName
	 */
	getHtmlTemplatesForFile(fileName: string): IHtmlTemplate[] {
		const templateResultForFile = this.htmlTemplatesInFile.get(fileName);
		return templateResultForFile ? templateResultForFile.templates : [];
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
	 * Prints the state of this store.
	 */
	printState() {
		logger.debug("====== State ======");
		logger.debug("File Results", this.componentsInFile.size);
		logger.debug(
			"Components In Scope",
			this.importedComponentsInFile.size,
			Array.from(this.importedComponentsInFile.entries())
				.map(([fileName, r]) => `${basename(fileName)}: ${r.map(rr => Array.from(rr.components.keys()).join(","))}`)
				.join(" | ")
		);
		logger.debug("Elements", this.allComponents.size, Array.from(this.allComponents.keys()));
		logger.debug("Html Templates", this.allComponents.size, Array.from(this.htmlTemplatesInFile.values()).reduce((acc, c) => acc + c.templates.length, 0));
		logger.debug("===================");
	}

	/**
	 * Saves html templates for a specific source file.
	 * @param sourceFile
	 * @param result
	 */
	absorbHtmlTemplateResult(sourceFile: SourceFile, result: IHtmlTemplateResult) {
		this.htmlTemplatesInFile.set(sourceFile.fileName, result);
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

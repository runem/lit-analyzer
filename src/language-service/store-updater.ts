import { LanguageService, Program, SourceFile, TypeChecker } from "typescript";
import { analyzeComponents, analyzeLibDomHtmlElement } from "web-component-analyzer";
import { convertAnalyzeResultToHtmlCollection, convertComponentDeclarationToHtmlTag } from "../parsing/convert-component-definitions-to-html-collection";
import { parseDependencies } from "../parsing/parse-dependencies/parse-dependencies";
import { HtmlStoreDataSource, TsLitPluginStore } from "../state/store";
import { changedSourceFileIterator } from "../util/changed-source-file-iterator";

export type UpdateType = "cmps" | "deps";

export class StoreUpdater {
	componentSourceFileIterator = changedSourceFileIterator();
	private analyzedHtmlElement = false;

	private get program(): Program {
		return this.prevLangService.getProgram()!;
	}

	private get checker(): TypeChecker {
		return this.program.getTypeChecker();
	}

	constructor(private prevLangService: LanguageService, private store: TsLitPluginStore) {}

	update(sourceFile: SourceFile, updates: UpdateType[] = ["cmps", "deps"]) {
		if (updates.includes("cmps")) this.findInvalidatedComponents();
		if (updates.includes("deps")) this.findDependencies(sourceFile);

		if (!this.analyzedHtmlElement) {
			const result = analyzeLibDomHtmlElement(this.program, this.store.ts);
			if (result != null) {
				const extension = convertComponentDeclarationToHtmlTag(result, undefined, { checker: this.checker });
				this.store.absorbSubclassExtension("HTMLElement", extension);
			}
			this.analyzedHtmlElement = true;
		}
	}

	private findInvalidatedComponents() {
		const seenFiles = new WeakSet<SourceFile>();
		const invalidatedFiles = new Set<SourceFile>();

		// Find components in all changed files
		for (const sourceFile of this.componentSourceFileIterator(this.program.getSourceFiles())) {
			seenFiles.add(sourceFile);

			this.store.getDefinitionsWithDeclarationInFile(sourceFile).forEach(definition => {
				const sf = this.program.getSourceFile(definition.node.getSourceFile().fileName);
				if (sf != null) {
					invalidatedFiles.add(sf);
				}
			});

			this.findComponents(sourceFile);
		}

		for (const sourceFile of invalidatedFiles) {
			if (!seenFiles.has(sourceFile)) {
				this.findComponents(sourceFile);
			}
		}
	}

	private findDependencies(sourceFile: SourceFile) {
		if (this.store.config.skipMissingImports) return;

		// Build a graph of component dependencies
		const res = parseDependencies(sourceFile, this.store);
		this.store.importedComponentDefinitionsInFile.set(sourceFile.fileName, res);
	}

	private findComponents(sourceFile: SourceFile) {
		const analyzeResult = analyzeComponents(sourceFile, {
			checker: this.checker,
			ts: this.store.ts,
			config: { /*diagnostics: true, */ analyzeLibDom: true, excludedDeclarationNames: ["HTMLElement"] }
		});

		this.store.forgetTagsDefinedInFile(sourceFile);
		this.store.absorbAnalysisResult(sourceFile, analyzeResult);

		const htmlCollection = convertAnalyzeResultToHtmlCollection(analyzeResult, {
			checker: this.checker,
			addDeclarationPropertiesAsAttributes: true
		});
		this.store.absorbCollection(htmlCollection, HtmlStoreDataSource.DECLARED);
	}
}

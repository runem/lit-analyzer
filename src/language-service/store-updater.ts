import { LanguageService, Program, SourceFile, TypeChecker } from "typescript";
import { convertComponentDefinitionsToHtmlTags } from "../parsing/convert-component-definitions-to-html-tags";
import { parseDependencies } from "../parsing/parse-dependencies/parse-dependencies";
import { parseComponentsInFile } from "../parsing/web-component-analyzer/parse-components-in-file";
import { TsLitPluginStore } from "../state/store";
import { changedSourceFileIterator } from "../util/changed-source-file-iterator";

export type UpdateType = "cmps" | "deps";

export class StoreUpdater {
	componentSourceFileIterator = changedSourceFileIterator();

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
		const componentDefinitions = parseComponentsInFile(sourceFile, this.checker);

		this.store.invalidateTagsDefinedInFile(sourceFile);
		this.store.absorbComponentDefinitions(sourceFile, componentDefinitions.componentDefinitions);

		const htmlTags = componentDefinitions.componentDefinitions.map(definition => convertComponentDefinitionsToHtmlTags(definition, this.checker));
		this.store.absorbHtmlTags(htmlTags);
	}
}

import * as tsModule from "typescript";
import { Node, Program } from "typescript";
import { IComponentsInFile } from "../parse-components/component-types";
import { logger } from "../util/logger";

interface IVisitDependenciesContext {
	program: Program;
	ts: typeof tsModule;
	project: ts.server.Project;
	lockedFiles: string[];
	customElementResultForFile(fileName: string): IComponentsInFile | undefined;
	allComponentsInFileScope(fileName: string): IComponentsInFile[] | undefined;
	addComponentsForFile(fileName: string, results: IComponentsInFile[], isCircular: boolean): void;
	addCircularReference(fromFileName: string, toFileName: string): void;
}

/**
 * Visits dependencies recursively.
 * @param node
 * @param context
 */
export function visitDependencies(node: Node, context: IVisitDependenciesContext) {
	if (context.ts.isSourceFile(node)) {
		let components = context.allComponentsInFileScope(node.fileName);

		if (components != null) {
			// It's already cached
			context.addComponentsForFile(node.fileName, components, false);
		} else {
			const resultForFile = context.customElementResultForFile(node.fileName);
			components = resultForFile != null ? [resultForFile] : [];
			let isCircular = false;

			// Pick up all new components and add them to the scope of this file.
			const newContext: IVisitDependenciesContext = {
				...context,

				// Expand locked files with this file
				lockedFiles: [...context.lockedFiles, node.fileName],

				addComponentsForFile(fileName: string, newResults: IComponentsInFile[], isCircular: boolean): void {
					context.addComponentsForFile(fileName, newResults, isCircular);
					components!.push(...newResults);
				},
				addCircularReference() {
					isCircular = true;
				}
			};

			node.forEachChild(child => visitDependencies(child, newContext));

			// Filter out duplicates. Eg two files depend on the same elements.
			const uniqueResults = components.filter((v, i, a) => a.indexOf(v) === i);

			context.addComponentsForFile(node.fileName, uniqueResults, isCircular);
		}
	} else if (context.ts.isImportDeclaration(node)) {
		if (context.ts.isStringLiteral(node.moduleSpecifier)) {
			// Resolve the imported string
			const res = context.project.getResolvedModuleWithFailedLookupLocationsFromCache(node.moduleSpecifier.text, node.getSourceFile().fileName);
			const mod = res != null ? res.resolvedModule : res;

			if (mod != null) {
				// Right now, only resolve modules in the same project
				if (!mod.isExternalLibraryImport) {
					const moduleFileName = mod.resolvedFileName;
					const isCircularImport = context.lockedFiles.includes(moduleFileName);

					if (!isCircularImport) {
						const sourceFile = context.program.getSourceFile(moduleFileName);

						if (sourceFile != null) {
							// Visit dependencies in the import recursively
							visitDependencies(sourceFile, context);
						}
					} else {
						// Stop! Prevent infinite loop due to circular imports
						context.addCircularReference(node.getSourceFile().fileName, moduleFileName);
					}
				}
			} else {
				// The module doesn't exists.
				logger.debug("Couldn't find module for ", node.moduleSpecifier.text);
			}
		}
	}
}

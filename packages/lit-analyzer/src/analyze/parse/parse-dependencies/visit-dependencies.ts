import * as tsModule from "typescript";
import { Node, Program, SourceFile } from "typescript";
import { ComponentDefinition } from "web-component-analyzer";

interface IVisitDependenciesContext {
	program: Program;
	ts: typeof tsModule;
	project: ts.server.Project | undefined;
	lockedFiles: string[];
	getDefinitionsInFile(file: SourceFile): ComponentDefinition[] | undefined;
	getImportedDefinitionsInFile(file: SourceFile): ComponentDefinition[] | undefined;
	addDefinitionsForFile(file: SourceFile, results: ComponentDefinition[], isCircular: boolean): void;
	addCircularReference(fromFile: SourceFile, toFile: SourceFile): void;
}

/**
 * Visits dependencies recursively.
 * @param node
 * @param context
 */
export function visitDependencies(node: Node, context: IVisitDependenciesContext) {
	if (node == null) return;

	if (context.ts.isSourceFile(node)) {
		const existingResult = context.getImportedDefinitionsInFile(node);

		if (existingResult != null) {
			// It's already cached
			context.addDefinitionsForFile(node, existingResult, false);
		} else {
			const result = [...(context.getDefinitionsInFile(node) || [])];
			let isCircular = false;

			// Pick up all new components and add them to the scope of this file.
			const newContext: IVisitDependenciesContext = {
				...context,

				// Expand locked files with this file
				lockedFiles: [...context.lockedFiles, node.fileName],

				addDefinitionsForFile(file: SourceFile, newResults: ComponentDefinition[], isCircular: boolean): void {
					context.addDefinitionsForFile(file, newResults, isCircular);
					result.push(...newResults);
				},
				addCircularReference() {
					isCircular = true;
				}
			};

			node.forEachChild(child => visitDependencies(child, newContext));

			// Filter out duplicates in the "components" array. Eg two files depend on the same elements.
			const uniqueResults = Array.from(new Set(result));

			context.addDefinitionsForFile(node, uniqueResults, isCircular);
			return;
		}
	} else if (context.ts.isImportDeclaration(node) || context.ts.isExportDeclaration(node)) {
		if (node.moduleSpecifier != null && context.ts.isStringLiteral(node.moduleSpecifier)) {
			visitModuleWithName(node.moduleSpecifier.text, node, context);
		}
	} else if (context.ts.isCallExpression(node) && node.expression.kind === context.ts.SyntaxKind.ImportKeyword) {
		const moduleSpecifier = node.arguments[0];
		if (moduleSpecifier != null && context.ts.isStringLiteralLike(moduleSpecifier)) {
			visitModuleWithName(moduleSpecifier.text, node, context);
		}
	} else {
		node.forEachChild(child => visitDependencies(child, context));
	}
}

function visitModuleWithName(moduleSpecifier: string, node: Node, context: IVisitDependenciesContext) {
	// Resolve the imported string
	const result = context.project
		? context.project.getResolvedModuleWithFailedLookupLocationsFromCache(moduleSpecifier, node.getSourceFile().fileName)
		: "getResolvedModuleWithFailedLookupLocationsFromCache" in context.program
		? // eslint-disable-next-line @typescript-eslint/no-explicit-any
		  (context.program as any)["getResolvedModuleWithFailedLookupLocationsFromCache"](moduleSpecifier, node.getSourceFile().fileName)
		: undefined;

	const mod = result != null ? result.resolvedModule : undefined;

	if (mod != null) {
		const isCircularImport = context.lockedFiles.includes(mod.resolvedFileName);
		const sourceFile = context.program.getSourceFile(mod.resolvedFileName);

		if (!isCircularImport) {
			if (sourceFile != null) {
				// Visit dependencies in the import recursively
				visitDependencies(sourceFile, context);
			}
		} else if (sourceFile != null) {
			// Stop! Prevent infinite loop due to circular imports
			context.addCircularReference(node.getSourceFile(), sourceFile);
		}
	} else {
		//logger.error("Couldn't find module for ", moduleSpecifier, "from", node.getSourceFile().fileName);
	}
}

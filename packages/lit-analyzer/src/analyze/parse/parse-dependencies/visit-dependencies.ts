import * as tsModule from "typescript";
import { Node, Program, SourceFile, ImportDeclaration } from "typescript";
import { SourceFileWithImport } from "./parse-dependencies";

interface IVisitDependenciesContext {
	program: Program;
	ts: typeof tsModule;
	project: ts.server.Project | undefined;
	directImportCache: WeakMap<SourceFile, Set<SourceFile>>;
	emitIndirectImport(sourceFileWithImport: SourceFileWithImport): boolean;
	emitDirectImport?(file: SourceFile, importDeclaration: ImportDeclaration): void;
	depth?: number;
	maxExternalDepth?: number;
	maxInternalDepth?: number;
	importDeclaration?: ImportDeclaration;
}

/**
 * Visits all indirect imports from a source file
 * Emits them using "emitIndirectImport" callback
 * @param sourceFile
 * @param context
 */
export function visitIndirectImportsFromSourceFile(sourceFile: SourceFile, context: IVisitDependenciesContext): void {
	const currentDepth = context.depth ?? 0;
	// Emit a visit. If this file has been seen already, the function will return false, and traversal will stop
	if (!context.emitIndirectImport({ sourceFile, importDeclaration: context.importDeclaration ?? "rootSourceFile" })) {
		return;
	}

	const inExternal = context.program.isSourceFileFromExternalLibrary(sourceFile);

	// Check if we have traversed too deep
	if (inExternal && currentDepth >= (context.maxExternalDepth ?? Infinity)) {
		return;
	} else if (!inExternal && currentDepth >= (context.maxInternalDepth ?? Infinity)) {
		return;
	}

	// Get all direct imports from the cache
	let directImports = context.directImportCache.get(sourceFile);
	const importDeclarations = new Map<SourceFile, ImportDeclaration>();

	if (directImports == null || context.importDeclaration == null) {
		// If the cache didn't have all direct imports, build up using the visitor function
		directImports = new Set<SourceFile>();

		const newContext = {
			...context,
			emitDirectImport(file: SourceFile, importDeclaration: ImportDeclaration) {
				directImports!.add(file);
				importDeclarations.set(file, importDeclaration);
			}
		};

		// Emit all direct imports
		visitDirectImports(sourceFile, newContext);

		// Cache the result
		context.directImportCache.set(sourceFile, directImports);
	} else {
		// Updated references to newest source files
		const updatedImports = new Set<SourceFile>();
		for (const sf of directImports) {
			const updatedSf = context.program.getSourceFile(sf.fileName);
			if (updatedSf != null) {
				updatedImports.add(updatedSf);
			}
		}
		directImports = updatedImports;
	}

	// Call this function recursively on all direct imports from this source file
	for (const file of directImports) {
		const toExternal = context.program.isSourceFileFromExternalLibrary(file);
		const fromProjectToExternal = !inExternal && toExternal;

		// It's possible to only follow external dependencies from the source file of interest (depth 0)
		/*if (fromProjectToExternal && currentDepth !== 0) {
		 continue;
		 }*/

		// Calculate new depth. Reset depth to 1 if we go from a project module to an external module.
		// This will make sure that we always go X modules deep into external modules
		let newDepth;
		if (fromProjectToExternal) {
			newDepth = 1;
		} else {
			newDepth = currentDepth + 1;
		}

		if (isFacadeModule(file, context.ts)) {
			// Facade modules are ignored when calculating depth
			newDepth--;
		}

		const importDeclaration = context.importDeclaration ?? importDeclarations.get(file);

		// Visit direct imported source files recursively
		visitIndirectImportsFromSourceFile(file, {
			...context,
			importDeclaration,
			depth: newDepth
		});
	}
}

/**
 * Visits all direct imports in an AST.
 * Emits them using "emitDirectImport"
 * @param node
 * @param context
 */
function visitDirectImports(node: Node, context: IVisitDependenciesContext): void {
	if (node == null) return;

	// Handle top level imports/exports: (import "..."), (import { ... } from "..."), (export * from "...")
	if ((context.ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly) || (context.ts.isExportDeclaration(node) && !node.isTypeOnly)) {
		if (node.moduleSpecifier != null && context.ts.isStringLiteral(node.moduleSpecifier) && context.ts.isSourceFile(node.parent)) {
			// Potentially ignore all imports/exports with named imports/exports because importing an interface would not
			//    necessarily result in the custom element being defined. An even better solution would be to ignore all
			//    import declarations with only interface-like/type-alias imports.
			/*if (("importClause" in node && node.importClause != null) || ("exportClause" in node && node.exportClause != null)) {
			 return;
			 }*/

			emitDirectModuleImportWithName(node.moduleSpecifier.text, node, context);
		}
	}

	// Handle async imports (await import(...))
	else if (context.ts.isCallExpression(node) && node.expression.kind === context.ts.SyntaxKind.ImportKeyword) {
		const moduleSpecifier = node.arguments[0];
		if (moduleSpecifier != null && context.ts.isStringLiteralLike(moduleSpecifier)) {
			emitDirectModuleImportWithName(moduleSpecifier.text, node, context);
		}
	}

	node.forEachChild(child => visitDirectImports(child, context));
}

/**
 * Resolves and emits a direct imported module
 * @param moduleSpecifier
 * @param node
 * @param context
 */
function emitDirectModuleImportWithName(moduleSpecifier: string, node: Node, context: IVisitDependenciesContext) {
	const fromSourceFile = node.getSourceFile();

	// Resolve the imported string
	const result = context.project
		? context.project.getResolvedModuleWithFailedLookupLocationsFromCache(moduleSpecifier, fromSourceFile.fileName)
		: "getResolvedModuleWithFailedLookupLocationsFromCache" in context.program
		? // eslint-disable-next-line @typescript-eslint/no-explicit-any
		  (context.program as any)["getResolvedModuleWithFailedLookupLocationsFromCache"](moduleSpecifier, fromSourceFile.fileName)
		: undefined;

	if (result?.resolvedModule?.resolvedFileName != null) {
		const resolvedModule = result.resolvedModule;
		const sourceFile = context.program.getSourceFile(resolvedModule.resolvedFileName);
		if (sourceFile != null) {
			const importDeclaration = node as ImportDeclaration;
			context.emitDirectImport?.(sourceFile, importDeclaration);
		}
	}
}

/**
 * Returns whether a SourceFile is a Facade Module.
 * A Facade Module only consists of import and export declarations.
 * @param sourceFile
 * @param ts
 */
export function isFacadeModule(sourceFile: SourceFile, ts: typeof tsModule): boolean {
	const statements = sourceFile.statements;
	const isFacade = statements.every(statement => {
		return ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement);
	});
	return isFacade;
}

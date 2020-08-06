import { analyzeSourceFile } from "web-component-analyzer";
import { SourceFile } from "typescript";
import { convertAnalyzeResultToHtmlCollection } from "../parse/convert-component-definitions-to-html-collection";
import { HtmlDataSourceKind } from "../store/html-store/html-data-source-merged";
import { IVisitDependenciesContext } from "../parse/parse-dependencies/visit-dependencies";

/**
 * Gets Component Definitions in a symlinked file.
 * @param file
 * @param context
 */
export function findComponentDefinitionsInSymlinkedFile(file: SourceFile, context: IVisitDependenciesContext): void {
	const { definitionStore, htmlStore, program, ts } = context;
	const analyzeResult = analyzeSourceFile(file, {
		program: program,
		ts: ts,
		config: {
			features: ["event", "member", "slot", "csspart", "cssproperty"],
			analyzeGlobalFeatures: true,
			analyzeDefaultLib: true,
			analyzeDependencies: true,
			analyzeAllDeclarations: false,
			excludedDeclarationNames: ["HTMLElement"]
		}
	});

	definitionStore.absorbAnalysisResult(file, analyzeResult);
	const htmlCollection = convertAnalyzeResultToHtmlCollection(analyzeResult, {
		checker: program.getTypeChecker(),
		addDeclarationPropertiesAsAttributes: program.isSourceFileFromExternalLibrary(file)
	});

	htmlStore.absorbCollection(htmlCollection, HtmlDataSourceKind.DECLARED);
}

/**
 * Gets a symlinked SourceFile using the actual path of the symlinked
 * file rather than the path that the symlink resolves to.
 * @param originalPath
 * @param project
 */
export function getSourceFileFromSymlinkedDependency(originalPath: string, project?: ts.server.Project): SourceFile | undefined {
	if (project == null) return undefined;
	const path = project.projectService.toPath(originalPath);
	const normalizedPath: ts.server.NormalizedPath = (path as unknown) as ts.server.NormalizedPath;
	const scriptInfo = project.projectService.getOrCreateScriptInfoForNormalizedPath(normalizedPath, false);
	if (scriptInfo != null) {
		if (!project.isRoot(scriptInfo)) {
			project.addRoot(scriptInfo, scriptInfo.fileName);
			project.updateGraph();
		}
	}
	return project.getSourceFile(path);
}

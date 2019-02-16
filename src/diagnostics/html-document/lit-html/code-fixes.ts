import { basename, dirname, relative } from "path";
import { isAssignableToPrimitiveType } from "ts-simple-type";
import { CodeFixAction, Node, SourceFile } from "typescript";
import { HtmlNodeAttr } from "../../../types/html-node-attr-types";
import { HtmlNode } from "../../../types/html-node-types";
import { HtmlReport, HtmlReportKind } from "../../../types/html-report-types";
import { rangeToTSSpan } from "../../../util/util";
import { DiagnosticsContext } from "../../diagnostics-context";

export function codeFixesForHtmlNodeReport(htmlNode: HtmlNode, htmlReport: HtmlReport, { sourceFile, store }: DiagnosticsContext): CodeFixAction[] {
	switch (htmlReport.kind) {
		case HtmlReportKind.UNKNOWN:
			if (htmlReport.suggestedName == null) break;

			return [
				{
					fixName: "rename",
					description: `Change spelling to '${htmlReport.suggestedName}'`,
					changes: [
						{
							fileName: sourceFile.fileName,
							textChanges: [
								{
									span: rangeToTSSpan(htmlNode.location.name),
									newText: htmlReport.suggestedName
								}
							]
						}
					]
				}
			];

		case HtmlReportKind.MISSING_IMPORT:
			// Find our where the tag can be found
			const definition = store.getDefinitionForTagName(htmlNode.tagName);
			if (definition == null) break;

			// Get the import path and the position where it can be placed
			const importPath = getRelativePathForImport(sourceFile.fileName, definition.fileName);
			const lastImportIndex = getLastImportIndex(sourceFile, store.ts.isImportDeclaration);

			return [
				{
					fixName: `import`,
					description: `Import "${definition.declaration.meta.className}" from module "${importPath}"`,
					changes: [
						{
							fileName: sourceFile.fileName,
							textChanges: [
								{
									span: { start: lastImportIndex, length: 0 },
									newText: `\nimport "${importPath}";`
								}
							]
						}
					]
				}
			];
	}

	return [];
}

export function codeFixesForHtmlAttrReport(htmlAttr: HtmlNodeAttr, htmlReport: HtmlReport, { sourceFile, store }: DiagnosticsContext): CodeFixAction[] {
	const { start } = htmlAttr.location.name;

	switch (htmlReport.kind) {
		case HtmlReportKind.UNKNOWN:
			if (htmlReport.suggestedName == null) break;

			return [
				{
					fixName: "rename",
					description: `Change spelling to '${htmlReport.suggestedName}'`,
					changes: [
						{
							fileName: sourceFile.fileName,
							textChanges: [
								{
									span: rangeToTSSpan(htmlAttr.location.name),
									newText: htmlReport.suggestedName
								}
							]
						}
					]
				}
			];

		case HtmlReportKind.LIT_BOOL_MOD_ON_NON_BOOL:
		case HtmlReportKind.LIT_PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX:
			const existingModifierLength = htmlAttr.modifier ? htmlAttr.modifier.length : 0;

			const htmlTagAttr = store.getHtmlTagAttr(htmlAttr);
			const newModifier = htmlTagAttr == null ? "." : isAssignableToPrimitiveType(htmlTagAttr.type) ? "" : ".";

			return [
				{
					fixName: `change_modifier`,
					description: newModifier.length === 0 ? `Remove '${htmlAttr.modifier}' modifier` : `Use '${newModifier}' modifier instead`,
					changes: [
						{
							fileName: sourceFile.fileName,
							textChanges: [
								{
									span: {
										start: start - existingModifierLength,
										length: existingModifierLength
									},
									newText: newModifier
								}
							]
						}
					]
				}
			];
	}

	return [];
}

/**
 * Returns the position of the last import line.
 * @param sourceFile
 * @param isImportDeclaration
 */
function getLastImportIndex(sourceFile: SourceFile, isImportDeclaration: (node: Node) => boolean): number {
	let lastImportIndex = 0;

	for (const statement of sourceFile.statements) {
		if (isImportDeclaration(statement)) {
			lastImportIndex = statement.getEnd();
		}
	}

	return lastImportIndex;
}

/**
 * Returns a relative path from a file path to another file path.
 * This path can be used in an import statement.
 * @param fromFileName
 * @param toFileName
 */
function getRelativePathForImport(fromFileName: string, toFileName: string): string {
	const path = relative(dirname(fromFileName), dirname(toFileName));
	const filenameWithoutExt = basename(toFileName).replace(/\.[^/.]+$/, "");
	return `./${path ? `${path}/` : ""}${filenameWithoutExt}`;
}

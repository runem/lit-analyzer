import { basename, dirname, relative } from "path";
import { CodeFixAction, Node, SourceFile } from "typescript";
import { TsLitPluginStore } from "../../state/store";
import { HtmlNodeAttr } from "../../types/html-node-attr-types";
import { HtmlNode, HtmlNodeKind } from "../../types/html-node-types";
import { HtmlReport, HtmlReportKind } from "../../types/html-report-types";
import { rangeToTSSpan } from "../../util/util";

export function codeFixesForHtmlNodeReport(htmlNode: HtmlNode, htmlReport: HtmlReport, file: SourceFile, store: TsLitPluginStore): CodeFixAction[] {
	switch (htmlReport.kind) {
		case HtmlReportKind.UNKNOWN:
			if (htmlReport.suggestedName == null) break;

			return [
				{
					fixName: "rename",
					description: `Change spelling to '${htmlReport.suggestedName}'`,
					changes: [
						{
							fileName: file.fileName,
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
			if (htmlNode.kind !== HtmlNodeKind.COMPONENT) break;

			// Find our where the tag can be found
			const targetFileName = store.allTagNameFileNames.get(htmlNode.tagName);
			if (targetFileName == null) break;

			// Get the import path and the position where it can be placed
			const importPath = getRelativePathForImport(file.fileName, targetFileName);
			const lastImportIndex = getLastImportIndex(file, store.ts.isImportDeclaration);

			return [
				{
					fixName: `import`,
					description: `Import "${htmlNode.component.meta.className}" from module "${importPath}"`,
					changes: [
						{
							fileName: file.fileName,
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

export function codeFixesForHtmlAttrReport(htmlAttr: HtmlNodeAttr, htmlReport: HtmlReport, file: SourceFile, store: TsLitPluginStore): CodeFixAction[] {
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
							fileName: file.fileName,
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
			const modifierLength = htmlAttr.modifier ? htmlAttr.modifier.length : 0;

			return [
				{
					fixName: `change_modifier`,
					description: `Use '.' modifier instead`,
					changes: [
						{
							fileName: file.fileName,
							textChanges: [
								{
									span: {
										start: start - modifierLength,
										length: modifierLength
									},
									newText: "."
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

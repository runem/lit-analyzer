import { DiagnosticsContext } from "../../diagnostics-context";
import { CodeFixKind, LitCodeFix } from "../../types/lit-code-fix";
import { CodeActionKind, LitCodeFixAction } from "../../types/lit-code-fix-action";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../../types/lit-diagnostic";

export function codeFixesForHtmlReport(htmlReport: LitHtmlDiagnostic, { store }: DiagnosticsContext): LitCodeFix[] {
	switch (htmlReport.kind) {
		case LitHtmlDiagnosticKind.UNKNOWN_ATTRIBUTE:
			const dataAttrCodeFix: LitCodeFix = {
				kind: CodeFixKind.RENAME,
				message: `Change attribute to 'data-${htmlReport.htmlAttr.name}'`,
				htmlReport,
				actions: [
					{
						kind: CodeActionKind.DOCUMENT_TEXT_CHANGE,
						change: {
							range: {
								start: htmlReport.htmlAttr.location.name.start,
								end: htmlReport.htmlAttr.location.name.start
							},
							newText: "data-"
						}
					}
				]
			};

			if (htmlReport.suggestedName == null) {
				return [dataAttrCodeFix];
			}
			return [
				dataAttrCodeFix,
				{
					kind: CodeFixKind.RENAME,
					message: `Change attribute to '${htmlReport.suggestedName}'`,
					htmlReport,
					actions: [
						{
							kind: CodeActionKind.DOCUMENT_TEXT_CHANGE,
							change: {
								range: htmlReport.location,
								newText: htmlReport.suggestedName
							}
						}
					]
				}
			];

		case LitHtmlDiagnosticKind.UNKNOWN_TAG:
			if (htmlReport.suggestedName == null) break;

			const { endTag: endTagRange } = htmlReport.htmlNode.location;

			return [
				{
					kind: CodeFixKind.RENAME,
					message: `Change tag name to '${htmlReport.suggestedName}'`,
					htmlReport,
					actions: [
						{
							kind: CodeActionKind.DOCUMENT_TEXT_CHANGE,
							change: {
								range: htmlReport.location,
								newText: htmlReport.suggestedName
							}
						},
						...(endTagRange == null
							? []
							: [
									{
										kind: CodeActionKind.DOCUMENT_TEXT_CHANGE,
										change: {
											range: {
												start: endTagRange.start + 2,
												end: endTagRange.end - 1
											},
											newText: htmlReport.suggestedName
										}
									} as LitCodeFixAction
							  ])
					]
				}
			];

		case LitHtmlDiagnosticKind.BOOL_MOD_ON_NON_BOOL:
		case LitHtmlDiagnosticKind.PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX:
			const { htmlAttr } = htmlReport;

			const existingModifierLength = htmlAttr.modifier ? htmlAttr.modifier.length : 0;

			const htmlTagAttr = store.getHtmlTagAttr(htmlAttr);

			const newModifier = htmlTagAttr == null ? "." : htmlReport.kind === LitHtmlDiagnosticKind.BOOL_MOD_ON_NON_BOOL ? "" : ".";

			return [
				{
					kind: CodeFixKind.CHANGE_LIT_MODIFIER,
					message: newModifier.length === 0 ? `Remove '${htmlAttr.modifier || ""}' modifier` : `Use '${newModifier}' modifier instead`,
					htmlReport,
					actions: [
						{
							kind: CodeActionKind.DOCUMENT_TEXT_CHANGE,
							change: {
								range: {
									start: htmlAttr.location.name.start - existingModifierLength,
									end: htmlAttr.location.name.start
								},
								newText: newModifier
							}
						}
					]
				}
			];

		case LitHtmlDiagnosticKind.MISSING_IMPORT:
			return [
				{
					kind: CodeFixKind.IMPORT_COMPONENT,
					message: `Import "${htmlReport.definition.declaration.name}" from module "${htmlReport.importPath}"`,
					htmlReport,
					actions: [
						{
							kind: CodeActionKind.IMPORT_COMPONENT,
							importPath: htmlReport.importPath
						}
					]
				}
			];
	}

	return [];
}

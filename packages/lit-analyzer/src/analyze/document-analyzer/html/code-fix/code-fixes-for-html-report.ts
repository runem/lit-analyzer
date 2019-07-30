import { LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER } from "../../../constants";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { litAttributeModifierForTarget } from "../../../parse/parse-html-data/html-tag";
import { HtmlNodeAttrKind } from "../../../types/html-node/html-node-attr-types";
import { CodeFixKind, LitCodeFix } from "../../../types/lit-code-fix";
import { CodeActionKind, LitCodeFixAction } from "../../../types/lit-code-fix-action";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../../../types/lit-diagnostic";

export function codeFixesForHtmlReport(htmlReport: LitHtmlDiagnostic, { document, htmlStore }: LitAnalyzerRequest): LitCodeFix[] {
	switch (htmlReport.kind) {
		case LitHtmlDiagnosticKind.UNKNOWN_TARGET: {
			const fixes: LitCodeFix[] = [];

			switch (htmlReport.htmlAttr.kind) {
				case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
				case HtmlNodeAttrKind.ATTRIBUTE:
					fixes.push({
						kind: CodeFixKind.RENAME,
						message: `Change attribute to 'data-${htmlReport.htmlAttr.name}'`,
						htmlReport,
						actions: [
							{
								kind: CodeActionKind.DOCUMENT_TEXT_CHANGE,
								change: {
									range: {
										document,
										start: htmlReport.htmlAttr.location.name.start,
										end: htmlReport.htmlAttr.location.name.start
									},
									newText: "data-"
								}
							}
						]
					});
					break;
			}

			if (htmlReport.suggestedTarget != null) {
				const newText = `${litAttributeModifierForTarget(htmlReport.suggestedTarget)}${htmlReport.suggestedTarget.name}`;
				fixes.push({
					kind: CodeFixKind.RENAME,
					message: `Change ${htmlReport.htmlAttr.kind === HtmlNodeAttrKind.PROPERTY ? "property" : "attribute"} to '${newText}'`,
					htmlReport,
					actions: [
						{
							kind: CodeActionKind.DOCUMENT_TEXT_CHANGE,
							change: {
								// Make a range that includes the modifier.
								range: {
									document,
									start: htmlReport.htmlAttr.location.start,
									end: htmlReport.htmlAttr.location.name.end
								},
								newText
							}
						}
					]
				});
			}

			return fixes;
		}

		case LitHtmlDiagnosticKind.UNKNOWN_TAG: {
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
								range: { document, ...htmlReport.location },
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
												document,
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
		}

		case LitHtmlDiagnosticKind.BOOL_MOD_ON_NON_BOOL:
		case LitHtmlDiagnosticKind.PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX: {
			const { htmlAttr } = htmlReport;

			const existingModifierLength = htmlAttr.modifier ? htmlAttr.modifier.length : 0;

			const htmlAttrTarget = htmlStore.getHtmlAttrTarget(htmlAttr);

			const newModifier = htmlAttrTarget == null ? "." : htmlReport.kind === LitHtmlDiagnosticKind.BOOL_MOD_ON_NON_BOOL ? "" : ".";

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
									document,
									start: htmlAttr.location.name.start - existingModifierLength,
									end: htmlAttr.location.name.start
								},
								newText: newModifier
							}
						}
					]
				}
			];
		}

		case LitHtmlDiagnosticKind.MISSING_IMPORT:
			return [
				{
					kind: CodeFixKind.IMPORT_COMPONENT,
					message: `Import "${htmlReport.definition.declaration.className || "component"}" from module "${htmlReport.importPath}"`,
					htmlReport,
					actions: [
						{
							kind: CodeActionKind.IMPORT_COMPONENT,
							importPath: htmlReport.importPath
						}
					]
				}
			];

		case LitHtmlDiagnosticKind.MISSING_SLOT_ATTRIBUTE:
			return [
				{
					kind: CodeFixKind.ADD_TEXT,
					message: `Add slot attribute.`,
					htmlReport,
					actions: [
						{
							kind: CodeActionKind.DOCUMENT_TEXT_CHANGE,
							change: {
								range: {
									document,
									start: htmlReport.htmlNode.location.name.end,
									end: htmlReport.htmlNode.location.name.end
								},
								newText: ` slot=""`
							}
						}
					]
				}
			];

		case LitHtmlDiagnosticKind.EXPRESSION_ONLY_ASSIGNABLE_WITH_BOOLEAN_BINDING: {
			const newText = `${LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER}${htmlReport.htmlAttr.name}`;

			return [
				{
					kind: CodeFixKind.ADD_TEXT,
					message: `Change to '${newText}'`,
					htmlReport,
					actions: [
						{
							kind: CodeActionKind.DOCUMENT_TEXT_CHANGE,
							change: {
								range: {
									document,
									...htmlReport.htmlAttr.location.name
								},
								newText
							}
						}
					]
				}
			];
		}

		case LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE_UNDEFINED: {
			const { assignment } = htmlReport.htmlAttr;
			return [
				{
					kind: CodeFixKind.ADD_TEXT,
					message: `Use the 'ifDefined' directive.`,
					htmlReport,
					actions: [
						{
							kind: CodeActionKind.DOCUMENT_TEXT_CHANGE,
							change: {
								range: {
									document,
									start: assignment.location.start + 2, // Offset 2 for '${'
									end: assignment.location.end - 1 // Offset 1 for '}'
								},
								newText: `ifDefined(${assignment.expression.getText()})`
							}
						}
					]
				}
			];
		}

		case LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE_NULL: {
			const { assignment } = htmlReport.htmlAttr;
			const newText = `ifDefined(${assignment.expression.getText()} === null ? undefined : ${assignment.expression.getText()})`;
			return [
				{
					kind: CodeFixKind.ADD_TEXT,
					message: `Use '${newText}'`,
					htmlReport,
					actions: [
						{
							kind: CodeActionKind.DOCUMENT_TEXT_CHANGE,
							change: {
								range: {
									document,
									start: assignment.location.start + 2, // Offset 2 for '${'
									end: assignment.location.end - 1 // Offset 1 for '}'
								},
								newText
							}
						}
					]
				}
			];
		}
	}

	return [];
}

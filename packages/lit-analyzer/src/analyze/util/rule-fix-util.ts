import { SourceFile } from "typescript";
import { tsModule } from "../../../../ts-lit-plugin/src/ts-module";
import { LitCodeFix } from "../types/lit-code-fix";
import { LitCodeFixAction } from "../types/lit-code-fix-action";
import { RuleFix } from "../types/rule/rule-fix";
import { RuleFixAction } from "../types/rule/rule-fix-action";
import { arrayFlat } from "./array-util";
import { documentRangeToSFRange, makeSourceFileRange, rangeFromHtmlNodeAttr } from "./range-util";

export function converRuleFixToLitCodeFix(codeFix: RuleFix): LitCodeFix {
	return {
		name: "",
		message: codeFix.message,
		actions: arrayFlat(codeFix.actions.map(ruleFixActionConverter))
	};
}

function ruleFixActionConverter(action: RuleFixAction): LitCodeFixAction[] {
	switch (action.kind) {
		case "changeTagName": {
			const document = action.htmlNode.document;
			const startLocation = action.htmlNode.location.startTag;
			const endLocation = action.htmlNode.location.endTag;

			return [
				{
					range: documentRangeToSFRange(document, startLocation),
					newText: action.newName
				},
				...(endLocation == null
					? []
					: [
							{
								range: documentRangeToSFRange(document, {
									start: endLocation.start + 2,
									end: endLocation.end - 1
								}),
								newText: action.newName
							}
					  ])
			];
		}

		case "addAttribute": {
			const htmlNode = action.htmlNode;

			return [
				{
					range: documentRangeToSFRange(htmlNode.document, {
						start: htmlNode.location.name.end,
						end: htmlNode.location.name.end
					}),
					newText: ` ${action.name}${action.value == null ? "" : `="${action.value}"`}`
				}
			];
		}

		case "changeAttributeName": {
			return [
				{
					range: rangeFromHtmlNodeAttr(action.htmlAttr),
					newText: action.newName
				}
			];
		}

		case "changeAttributeModifier": {
			const document = action.htmlAttr.document;

			return [
				{
					// Make a range that includes the modifier.
					range: documentRangeToSFRange(document, {
						start: action.htmlAttr.location.start,
						end: action.htmlAttr.location.name.start
					}),
					newText: action.newModifier
				}
			];
		}

		case "changeAssignment": {
			const assignment = action.assignment;

			if (assignment.location == null) {
				return [];
			}

			return [
				{
					range: documentRangeToSFRange(assignment.htmlAttr.document, {
						start: assignment.location.start + 2, // Offset 2 for '${'
						end: assignment.location.end - 1 // Offset 1 for '}'
					}),
					newText: action.newValue
				}
			];
		}

		case "import": {
			// Get the import path and the position where it can be placed
			const lastImportIndex = getLastImportIndex(action.file);

			return [
				{
					range: makeSourceFileRange({
						start: lastImportIndex,
						end: 0
					}),
					newText: `\nimport "${action.path}";`
				}
			];
		}
	}

	return [];
}

/**
 * Returns the position of the last import line.
 * @param sourceFile
 */
function getLastImportIndex(sourceFile: SourceFile): number {
	let lastImportIndex = 0;

	for (const statement of sourceFile.statements) {
		if (tsModule.ts.isImportDeclaration(statement)) {
			lastImportIndex = statement.getEnd();
		}
	}

	return lastImportIndex;
}

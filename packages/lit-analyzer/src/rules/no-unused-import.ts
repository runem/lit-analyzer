import { RuleModule } from "../analyze/types/rule/rule-module";
import { Range, SourceFileRange } from "../analyze/types/range";
import { ComponentDefinition } from "web-component-analyzer";
import { isCustomElementTagName } from "../analyze/util/is-valid-name";
import { arrayFlat } from "../analyze/util/array-util";
import { ImportDeclaration } from "typescript";

/**
 * This rule checks if all component definitions imported by an import statement are unused.
 */
const rule: RuleModule = {
	id: "no-unused-import",
	meta: {
		priority: "low"
	},
	visitImportStatement(importAndDocuments, context) {
		const { config, dependencyStore, file } = context;
		const { importDeclaration, htmlDocuments } = importAndDocuments;

		// get Custom Elements used in this SourceFile
		const customElementsNodes = arrayFlat(
			htmlDocuments.map(htmlDocument => {
				return htmlDocument.mapNodes(node => {
					if (isCustomElementTagName(node.tagName)) {
						return node;
					}
					return undefined;
				});
			})
		);

		const range: Range = { start: importDeclaration.pos, end: importDeclaration.end };

		const importedDefinitions = dependencyStore.getImportedDefinitionByRangeOfImportStatement(file, range);
		const anyImportedDefinitionsUsed = importedDefinitions.some((importedDefinition: ComponentDefinition) => {
			return customElementsNodes.some(customElementNode => {
				return customElementNode?.tagName === importedDefinition.tagName;
			});
		});

		// TODO: Get path of the unused import and use it in message and fix message
		// TODO: Write in fix message that the import might be needed for other sideEffects.

		const reportRange = getReportRangeFromImportDeclaration(importDeclaration);

		if (!anyImportedDefinitionsUsed) {
			context.report({
				location: reportRange,
				message: `Unused import statement.`,
				suggestion: config.dontSuggestConfigChanges ? undefined : `You can disable this check by disabling the 'no-unused-import' rule.`
				// fix: () => {} // TODO: Add Codefix which removes import statement.
			});
		}
	}
};

export default rule;

/**
 * Trims leading newlines off an importDeclaration and returns the new range.
 * @param importDeclaration
 * @returns SourceFileRange
 */
function getReportRangeFromImportDeclaration(importDeclaration: ImportDeclaration): SourceFileRange {
	let fullText = importDeclaration.getFullText();
	const range: Range = { start: importDeclaration.pos, end: importDeclaration.end };
	while (fullText.startsWith("\n")) {
		range.start++;
		fullText = fullText.replace("\n", "");
	}
	const reportRange: SourceFileRange = { ...range, _brand: "sourcefile" };
	return reportRange;
}

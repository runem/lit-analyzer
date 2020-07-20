import { RuleModule } from "../analyze/types/rule/rule-module";
import { SourceFileRange } from "../analyze/types/range";
import { ComponentDefinition } from "web-component-analyzer";
import { isCustomElementTagName } from "../analyze/util/is-valid-name";
import { arrayFlat } from "../analyze/util/array-util";
import { ImportDeclaration, SourceFile, Statement } from "typescript";
import * as tsModule from "typescript";
import { TextDocument } from "../analyze/parse/document/text-document/text-document";
import { HtmlDocument } from "../analyze/parse/document/text-document/html-document/html-document";

/**
 * This rule checks if all component definitions imported by an import statement are unused.
 */
const rule: RuleModule = {
	id: "no-unused-import",
	meta: {
		priority: "low"
	},
	visitSourceFile(sourceFile, context) {
		const { config, dependencyStore, documentStore, file } = context;

		const documents = documentStore.getDocumentsInFile(sourceFile, config);
		const importDeclarations = getImportStatementsInFile(file, context.ts);
		const htmlDocuments = documents.filter((document: TextDocument) => document instanceof HtmlDocument) as HtmlDocument[];

		// loop over all import delarations in the SourceFile.
		for (const importDeclaration of importDeclarations) {
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

			// get the ComponentDefinitions imported by the import declaration.
			const importedDefinitions = dependencyStore.getImportedComponentDefinitionsByImportDeclaration(importDeclaration);

			// check if any of the imported Definitions are used in the SourceFile
			const anyImportedDefinitionsUsed = importedDefinitions.some((importedDefinition: ComponentDefinition) => {
				return customElementsNodes.some(customElementNode => {
					return customElementNode?.tagName === importedDefinition.tagName;
				});
			});

			const reportRange = getReportRangeFromImportDeclaration(importDeclaration);
			const path = importDeclaration.moduleSpecifier.getText();

			if (!anyImportedDefinitionsUsed) {
				context.report({
					location: reportRange,
					message: `Unused import statement: ${path}`,
					suggestion: config.dontSuggestConfigChanges ? undefined : `You can disable this check by disabling the 'no-unused-import' rule.`
					// fix: () => {} // TODO: Add Codefix which removes import statement. Write in fix message that the import might be needed for other sideEffects.
				});
			}
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
	// The range that is included in the importDeclaration object points to the fulltext of the delcaration,
	// which includes newlines and comments in front of the import declaration.
	const fullText = importDeclaration.getFullText();
	const text = importDeclaration.getText();
	const rangeOffset = fullText.indexOf(text);
	const reportRange: SourceFileRange = { start: importDeclaration.pos + rangeOffset, end: importDeclaration.end, _brand: "sourcefile" };
	return reportRange;
}

function getImportStatementsInFile(soureFile: SourceFile, ts: typeof tsModule): ImportDeclaration[] {
	const statements = soureFile.statements;
	const importStatements = statements.filter((statement: Statement) => {
		// Until now we only want to evaluate side effect only imports
		// e. g.: "import './my-module';"
		// Therefore we search for importDeclarations without ImportClauses.
		return ts.isImportDeclaration(statement) && statement.importClause == null;
	});
	return importStatements as ImportDeclaration[];
}

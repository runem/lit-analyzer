import { basename, dirname, relative } from "path";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { isCustomElementTagName } from "../analyze/util/general-util";

const rule: RuleModule = {
	name: "no-missing-import",
	visitHtmlNode(htmlNode, { htmlStore, config, definitionStore, dependencyStore, document }) {
		const htmlTag = htmlStore.getHtmlTag(htmlNode);

		if (htmlTag != null && htmlTag.declaration != null) {
			const isCustomElement = isCustomElementTagName(htmlNode.tagName);
			const fromFileName = document.virtualDocument.fileName;
			const isDefinitionImported = dependencyStore.hasTagNameBeenImported(fromFileName, htmlNode.tagName);

			const definition = definitionStore.getDefinitionForTagName(htmlNode.tagName);

			if (isCustomElement && !isDefinitionImported && definition != null) {
				// Get the import path and the position where it can be placed
				const importPath = getRelativePathForImport(fromFileName, definition.node.getSourceFile().fileName);

				const report: LitHtmlDiagnostic = {
					kind: LitHtmlDiagnosticKind.MISSING_IMPORT,
					message: `Missing import for <${htmlNode.tagName}>`,
					suggestion: config.dontSuggestConfigChanges ? undefined : `You can disable this check by disabling the 'no-missing-import' rule.`,
					source: "no-missing-import",
					severity: litDiagnosticRuleSeverity(config, "no-missing-import"),
					location: { document, ...htmlNode.location.name },
					htmlNode,
					definition,
					importPath
				};
				if (config.dontSuggestConfigChanges) {
					report.suggestion = undefined;
				}

				return [report];
			}
		}

		return;
	}
};

export default rule;

/**
 * Returns a relative path from a file path to another file path.
 * This path can be used in an import statement.
 * @param fromFileName
 * @param toFileName
 */
function getRelativePathForImport(fromFileName: string, toFileName: string): string {
	const path = relative(dirname(fromFileName), dirname(toFileName));
	const filenameWithoutExt = basename(toFileName).replace(/\.[^/.]+$/, "");
	const importPath = `./${path ? `${path}/` : ""}${filenameWithoutExt}`;
	return importPath
		.replace(/^.*node_modules\//, "")
		.replace(/\.d$/, "")
		.replace(/\/index$/, "");
}

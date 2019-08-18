import { basename, dirname, relative } from "path";
import { RuleModule } from "../analyze/types/rule-module";
import { isCustomElementTagName } from "../analyze/util/general-util";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNode, HtmlNodeKind } from "../analyze/types/html-node/html-node-types";

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

const rule: RuleModule = context => {
	return {
		enterHtmlNode(node: HtmlNode) {
			if (node.kind !== HtmlNodeKind.NODE) {
				return;
			}

			const htmlTag = context.htmlStore.getHtmlTag(node);

			if (htmlTag && htmlTag.declaration != null) {
				const isCustomElement = isCustomElementTagName(node.tagName);
				const fromFileName = context.document.virtualDocument.fileName;
				const isDefinitionImported = context.dependencyStore.hasTagNameBeenImported(fromFileName, node.tagName);

				const definition = context.definitionStore.getDefinitionForTagName(node.tagName);

				if (isCustomElement && !isDefinitionImported && definition != null) {
					// Get the import path and the position where it can be placed
					const importPath = getRelativePathForImport(fromFileName, definition.node.getSourceFile().fileName);

					const report: LitHtmlDiagnostic = {
						kind: LitHtmlDiagnosticKind.MISSING_IMPORT,
						message: `Missing import for <${node.tagName}>: ${definition.declaration.className || ""}`,
						suggestion: context.config.dontSuggestConfigChanges ? undefined : `You can disable this check by disabling the 'no-missing-import' rule.`,
						source: "no-missing-import",
						severity: litDiagnosticRuleSeverity(context.config, "no-missing-import"),
						location: { document: context.document, ...node.location.name },
						htmlNode: node,
						definition,
						importPath
					};
					if (context.config.dontSuggestConfigChanges) {
						report.suggestion = undefined;
					}
					context.reports.push(report);
				}
			}
		}
	};
};

export default rule;

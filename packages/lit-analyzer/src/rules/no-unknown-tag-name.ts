import { RuleModule } from "../analyze/types/rule-module";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNode, HtmlNodeKind } from "../analyze/types/html-node/html-node-types";
import { findBestStringMatch } from "../analyze/util/find-best-match";

const rule: RuleModule = context => {
	return {
		enterHtmlNode(node: HtmlNode) {
			if (node.kind !== HtmlNodeKind.NODE) {
				return;
			}

			const htmlTag = context.htmlStore.getHtmlTag(node);

			if (htmlTag == null) {
				const suggestedName = findBestStringMatch(node.tagName, Array.from(context.htmlStore.getGlobalTags()).map(tag => tag.tagName));

				let suggestion = `Check that you've imported the element, and that it's declared on the HTMLElementTagNameMap.`;

				if (!context.config.dontSuggestConfigChanges) {
					suggestion += ` If it can't be imported, consider adding it to the 'globalTags' plugin configuration or disabling the 'no-unknown-tag' rule.`;
				}

				context.reports.push({
					kind: LitHtmlDiagnosticKind.UNKNOWN_TAG,
					message: `Unknown tag "${node.tagName}"${suggestedName ? `. Did you mean '${suggestedName}'?` : ""}`,
					location: { document: context.document, ...node.location.name },
					source: "no-unknown-tag-name",
					severity: litDiagnosticRuleSeverity(context.config, "no-unknown-tag-name"),
					suggestion,
					htmlNode: node,
					suggestedName
				});
			}
		}
	};
};

export default rule;

import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeKind } from "../analyze/types/html-node/html-node-types";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { findBestStringMatch } from "../analyze/util/find-best-match";

const rule: RuleModule = {
	name: "no-unknown-tag-name",
	visitHtmlNode(htmlNode, { htmlStore, config, document }) {
		// Don't validate style and svg yet
		if (htmlNode.kind !== HtmlNodeKind.NODE) return;

		const htmlTag = htmlStore.getHtmlTag(htmlNode);

		if (htmlTag == null) {
			const suggestedName = findBestStringMatch(htmlNode.tagName, Array.from(htmlStore.getGlobalTags()).map(tag => tag.tagName));

			let suggestion = `Check that you've imported the element, and that it's declared on the HTMLElementTagNameMap.`;

			if (!config.dontSuggestConfigChanges) {
				suggestion += ` If it can't be imported, consider adding it to the 'globalTags' plugin configuration or disabling the 'no-unknown-tag' rule.`;
			}

			return [
				{
					kind: LitHtmlDiagnosticKind.UNKNOWN_TAG,
					message: `Unknown tag "${htmlNode.tagName}"${suggestedName ? `. Did you mean '${suggestedName}'?` : ""}`,
					location: { document, ...htmlNode.location.name },
					source: "no-unknown-tag-name",
					severity: litDiagnosticRuleSeverity(config, "no-unknown-tag-name"),
					suggestion,
					htmlNode,
					suggestedName
				}
			];
		}

		return;
	}
};

export default rule;

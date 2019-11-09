import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeKind } from "../analyze/types/html-node/html-node-types";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { findBestStringMatch } from "../analyze/util/find-best-match";

/**
 * This rule checks that all tag names used in a template are defined.
 */
const rule: RuleModule = {
	name: "no-unknown-tag-name",
	visitHtmlNode(htmlNode, { htmlStore, config, document }) {
		// Don't validate style and svg yet
		if (htmlNode.kind !== HtmlNodeKind.NODE) return;

		// Get the html tag from the html store
		const htmlTag = htmlStore.getHtmlTag(htmlNode);

		// Add diagnostics if the tag couldn't be found (not defined anywhere)
		if (htmlTag == null) {
			// Find a suggested name in the set of defined tag names. Maybe this tag name is a typo?
			const suggestedName = findBestStringMatch(htmlNode.tagName, Array.from(htmlStore.getGlobalTags()).map(tag => tag.tagName));

			// Build a suggestion text
			let suggestion = `Check that you've imported the element, and that it's declared on the HTMLElementTagNameMap.`;

			if (!config.dontSuggestConfigChanges) {
				suggestion += ` If it can't be imported, consider adding it to the 'globalTags' plugin configuration or disabling the 'no-unknown-tag' rule.`;
			}

			return [
				{
					kind: LitHtmlDiagnosticKind.UNKNOWN_TAG,
					message: `Unknown tag <${htmlNode.tagName}>.`,
					fix: suggestedName == null ? undefined : `Did you mean <${suggestedName}>?`,
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

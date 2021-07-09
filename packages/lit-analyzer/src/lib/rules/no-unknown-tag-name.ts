import { HtmlNodeKind } from "../analyze/types/html-node/html-node-types";
import { RuleModule } from "../analyze/types/rule/rule-module";
import { findBestStringMatch } from "../analyze/util/find-best-match";
import { rangeFromHtmlNode } from "../analyze/util/range-util";

/**
 * This rule checks that all tag names used in a template are defined.
 */
const rule: RuleModule = {
	id: "no-unknown-tag-name",
	meta: {
		priority: "low"
	},
	visitHtmlNode(htmlNode, context) {
		const { htmlStore, config } = context;

		// Don't validate style and svg yet
		if (htmlNode.kind !== HtmlNodeKind.NODE) return;

		// Get the html tag from the html store
		const htmlTag = htmlStore.getHtmlTag(htmlNode);

		// Add diagnostics if the tag couldn't be found (not defined anywhere)
		if (htmlTag == null) {
			// Find a suggested name in the set of defined tag names. Maybe this tag name is a typo?
			const suggestedName = findBestStringMatch(
				htmlNode.tagName,
				Array.from(htmlStore.getGlobalTags()).map(tag => tag.tagName)
			);

			// Build a suggestion text
			let suggestion = `Check that you've imported the element, and that it's declared on the HTMLElementTagNameMap.`;

			if (!config.dontSuggestConfigChanges) {
				suggestion += ` If it can't be imported, consider adding it to the 'globalTags' plugin configuration or disabling the 'no-unknown-tag' rule.`;
			}

			context.report({
				location: rangeFromHtmlNode(htmlNode),
				message: `Unknown tag <${htmlNode.tagName}>.`,
				fixMessage: suggestedName == null ? undefined : `Did you mean <${suggestedName}>?`,
				suggestion,
				fix:
					suggestedName == null
						? undefined
						: () => ({
								message: `Change tag name to '${suggestedName}'`,
								actions: [
									{
										kind: "changeTagName",
										htmlNode,
										newName: suggestedName
									}
								]
						  })
			});
		}

		return;
	}
};

export default rule;

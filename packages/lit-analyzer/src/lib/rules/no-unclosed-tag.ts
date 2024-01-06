import { RuleModule } from "../analyze/types/rule/rule-module.js";
import { isCustomElementTagName } from "../analyze/util/is-valid-name.js";
import { rangeFromHtmlNode } from "../analyze/util/range-util.js";

/**
 * This rule validates that all tags are closed properly.
 */
const rule: RuleModule = {
	id: "no-unclosed-tag",
	meta: {
		priority: "low"
	},
	visitHtmlNode(htmlNode, context) {
		const {
			selfClosed,
			location: { endTag }
		} = htmlNode;
		if (!selfClosed && endTag == null) {
			// Report specifically that a custom element cannot be self closing
			//   if the user is trying to close a custom element.
			const isCustomElement = isCustomElementTagName(htmlNode.tagName);

			context.report({
				location: rangeFromHtmlNode(htmlNode),
				message: `This tag isn't closed.${isCustomElement ? " Custom elements cannot be self closing." : ""}`
			});
		}

		return;
	}
};

export default rule;

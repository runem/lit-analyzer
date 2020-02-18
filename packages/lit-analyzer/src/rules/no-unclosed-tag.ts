import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { isCustomElementTagName } from "../analyze/util/is-valid-name";
import { rangeFromHtmlNode } from "../analyze/util/lit-range-util";

/**
 * This rule validates that all tags are closed properly.
 */
const rule: RuleModule = {
	name: "no-unclosed-tag",
	visitHtmlNode(htmlNode, request) {
		if (!htmlNode.selfClosed && htmlNode.location.endTag == null) {
			// Report specifically that a custom element cannot be self closing
			//   if the user is trying to close a custom element.
			const isCustomElement = isCustomElementTagName(htmlNode.tagName);

			return [
				{
					message: `This tag isn't closed.${isCustomElement ? " Custom elements cannot be self closing." : ""}`,
					location: rangeFromHtmlNode(request.document, htmlNode),
					htmlNode,

					kind: LitHtmlDiagnosticKind.TAG_NOT_CLOSED,
					source: "no-unclosed-tag",
					severity: litDiagnosticRuleSeverity(request.config, "no-unclosed-tag"),
					file: request.file
				}
			];
		}

		return;
	}
};

export default rule;

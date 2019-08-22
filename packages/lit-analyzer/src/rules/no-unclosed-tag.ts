import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { isCustomElementTagName } from "../analyze/util/general-util";

const rule: RuleModule = {
	name: "no-unclosed-tag",
	visitHtmlNode(htmlNode, request) {
		if (!htmlNode.selfClosed && htmlNode.location.endTag == null) {
			const isCustomElement = isCustomElementTagName(htmlNode.tagName);

			return [
				{
					kind: LitHtmlDiagnosticKind.TAG_NOT_CLOSED,
					message: `This tag isn't closed.${isCustomElement ? " Custom elements cannot be self closing." : ""}`,
					severity: litDiagnosticRuleSeverity(request.config, "no-unclosed-tag"),
					source: "no-unclosed-tag",
					location: { document: request.document, ...htmlNode.location.name },
					htmlNode
				}
			];
		}

		return;
	}
};

export default rule;

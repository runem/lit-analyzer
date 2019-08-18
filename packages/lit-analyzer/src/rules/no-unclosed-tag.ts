import { RuleModule } from "../analyze/types/rule-module";
import { isCustomElementTagName } from "../analyze/util/general-util";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNode } from "../analyze/types/html-node/html-node-types";

const rule: RuleModule = context => {
	return {
		enterHtmlNode(node: HtmlNode) {
			if (!node.selfClosed && node.location.endTag == null) {
				const isCustomElement = isCustomElementTagName(node.tagName);
				context.reports.push({
					kind: LitHtmlDiagnosticKind.TAG_NOT_CLOSED,
					message: `This tag isn't closed.${isCustomElement ? " Custom elements cannot be self closing." : ""}`,
					severity: litDiagnosticRuleSeverity(context.config, "no-unclosed-tag"),
					source: "no-unclosed-tag",
					location: { document: context.document, ...node.location.name },
					htmlNode: node
				});
			}
		}
	};
};

export default rule;

import { RuleModule } from "../analyze/types/rule-module";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { HtmlNodeKind } from "../analyze/types/html-node/html-node-types";
import { HtmlAttrTarget, litAttributeModifierForTarget } from "../analyze/parse/parse-html-data/html-tag";
import { findBestMatch } from "../analyze/util/find-best-match";
import { LitAnalyzerRequest } from "../analyze/lit-analyzer-context";

function findSuggestedTarget(name: string, ...tests: Iterable<HtmlAttrTarget>[]): HtmlAttrTarget | undefined {
	for (const test of tests) {
		const match = findBestMatch(name, [...test], { matchKey: "name", caseSensitive: false });
		if (match != null) {
			return match;
		}
	}
	return;
}

function suggestTargetForHtmlAttr(htmlNodeAttr: HtmlNodeAttr, { htmlStore }: LitAnalyzerRequest): HtmlAttrTarget | undefined {
	const properties = htmlStore.getAllPropertiesForTag(htmlNodeAttr.htmlNode);
	const attributes = htmlStore.getAllAttributesForTag(htmlNodeAttr.htmlNode);
	const events = htmlStore.getAllEventsForTag(htmlNodeAttr.htmlNode);

	switch (htmlNodeAttr.kind) {
		case HtmlNodeAttrKind.EVENT_LISTENER:
			return findSuggestedTarget(htmlNodeAttr.name, events);
		case HtmlNodeAttrKind.PROPERTY:
			return findSuggestedTarget(htmlNodeAttr.name, properties, attributes);
		case HtmlNodeAttrKind.ATTRIBUTE:
		case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
			return findSuggestedTarget(htmlNodeAttr.name, attributes, properties);
	}
}

const rule: RuleModule = context => {
	return {
		enterHtmlAttribute(node: HtmlNodeAttr) {
			if (node.htmlNode.kind !== HtmlNodeKind.NODE) {
				return;
			}

			const { htmlStore, config, document } = context;

			const htmlAttrTarget = htmlStore.getHtmlAttrTarget(node);

			if (htmlAttrTarget == null) {
				// Ignore unknown "data-" attributes
				if (node.name.startsWith("data-")) {
					return;
				}

				const suggestedTarget = suggestTargetForHtmlAttr(node, context);
				const suggestedMemberName = (suggestedTarget && `${litAttributeModifierForTarget(suggestedTarget)}${suggestedTarget.name}`) || undefined;

				let suggestion;

				if (context.config.dontSuggestConfigChanges) {
					suggestion = `Please consider adding a '@fires' tag to the jsdoc on a component class`;
				} else {
					suggestion = `Please consider adding a '@fires' tag to the jsdoc on a component class, adding it to 'globalEvents' or disabling the 'no-unknown-event' rule.`;
				}

				// Get selected severity
				const severity = litDiagnosticRuleSeverity(config, "no-unknown-event");

				context.reports.push({
					kind: LitHtmlDiagnosticKind.UNKNOWN_TARGET,
					message: `Unknown property '${node.name}'${suggestedMemberName != null ? `. Did you mean '${suggestedMemberName}'?` : ""}`,
					location: { document, ...node.location.name },
					source: "no-unknown-event",
					suggestion,
					severity,
					htmlAttr: node,
					suggestedTarget
				});
			}
		}
	};
};

export default rule;

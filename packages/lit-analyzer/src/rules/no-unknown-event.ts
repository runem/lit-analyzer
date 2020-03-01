import { LitAnalyzerConfig } from "../analyze/lit-analyzer-config";
import { HtmlTag, litAttributeModifierForTarget } from "../analyze/parse/parse-html-data/html-tag";
import { AnalyzerDefinitionStore } from "../analyze/store/analyzer-definition-store";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { HtmlNodeKind } from "../analyze/types/html-node/html-node-types";
import { RuleModule } from "../analyze/types/rule/rule-module";
import { suggestTargetForHtmlAttr } from "../analyze/util/attribute-util";
import { rangeFromHtmlNodeAttr } from "../analyze/util/range-util";

/**
 * This rule validates that only known events are used in event listener bindings.
 */
const rule: RuleModule = {
	id: "no-unknown-event",
	meta: {
		priority: "low"
	},
	visitHtmlAttribute(htmlAttr, context) {
		const { htmlStore, config, definitionStore } = context;

		// Ignore "style" and "svg" attrs because I don't yet have all data for them.
		if (htmlAttr.htmlNode.kind !== HtmlNodeKind.NODE) return;

		// Only validate event listener bindings.
		if (htmlAttr.kind !== HtmlNodeAttrKind.EVENT_LISTENER) return;

		// Report a diagnostic if the target is unknown
		const htmlAttrTarget = htmlStore.getHtmlAttrTarget(htmlAttr);
		if (htmlAttrTarget == null) {
			// Don't report unknown properties on unknown tags
			const htmlTag = htmlStore.getHtmlTag(htmlAttr.htmlNode);
			if (htmlTag == null) return;

			// Get suggested target
			const suggestedTarget = suggestTargetForHtmlAttr(htmlAttr, htmlStore);
			const suggestedMemberName = (suggestedTarget && `${litAttributeModifierForTarget(suggestedTarget)}${suggestedTarget.name}`) || undefined;

			const suggestion = getSuggestionText({ config, definitionStore, htmlTag });

			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `Unknown event '${htmlAttr.name}'.`,
				fixMessage: suggestedMemberName == null ? undefined : `Did you mean '${suggestedMemberName}'?`,
				suggestion,
				fix:
					suggestedMemberName == null
						? undefined
						: () => ({
								message: `Change event to '${suggestedMemberName}'`,
								actions: [
									{
										kind: "changeAttributeName",
										newName: suggestedMemberName,
										htmlAttr
									}
								]
						  })
			});
		}
	}
};

export default rule;

/**
 * Returns a suggestion text for the unknown event rule.
 * @param config
 * @param definitionStore
 * @param htmlTag
 */
function getSuggestionText({
	config,
	definitionStore,
	htmlTag
}: {
	config: LitAnalyzerConfig;
	definitionStore: AnalyzerDefinitionStore;
	htmlTag: HtmlTag;
}): string | undefined {
	if (config.dontSuggestConfigChanges) {
		return `Please consider adding '@fires ${htmlTag.tagName}' to the jsdoc on a component class`;
	}

	return `Please consider adding '@fires ${htmlTag.tagName}' to the jsdoc on a component class, adding it to 'globalEvents' or disabling the 'no-unknown-event' rule.`;
}

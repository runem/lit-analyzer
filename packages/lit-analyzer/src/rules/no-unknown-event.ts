import { LitAnalyzerConfig, litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlTag, litAttributeModifierForTarget } from "../analyze/parse/parse-html-data/html-tag";
import { AnalyzerDefinitionStore } from "../analyze/store/analyzer-definition-store";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { HtmlNodeKind } from "../analyze/types/html-node/html-node-types";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { suggestTargetForHtmlAttr } from "../analyze/util/attribute-util";

const rule: RuleModule = {
	name: "no-unknown-event",
	visitHtmlAttribute(htmlAttr, { htmlStore, config, definitionStore, document }) {
		// Ignore "style" and "svg" attrs because I don't yet have all data for them.
		if (htmlAttr.htmlNode.kind !== HtmlNodeKind.NODE) return;

		const htmlAttrTarget = htmlStore.getHtmlAttrTarget(htmlAttr);
		if (htmlAttrTarget == null && htmlAttr.kind === HtmlNodeAttrKind.EVENT_LISTENER) {
			// Don't report unknown properties on unknown tag names
			const htmlTag = htmlStore.getHtmlTag(htmlAttr.htmlNode);
			if (htmlTag == null) return;

			// Get suggested target
			const suggestedTarget = suggestTargetForHtmlAttr(htmlAttr, htmlStore);
			const suggestedMemberName = (suggestedTarget && `${litAttributeModifierForTarget(suggestedTarget)}${suggestedTarget.name}`) || undefined;

			const suggestion = getSuggestionText({ config, definitionStore, htmlTag });

			return [
				{
					kind: LitHtmlDiagnosticKind.UNKNOWN_TARGET,
					message: `Unknown event '${htmlAttr.name}'${suggestedMemberName != null ? `. Did you mean '${suggestedMemberName}'?` : ""}`,
					location: { document, ...htmlAttr.location.name },
					source: "no-unknown-event",
					severity: litDiagnosticRuleSeverity(config, "no-unknown-event"),
					suggestion,
					htmlAttr,
					suggestedTarget
				}
			];
		}

		return;
	}
};

export default rule;

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

import { LitAnalyzerConfig, litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlTag, litAttributeModifierForTarget } from "../analyze/parse/parse-html-data/html-tag";
import { AnalyzerDefinitionStore } from "../analyze/store/analyzer-definition-store";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { HtmlNodeKind } from "../analyze/types/html-node/html-node-types";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { suggestTargetForHtmlAttr } from "../analyze/util/attribute-util";

/**
 * This rule validates that only known properties are used in bindings.
 */
const rule: RuleModule = {
	name: "no-unknown-property",
	visitHtmlAttribute(htmlAttr, { htmlStore, config, definitionStore, document }) {
		// Ignore "style" and "svg" attrs because I don't yet have all data for them.
		if (htmlAttr.htmlNode.kind !== HtmlNodeKind.NODE) return;

		// Only validate property bindings.
		if (htmlAttr.kind !== HtmlNodeAttrKind.PROPERTY) return;

		// Report a diagnostic if the target is unknown.
		const htmlAttrTarget = htmlStore.getHtmlAttrTarget(htmlAttr);
		if (htmlAttrTarget == null) {
			// Don't report unknown properties on unknown tags
			const htmlTag = htmlStore.getHtmlTag(htmlAttr.htmlNode);
			if (htmlTag == null) return;

			// Get suggested target because the name could be a typo.
			const suggestedTarget = suggestTargetForHtmlAttr(htmlAttr, htmlStore);
			const suggestedMemberName = (suggestedTarget && `${litAttributeModifierForTarget(suggestedTarget)}${suggestedTarget.name}`) || undefined;

			const suggestion = getSuggestionText({ config, definitionStore, htmlTag });

			return [
				{
					kind: LitHtmlDiagnosticKind.UNKNOWN_TARGET,
					message: `Unknown property '${htmlAttr.name}'.`,
					fix: suggestedMemberName == null ? undefined : `Did you mean '${suggestedMemberName}'?`,
					location: { document, ...htmlAttr.location.name },
					source: "no-unknown-property",
					severity: litDiagnosticRuleSeverity(config, "no-unknown-property"),
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

/**
 * Generates a suggestion for the unknown property rule.
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
	// Don't generate suggestion if config changes has been disabled.
	if (config.dontSuggestConfigChanges) {
		return undefined;
	}

	const definition = definitionStore.getDefinitionForTagName(htmlTag.tagName);
	const tagHasDeclaration = htmlTag.declaration != null;
	const tagIsBuiltIn = htmlTag.builtIn || false;
	const tagIsFromLibrary = definition != null && definition.declaration.node.getSourceFile().isDeclarationFile;

	return tagIsBuiltIn
		? `This is a built in tag. Please consider disabling the 'no-unknown-property' rule.`
		: tagIsFromLibrary
		? `If you are not the author of this component please consider disabling the 'no-unknown-property' rule.`
		: tagHasDeclaration
		? `This plugin can't automatically find all properties yet. Please consider adding a '@prop' tag to jsdoc on the component class or disabling the 'no-unknown-property' rule.`
		: `Please consider disabling the 'no-unknown-property' rule.`;
}

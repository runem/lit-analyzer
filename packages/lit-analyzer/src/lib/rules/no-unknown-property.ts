import { LitAnalyzerConfig } from "../analyze/lit-analyzer-config.js";
import { HtmlTag, litAttributeModifierForTarget } from "../analyze/parse/parse-html-data/html-tag.js";
import { AnalyzerDefinitionStore } from "../analyze/store/analyzer-definition-store.js";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types.js";
import { HtmlNodeKind } from "../analyze/types/html-node/html-node-types.js";
import { RuleFix } from "../analyze/types/rule/rule-fix.js";
import { RuleModule } from "../analyze/types/rule/rule-module.js";
import { suggestTargetForHtmlAttr } from "../analyze/util/attribute-util.js";
import { iterableFirst } from "../analyze/util/iterable-util.js";
import { rangeFromHtmlNodeAttr } from "../analyze/util/range-util.js";

/**
 * This rule validates that only known properties are used in bindings.
 */
const rule: RuleModule = {
	id: "no-unknown-property",
	meta: {
		priority: "low"
	},
	visitHtmlAttribute(htmlAttr, context) {
		const { htmlStore, config, definitionStore } = context;

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
			const suggestedModifier = suggestedTarget == null ? undefined : litAttributeModifierForTarget(suggestedTarget);
			const suggestedMemberName = suggestedTarget == null ? undefined : suggestedTarget.name;

			const suggestion = getSuggestionText({ config, definitionStore, htmlTag });

			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `Unknown property '${htmlAttr.name}'.`,
				fixMessage: suggestedMemberName == null ? undefined : `Did you mean '${suggestedModifier}${suggestedMemberName}'?`,
				suggestion,
				fix:
					suggestedMemberName == null
						? undefined
						: () =>
								({
									message: `Change property to '${suggestedModifier}${suggestedMemberName}'`,
									actions: [
										{
											kind: "changeAttributeModifier",
											newModifier: suggestedModifier,
											htmlAttr
										},
										{
											kind: "changeAttributeName",
											newName: suggestedMemberName,
											htmlAttr
										}
									]
								} as RuleFix)
			});
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

	const tagHasDeclaration = htmlTag.declaration != null;
	const tagIsBuiltIn = htmlTag.builtIn || false;
	const tagIsFromLibrary =
		iterableFirst(definitionStore.getDefinitionForTagName(htmlTag.tagName)?.identifierNodes)?.getSourceFile().isDeclarationFile || false;

	return tagIsBuiltIn
		? `This is a built in tag. Please consider disabling the 'no-unknown-property' rule.`
		: tagIsFromLibrary
		? `If you are not the author of this component please consider disabling the 'no-unknown-property' rule.`
		: tagHasDeclaration
		? `Please consider adding a '@prop' tag to jsdoc on the component class or disabling the 'no-unknown-property' rule.`
		: `Please consider disabling the 'no-unknown-property' rule.`;
}

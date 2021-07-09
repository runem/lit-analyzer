import { LitAnalyzerConfig } from "../analyze/lit-analyzer-config.js";
import { HtmlTag, litAttributeModifierForTarget } from "../analyze/parse/parse-html-data/html-tag.js";
import { AnalyzerDefinitionStore } from "../analyze/store/analyzer-definition-store.js";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types.js";
import { HtmlNodeKind } from "../analyze/types/html-node/html-node-types.js";
import { RuleFix } from "../analyze/types/rule/rule-fix.js";
import { RuleModule } from "../analyze/types/rule/rule-module.js";
import { suggestTargetForHtmlAttr } from "../analyze/util/attribute-util.js";
import { rangeFromHtmlNodeAttr } from "../analyze/util/range-util.js";

/**
 * This rule validates that only known attributes are used in attribute bindings.
 */
const rule: RuleModule = {
	id: "no-unknown-attribute",
	meta: {
		priority: "low"
	},
	visitHtmlAttribute(htmlAttr, context) {
		const { htmlStore, config, definitionStore } = context;

		// Ignore "style" and "svg" attrs because I don't yet have all data for them.
		if (htmlAttr.htmlNode.kind !== HtmlNodeKind.NODE) return;

		// Only validate attribute bindings.
		if (htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE && htmlAttr.kind !== HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE) return;

		// Report a diagnostic if the target is unknown
		const htmlAttrTarget = htmlStore.getHtmlAttrTarget(htmlAttr);
		if (htmlAttrTarget == null) {
			// Don't report unknown attributes on unknown tag names
			const htmlTag = htmlStore.getHtmlTag(htmlAttr.htmlNode);
			if (htmlTag == null) return;

			// Ignore unknown "data-" attributes
			if (htmlAttr.name.startsWith("data-")) return;

			// Get suggested target
			const suggestedTarget = suggestTargetForHtmlAttr(htmlAttr, htmlStore);
			const suggestedModifier = suggestedTarget == null ? undefined : litAttributeModifierForTarget(suggestedTarget);
			const suggestedMemberName = suggestedTarget == null ? undefined : suggestedTarget.name;

			const suggestion = getSuggestionText({ config, htmlTag, definitionStore });

			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `Unknown attribute '${htmlAttr.name}'.`,
				fixMessage: suggestedMemberName == null ? undefined : `Did you mean '${suggestedModifier}${suggestedMemberName}'?`,
				suggestion,
				fix: () =>
					[
						{
							message: `Change attribute to 'data-${htmlAttr.name}'`,
							actions: [
								{
									kind: "changeAttributeName",
									newName: `data-${htmlAttr.name}`,
									htmlAttr
								}
							]
						} as RuleFix,
						...(suggestedMemberName == null
							? []
							: [
									{
										message: `Change attribute to '${suggestedModifier}${suggestedMemberName}'`,
										actions: [
											{
												kind: "changeAttributeName",
												newName: suggestedMemberName,
												htmlAttr
											},
											{
												kind: "changeAttributeModifier",
												newModifier: suggestedModifier,
												htmlAttr
											}
										]
									} as RuleFix
							  ])
					] as RuleFix[]
			});
		}

		return;
	}
};

export default rule;

/**
 * Returns are suggestion for the unknown attribute rule.
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
		return `Please consider using a data-* attribute.`;
	}

	const tagHasDeclaration = htmlTag.declaration != null;
	const tagIsBuiltIn = htmlTag.builtIn || false;
	const tagIsFromLibrary = definitionStore.getDefinitionForTagName(htmlTag.tagName)?.sourceFile?.isDeclarationFile || false;

	return tagIsBuiltIn
		? `This is a built in tag. Please consider using a 'data-*' attribute, adding the attribute to 'globalAttributes' or disabling the 'no-unknown-attribute' rule.`
		: tagIsFromLibrary
		? `If you are not the author of this component please consider using a 'data-*' attribute, adding the attribute to 'globalAttributes' or disabling the 'no-unknown-attribute' rule.`
		: tagHasDeclaration
		? `Please consider adding it as an attribute on the component, adding '@attr' tag to jsdoc on the component class or using a 'data-*' attribute instead.`
		: `Please consider using a 'data-*' attribute.`;
}

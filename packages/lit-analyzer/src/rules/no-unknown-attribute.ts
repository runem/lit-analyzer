import { LitAnalyzerConfig, litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlTag, litAttributeModifierForTarget } from "../analyze/parse/parse-html-data/html-tag";
import { AnalyzerDefinitionStore } from "../analyze/store/analyzer-definition-store";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { HtmlNodeKind } from "../analyze/types/html-node/html-node-types";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { suggestTargetForHtmlAttr } from "../analyze/util/attribute-util";

const rule: RuleModule = {
	name: "no-unknown-attribute",
	visitHtmlAttribute(htmlAttr, { htmlStore, config, definitionStore, document }) {
		// Ignore "style" and "svg" attrs because I don't yet have all data for them.
		if (htmlAttr.htmlNode.kind !== HtmlNodeKind.NODE) return;

		const htmlAttrTarget = htmlStore.getHtmlAttrTarget(htmlAttr);
		if (htmlAttrTarget == null && (htmlAttr.kind === HtmlNodeAttrKind.ATTRIBUTE || htmlAttr.kind === HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE)) {
			// Don't report unknown attributes on unknown tag names
			const htmlTag = htmlStore.getHtmlTag(htmlAttr.htmlNode);
			if (htmlTag == null) return;

			// Ignore unknown "data-" attributes
			if (htmlAttr.name.startsWith("data-")) return;

			// Get suggested target
			const suggestedTarget = suggestTargetForHtmlAttr(htmlAttr, htmlStore);
			const suggestedMemberName = (suggestedTarget && `${litAttributeModifierForTarget(suggestedTarget)}${suggestedTarget.name}`) || undefined;

			const suggestion = getSuggestionText({ config, htmlTag, definitionStore });

			return [
				{
					kind: LitHtmlDiagnosticKind.UNKNOWN_TARGET,
					message: `Unknown attribute '${htmlAttr.name}'${suggestedMemberName != null ? `. Did you mean '${suggestedMemberName}'?` : ""}`,
					location: { document, ...htmlAttr.location.name },
					source: "no-unknown-attribute",
					severity: litDiagnosticRuleSeverity(config, "no-unknown-attribute"),
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
		return `Please consider using a data-* attribute.`;
	}

	const definition = definitionStore.getDefinitionForTagName(htmlTag.tagName);
	const tagHasDeclaration = htmlTag.declaration != null;
	const tagIsBuiltIn = htmlTag.builtIn || false;
	const tagIsFromLibrary = definition != null && definition.declaration.node.getSourceFile().isDeclarationFile;

	return tagIsBuiltIn
		? `This is a built in tag. Please consider using a 'data-*' attribute, adding the attribute to 'globalAttributes' or disabling the 'no-unknown-attribute' rule.`
		: tagIsFromLibrary
		? `If you are not the author of this component please consider using a 'data-*' attribute, adding the attribute to 'globalAttributes' or disabling the 'no-unknown-attribute' rule.`
		: tagHasDeclaration
		? `Please consider adding it as an attribute on the component, adding '@attr' tag to jsdoc on the component class or using a 'data-*' attribute instead.`
		: `Please consider using a 'data-*' attribute.`;
}

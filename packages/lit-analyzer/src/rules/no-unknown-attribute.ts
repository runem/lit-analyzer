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

			const { htmlStore, config, definitionStore, document } = context;

			const htmlAttrTarget = htmlStore.getHtmlAttrTarget(node);

			if (htmlAttrTarget == null) {
				// Ignore unknown "data-" attributes
				if (node.name.startsWith("data-")) {
					return;
				}

				const htmlTag = htmlStore.getHtmlTag(node.htmlNode);

				const suggestedTarget = suggestTargetForHtmlAttr(node, context);
				const suggestedMemberName = (suggestedTarget && `${litAttributeModifierForTarget(suggestedTarget)}${suggestedTarget.name}`) || undefined;

				const definition = definitionStore.getDefinitionForTagName(node.htmlNode.tagName);

				const tagHasDeclaration = htmlTag != null && htmlTag.declaration != null;
				const tagIsBuiltIn = htmlTag != null && htmlTag.builtIn;
				const tagIsFromLibrary = definition != null && definition.declaration.node.getSourceFile().isDeclarationFile;

				let suggestion;

				if (context.config.dontSuggestConfigChanges) {
					suggestion = `Please consider using a data-* attribute.`;
				} else {
					suggestion = tagIsBuiltIn
						? `This is a built in tag. Please consider using a 'data-*' attribute, adding the attribute to 'globalAttributes' or disabling the 'no-unknown-attribute' rule.`
						: tagIsFromLibrary
						? `If you are not the author of this component please consider using a 'data-*' attribute, adding the attribute to 'globalAttributes' or disabling the 'no-unknown-attribute' rule.`
						: tagHasDeclaration
						? `Please consider adding it as an attribute on the component, adding '@attr' tag to jsdoc on the component class or using a 'data-*' attribute instead.`
						: `Please consider using a 'data-*' attribute.`;
				}

				// Get selected severity
				const severity = litDiagnosticRuleSeverity(config, "no-unknown-attribute");

				context.reports.push({
					kind: LitHtmlDiagnosticKind.UNKNOWN_TARGET,
					message: `Unknown attribute '${node.name}'${suggestedMemberName != null ? `. Did you mean '${suggestedMemberName}'?` : ""}`,
					location: { document, ...node.location.name },
					source: "no-unknown-attribute",
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

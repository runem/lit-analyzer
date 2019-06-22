import { HtmlAttrTarget, litAttributeModifierForTarget } from "../../../parse/parse-html-data/html-tag";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../../../types/html-node/html-node-attr-types";
import { HtmlNodeKind } from "../../../types/html-node/html-node-types";
import { findBestMatch } from "../../../util/find-best-match";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../../../types/lit-diagnostic";
import { isRuleDisabled, LitAnalyzerRuleName, litDiagnosticRuleSeverity } from "../../../lit-analyzer-config";

/**
 * Returns html reports for unknown html attributes.
 * @param htmlAttr
 * @param request
 */
export function validateHtmlAttr(htmlAttr: HtmlNodeAttr, request: LitAnalyzerRequest): LitHtmlDiagnostic[] {
	// Ignore "style" and "svg" attrs because I don't yet have all data for them.
	if (htmlAttr.htmlNode.kind !== HtmlNodeKind.NODE) return [];

	const { htmlStore, config, definitionStore, document } = request;

	const htmlAttrTarget = htmlStore.getHtmlAttrTarget(htmlAttr);
	if (htmlAttrTarget == null) {
		// Check if we need to skip this check
		if (isRuleDisabled(config, ruleNameFromHtmlNodeAttrKind(htmlAttr.kind))) return [];

		// Ignore unknown "data-" attributes
		if (htmlAttr.name.startsWith("data-")) return [];

		const htmlTag = htmlStore.getHtmlTag(htmlAttr.htmlNode);

		const suggestedTarget = suggestTargetForHtmlAttr(htmlAttr, request);
		const suggestedMemberName = (suggestedTarget && `${litAttributeModifierForTarget(suggestedTarget)}${suggestedTarget.name}`) || undefined;

		const definition = definitionStore.getDefinitionForTagName(htmlAttr.htmlNode.tagName);

		const tagHasDeclaration = htmlTag != null && htmlTag.declaration != null;
		const tagIsBuiltIn = htmlTag != null && htmlTag.builtIn;
		const tagIsFromLibrary = definition != null && definition.declaration.node.getSourceFile().isDeclarationFile;

		const suggestion = (() => {
			switch (htmlAttr.kind) {
				case HtmlNodeAttrKind.EVENT_LISTENER:
					return `Please consider adding a '@event' tag to the jsdoc on a component class, adding it to 'globalEvents' or removing 'checkUnknownEvents'.`;
				case HtmlNodeAttrKind.PROPERTY:
					return tagIsBuiltIn
						? `This is a built in tag. Please consider using 'skipUnknownProperties'.`
						: tagIsFromLibrary
						? `If you are not the author of this component please consider using 'skipUnknownProperties'.`
						: tagHasDeclaration
						? `This plugin can't automatically find all properties yet. Please consider adding a '@prop' tag to jsdoc on the component class or using 'skipUnknownProperties'.`
						: `Please consider adding 'skipUnknownProperties' to the plugin config.`;
				case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
				case HtmlNodeAttrKind.ATTRIBUTE:
					return tagIsBuiltIn
						? `This is a built in tag. Please consider using a 'data-*' attribute, adding the attribute to 'globalAttributes' or using 'skipUnknownAttributes'.`
						: tagIsFromLibrary
						? `If you are not the author of this component please consider using a 'data-*' attribute, adding the attribute to 'globalAttributes' or using 'skipUnknownAttributes'.`
						: tagHasDeclaration
						? `Please consider adding it as an attribute on the component, adding '@attr' tag to jsdoc on the component class or using a 'data-*' attribute instead.`
						: `Please consider using a 'data-*' attribute instead.`;
			}
		})();

		const existingKind = (() => {
			switch (htmlAttr.kind) {
				case HtmlNodeAttrKind.PROPERTY:
					return "property";
				case HtmlNodeAttrKind.ATTRIBUTE:
				case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
					return "attribute";
				case HtmlNodeAttrKind.EVENT_LISTENER:
					return "event listener";
			}
		})();

		// Get selected severity
		const severity = litDiagnosticRuleSeverity(config, ruleNameFromHtmlNodeAttrKind(htmlAttr.kind));

		return [
			{
				kind: LitHtmlDiagnosticKind.UNKNOWN_TARGET,
				message: `Unknown ${existingKind} "${htmlAttr.name}"${suggestedMemberName != null ? `. Did you mean '${suggestedMemberName}'?` : ""}`,
				location: { document, ...htmlAttr.location.name },
				source: ruleNameFromHtmlNodeAttrKind(htmlAttr.kind),
				suggestion,
				severity,
				htmlAttr,
				suggestedTarget
			}
		];
	}

	return [];
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

function findSuggestedTarget(name: string, ...tests: Iterable<HtmlAttrTarget>[]): HtmlAttrTarget | undefined {
	for (const test of tests) {
		const match = findBestMatch(name, [...test], { matchKey: "name", caseSensitive: false });
		if (match != null) {
			return match;
		}
	}
}

function ruleNameFromHtmlNodeAttrKind(kind: HtmlNodeAttrKind): LitAnalyzerRuleName {
	switch (kind) {
		case HtmlNodeAttrKind.ATTRIBUTE:
		case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
			return "no-unknown-attribute";
		case HtmlNodeAttrKind.PROPERTY:
			return "no-unknown-property";
		case HtmlNodeAttrKind.EVENT_LISTENER:
			return "no-unknown-event";
	}
}

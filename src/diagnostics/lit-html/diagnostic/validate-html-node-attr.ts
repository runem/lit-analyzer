import { LIT_HTML_PROP_ATTRIBUTE_MODIFIER } from "../../../constants";
import { HtmlMember } from "../../../parsing/parse-html-data/html-tag";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-attr-types";
import { HtmlNodeKind } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-types";
import { TsLitPluginStore } from "../../../state/store";
import { findBestMatch } from "../../../util/find-best-match";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../../types/lit-diagnostic";

/**
 * Returns html reports for unknown html attributes.
 * @param htmlAttr
 * @param store
 */
export function validateHtmlAttr(htmlAttr: HtmlNodeAttr, store: TsLitPluginStore): LitHtmlDiagnostic[] {
	// Ignore "style" and "svg" attrs because I don't yet have all data for them.
	if (htmlAttr.htmlNode.kind !== HtmlNodeKind.NODE) return [];

	// Skip validating EVENT_LISTENERS for now
	if (htmlAttr.kind === HtmlNodeAttrKind.EVENT_LISTENER) return [];

	const htmlAttrTarget = store.getHtmlAttrTarget(htmlAttr);
	if (htmlAttrTarget == null) {
		// Ignore unknown "data-" attributes
		if (htmlAttr.name.startsWith("data-")) return [];

		if (store.config.skipUnknownHtmlAttributes) return [];

		const htmlTag = store.getHtmlTag(htmlAttr.htmlNode);

		const suggestedMember = (() => {
			const properties = Array.from(store.getAllPropertiesForTag(htmlAttr.htmlNode));
			const attributes = Array.from(store.getAllAttributesForTag(htmlAttr.htmlNode));

			switch (htmlAttr.kind) {
				case HtmlNodeAttrKind.PROPERTY:
					return findSuggestedMember(htmlAttr.name, properties, attributes);
				case HtmlNodeAttrKind.ATTRIBUTE:
				case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
					return findSuggestedMember(htmlAttr.name, attributes, properties);
			}
		})();

		const suggestedMemberName = (suggestedMember && `${suggestedMember.kind === "property" ? LIT_HTML_PROP_ATTRIBUTE_MODIFIER : ""}${suggestedMember.name}`) || undefined;

		const definition = store.getDefinitionForTagName(htmlAttr.htmlNode.tagName);

		const isCustomElement = htmlTag != null && htmlTag.declaration != null;
		const isBuiltIn = htmlTag != null && htmlTag.builtIn;
		const isFromModule = definition != null && definition.fromLib;

		const tip = (() => {
			switch (htmlAttr.kind) {
				case HtmlNodeAttrKind.PROPERTY:
					return suggestedMemberName != null
						? `Did you mean '${suggestedMemberName}'? `
						: `ts-lit-plugin can't find all properties yet. Please consider adding it as a '@prop' tag to the jsdoc on the component class.`;
				case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
				case HtmlNodeAttrKind.ATTRIBUTE:
					return suggestedMemberName != null
						? `Did you mean '${suggestedMemberName}'? `
						: isBuiltIn
						? `This is a built in tag. Please consider using a "data-*" attribute or add it to 'globalHtmlAttributes'.`
						: isFromModule
						? `If you are not the author of this component please consider using a "data-*" attribute or add it to 'globalHtmlAttributes'.`
						: isCustomElement
						? `Please consider either to add it as a attribute on the component, add '@attr' tag to jsdoc on the component class or use a "data-*" attribute.`
						: `Please consider using a "data-*" attribute instead.`;
			}
		})();

		return [
			{
				kind: LitHtmlDiagnosticKind.UNKNOWN_MEMBER,
				message: `Unknown ${htmlAttr.kind === HtmlNodeAttrKind.PROPERTY ? "property" : "attribute"} "${htmlAttr.name}".${tip != null ? ` ${tip}` : ""}`,
				severity: "warning",
				location: htmlAttr.location.name,
				htmlAttr,
				suggestedMember
			}
		];
	}

	return [];
}

function findSuggestedMember(name: string, ...tests: Iterable<HtmlMember>[]): HtmlMember | undefined {
	for (const test of tests) {
		const match = findBestMatch(name, [...test], { matchKey: "name", caseSensitive: false });
		if (match != null) {
			return match;
		}
	}
}

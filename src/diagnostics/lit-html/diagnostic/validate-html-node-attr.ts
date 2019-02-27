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

	const htmlTagAttr = store.getHtmlTagAttr(htmlAttr);
	if (htmlTagAttr == null) {
		// Ignore unknown "data-" attributes
		if (htmlAttr.name.startsWith("data-")) return [];

		if (store.config.skipUnknownHtmlAttributes) return [];

		const htmlTag = store.getHtmlTag(htmlAttr.htmlNode);
		const definition = store.getComponentDefinition(htmlAttr.htmlNode);
		const htmlTagAttrs = store.getHtmlTagAttrs(htmlAttr.htmlNode);
		const suggestedName = findBestMatch(htmlAttr.name, htmlTagAttrs.map(attr => attr.name));

		const isCustomElement = htmlTag != null && htmlTag.hasDeclaration;
		const fromModule = definition != null && definition.fromLib;

		const tip =
			suggestedName != null
				? `Did you mean '${suggestedName}'? `
				: fromModule
				? `If you are not the author of this component please consider using a "data-*" attribute or add it to 'globalHtmlAttributes'.`
				: isCustomElement
				? `Please consider using a "data-*" attribute or add it as a property/attribute to the component.`
				: `Please consider using a "data-*" attribute instead.`;

		return [
			{
				kind: LitHtmlDiagnosticKind.UNKNOWN_ATTRIBUTE,
				message: `Unknown attribute "${htmlAttr.name}".${tip != null ? ` ${tip}` : ""}`,
				severity: "warning",
				location: htmlAttr.location.name,
				htmlAttr,
				suggestedName
			}
		];
	}

	return [];
}

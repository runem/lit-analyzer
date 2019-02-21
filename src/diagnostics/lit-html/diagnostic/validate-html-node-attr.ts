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
		const htmlTagAttrs = store.getHtmlTagAttrs(htmlAttr.htmlNode);
		const suggestedName = findBestMatch(htmlAttr.name, htmlTagAttrs.map(attr => attr.name));

		return [
			{
				kind: LitHtmlDiagnosticKind.UNKNOWN_ATTRIBUTE,
				message: `Unknown attribute "${htmlAttr.name}"${suggestedName ? `. Did you mean '${suggestedName}'? ` : ""}`,
				tips: [
					`Please consider one of these options:
- 1: Use "data-${htmlAttr.name}" attribute instead.
- 2: Add "${htmlAttr.name} to the 'globalHtmlAttributes' configuration.
${htmlTag != null && htmlTag.hasDeclaration ? `- 3: Add "${htmlAttr.name}" as a property on the component.` : ""}
`
				],
				severity: "warning",
				location: htmlAttr.location.name,
				htmlAttr,
				suggestedName
			}
		];
	}

	return [];
}

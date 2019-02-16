import { TsLitPluginStore } from "../../state/store";
import { HtmlNodeAttr } from "../../types/html-node-attr-types";
import { HtmlReport, HtmlReportKind } from "../../types/html-report-types";
import { findBestMatch } from "../../util/find-best-match";

/**
 * Returns html reports for unknown html attributes.
 * @param htmlAttr
 * @param store
 */
export function validateHtmlAttr(htmlAttr: HtmlNodeAttr, store: TsLitPluginStore): HtmlReport[] {
	const htmlTagAttr = store.getHtmlTagAttr(htmlAttr);
	if (htmlTagAttr == null) {
		// Ignore unknown "data-" attributes
		if (htmlAttr.name.startsWith("data-")) return [];

		// Don't report unknown attributes on unknown elements
		if (store.config.externalHtmlTagNames.includes(htmlAttr.htmlNode.tagName)) return [];

		if (store.config.skipUnknownHtmlAttributes) return [];

		const htmlTagAttrs = store.getHtmlTagAttrs(htmlAttr.htmlNode);
		const suggestedName = findBestMatch(htmlAttr.name, htmlTagAttrs.map(attr => attr.name));

		return [
			{
				kind: HtmlReportKind.UNKNOWN,
				suggestedName
			}
		];
	}

	return [];
}

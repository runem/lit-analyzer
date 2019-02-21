import { toTypeString } from "ts-simple-type";
import { LIT_HTML_PROP_ATTRIBUTE_MODIFIER } from "../../../constants";
import { HtmlNodeAttr } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-attr-types";
import { DiagnosticsContext } from "../../diagnostics-context";
import { LitQuickInfo } from "../../types/lit-quick-info";

export function quickInfoForHtmlAttr(htmlAttr: HtmlNodeAttr, { store }: DiagnosticsContext): LitQuickInfo | undefined {
	const htmlTagAttr = store.getHtmlTagAttr(htmlAttr);
	if (htmlTagAttr == null) return undefined;

	const declaration = store.getComponentDeclaration(htmlAttr.htmlNode);

	const type = htmlAttr.modifier === LIT_HTML_PROP_ATTRIBUTE_MODIFIER ? "property" : "attribute";
	const className = declaration != null ? declaration.meta.className : undefined;

	return {
		range: htmlAttr.location.name,
		primaryInfo: `(${type})${className == null ? " " : ` ${className} `}${htmlAttr.modifier || ""}${htmlAttr.name}: ${toTypeString(htmlTagAttr.type)}`,
		secondaryInfo: htmlTagAttr.description
	};
}

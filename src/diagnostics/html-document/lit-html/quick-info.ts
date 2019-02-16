import { toTypeString } from "ts-simple-type";
import { QuickInfo } from "typescript";
import { LIT_HTML_PROP_ATTRIBUTE_MODIFIER } from "../../../constants";
import { tsModule } from "../../../ts-module";
import { HtmlNodeAttr } from "../../../types/html-node-attr-types";
import { HtmlNode } from "../../../types/html-node-types";
import { DiagnosticsContext } from "../../diagnostics-context";

export function quickInfoForHtmlNode(htmlNode: HtmlNode, { store }: DiagnosticsContext): QuickInfo | undefined {
	const { start, end } = htmlNode.location.name;

	const htmlTag = store.getHtmlTag(htmlNode);
	if (htmlTag == null) return undefined;

	return {
		kind: htmlTag.hasDeclaration ? tsModule.ts.ScriptElementKind.memberVariableElement : tsModule.ts.ScriptElementKind.label,
		kindModifiers: "",
		textSpan: { start, length: end - start },
		displayParts: [
			{ text: "<", kind: "punctuation" },
			{
				text: htmlNode.tagName || "unknown",
				kind: "text"
			},
			{ text: ">", kind: "punctuation" }
		],
		documentation:
			htmlTag.description == null
				? []
				: [
						{
							kind: "text",
							text: htmlTag.description
						}
				  ]
	};
}

export function quickInfoForHtmlAttr(htmlAttr: HtmlNodeAttr, { store }: DiagnosticsContext): QuickInfo | undefined {
	const { start, end } = htmlAttr.location.name;

	const htmlTagAttr = store.getHtmlTagAttr(htmlAttr);
	if (htmlTagAttr == null) return undefined;

	const declaration = store.getComponentDeclaration(htmlAttr.htmlNode);

	return {
		kind: htmlTagAttr.hasProp ? tsModule.ts.ScriptElementKind.memberVariableElement : tsModule.ts.ScriptElementKind.label,
		kindModifiers: "",
		textSpan: { start, length: end - start },
		displayParts: [
			{ text: "(", kind: "punctuation" },
			{ text: htmlAttr.modifier === LIT_HTML_PROP_ATTRIBUTE_MODIFIER ? "property" : "attribute", kind: "text" },
			{ text: ")", kind: "punctuation" },
			{ text: " ", kind: "space" },
			...(declaration != null ? [{ text: declaration.meta.className || "", kind: "className" }] : []),
			{ text: htmlAttr.modifier === LIT_HTML_PROP_ATTRIBUTE_MODIFIER ? "." : "", kind: "punctuation" },
			{ text: htmlAttr.name, kind: "propertyName" },
			{ text: ":", kind: "punctuation" },
			{ text: " ", kind: "space" },
			{ text: toTypeString(htmlTagAttr.type), kind: "keyword" }
		],
		documentation:
			htmlTagAttr.description == null
				? []
				: [
						{
							kind: "text",
							text: htmlTagAttr.description
						}
				  ]
	};
}

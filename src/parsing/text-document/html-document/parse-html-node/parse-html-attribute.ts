import { LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER, LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER, LIT_HTML_PROP_ATTRIBUTE_MODIFIER } from "../../../../constants";
import { parseLitAttrName } from "../../../../util/util";
import { IP5NodeAttr, IP5TagNode } from "../parse-html-p5/parse-html-types";
import { parseHtmlAttrAssignment } from "./parse-html-attr-assignment";
import { HtmlNodeAttr, HtmlNodeAttrKind, IHtmlNodeAttrBase, IHtmlNodeAttrSourceCodeLocation } from "./types/html-node-attr-types";
import { ParseHtmlAttrContext } from "./types/parse-html-attr-context";

/**
 * Creates multiple html attributes based on multiple p5Attributes.
 * @param p5Node
 * @param context
 */
export function parseHtmlNodeAttrs(p5Node: IP5TagNode, context: ParseHtmlAttrContext): HtmlNodeAttr[] {
	return p5Node.attrs
		.map(htmlAttr =>
			parseHtmlNodeAttr(p5Node, htmlAttr, {
				...context,
				htmlNode: context.htmlNode
			})
		)
		.filter((attr): attr is HtmlNodeAttr => attr != null);
}

/**
 * Creates a html attr based on a p5Attr.
 * @param p5Node
 * @param p5Attr
 * @param context
 */
export function parseHtmlNodeAttr(p5Node: IP5TagNode, p5Attr: IP5NodeAttr, context: ParseHtmlAttrContext): HtmlNodeAttr | undefined {
	const { htmlNode } = context;
	const { name, modifier } = parseLitAttrName(p5Attr.name);

	const htmlAttrBase: IHtmlNodeAttrBase = {
		name: name.toLowerCase(),
		modifier,
		htmlNode,
		location: makeHtmlAttrLocation(p5Node, p5Attr, context)
	};

	const htmlAttr = parseHtmlAttrBase(htmlAttrBase);

	htmlAttr.assignment = parseHtmlAttrAssignment(p5Node, p5Attr, htmlAttr, context);

	return htmlAttr;
}

/**
 * Returns source code location based on a p5Node.
 * @param p5Node
 * @param p5Attr
 * @param context
 */
function makeHtmlAttrLocation(p5Node: IP5TagNode, p5Attr: IP5NodeAttr, context: ParseHtmlAttrContext): IHtmlNodeAttrSourceCodeLocation {
	const { name, modifier } = parseLitAttrName(p5Attr.name);

	const htmlAttrLocation = (p5Node.sourceCodeLocation.startTag.attrs || {})[p5Attr.name];
	const start = htmlAttrLocation.startOffset;
	const end = htmlAttrLocation.endOffset;
	return {
		start,
		end,
		name: {
			start: start + (modifier ? modifier.length : 0),
			end: start + (modifier ? modifier.length : 0) + name.length
		}
	};
}

function parseHtmlAttrBase(htmlAttrBase: IHtmlNodeAttrBase): HtmlNodeAttr {
	const { modifier } = htmlAttrBase;

	switch (modifier) {
		case LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER:
			return {
				kind: HtmlNodeAttrKind.EVENT_LISTENER,
				...htmlAttrBase,
				modifier
			};
		case LIT_HTML_PROP_ATTRIBUTE_MODIFIER:
			return {
				kind: HtmlNodeAttrKind.PROP,
				...htmlAttrBase,
				modifier
			};
		case LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER:
			return {
				kind: HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE,
				...htmlAttrBase,
				modifier
			};

		default:
			return {
				kind: HtmlNodeAttrKind.ATTRIBUTE,
				...htmlAttrBase,
				modifier: undefined
			};
	}
}

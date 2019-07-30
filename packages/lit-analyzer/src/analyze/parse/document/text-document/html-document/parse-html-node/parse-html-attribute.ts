import {
	LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER,
	LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER,
	LIT_HTML_PROP_ATTRIBUTE_MODIFIER
} from "../../../../../constants";
import {
	HtmlNodeAttr,
	HtmlNodeAttrKind,
	IHtmlNodeAttrBase,
	IHtmlNodeAttrSourceCodeLocation
} from "../../../../../types/html-node/html-node-attr-types";
import { parseLitAttrName } from "../../../../../util/general-util";
import { getSourceLocation, IP5NodeAttr, IP5TagNode } from "../parse-html-p5/parse-html-types";
import { parseHtmlAttrAssignment } from "./parse-html-attr-assignment";
import { ParseHtmlAttrContext } from "./parse-html-attr-context";

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

	const location = makeHtmlAttrLocation(p5Node, p5Attr, context);
	if (location == null) {
		return undefined;
	}

	const htmlAttrBase: IHtmlNodeAttrBase = {
		name: name.toLowerCase(), // Parse5 lowercases all attributes names. Therefore ".myAttr" becomes ".myattr"
		modifier,
		htmlNode,
		location
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
function makeHtmlAttrLocation(p5Node: IP5TagNode, p5Attr: IP5NodeAttr, context: ParseHtmlAttrContext): IHtmlNodeAttrSourceCodeLocation | undefined {
	const { name, modifier } = parseLitAttrName(p5Attr.name);

	const sourceLocation = getSourceLocation(p5Node);
	if (sourceLocation == null) {
		return undefined;
	}

	// Explicitly call "toLowerCase()" because of inconsistencies in parse5.
	// Parse5 lowercases source code location attr keys but doesnt lowercase the attr name when it comes to svg.
	// It would be correct not to lowercase the attr names because svg is case sensitive
	const sourceCodeLocationName = `${p5Attr.prefix || ""}${(p5Attr.prefix && ":") || ""}${p5Attr.name}`.toLowerCase();
	const htmlAttrLocation = (sourceLocation.startTag.attrs || {})[sourceCodeLocationName];
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
				kind: HtmlNodeAttrKind.PROPERTY,
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

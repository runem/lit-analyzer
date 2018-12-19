import { IP5NodeAttr, IP5TagNode } from "../parse-html-p5/parse-html-types";
import { IHtmlAttrBase, IHtmlAttrSourceCodeLocation } from "../types/html-attr-types";
import { IParseHtmlAttrContext } from "./i-parse-html-attr-context";
import { parseHtmlAttrAssignment } from "./parse-html-attr-assignment";

/**
 * Creates multiple html attributes based on multiple p5Attributes.
 * @param p5Node
 * @param context
 */
export function parseHtmlNodeAttrs(p5Node: IP5TagNode, context: IParseHtmlAttrContext): IHtmlAttrBase[] {
	return p5Node.attrs
		.map(htmlAttr =>
			parseHtmlNodeAttr(p5Node, htmlAttr, {
				...context,
				htmlNode: context.htmlNode
			})
		)
		.filter((attr): attr is IHtmlAttrBase => attr != null);
}

/**
 * Creates a html attr based on a p5Attr.
 * @param p5Node
 * @param p5Attr
 * @param context
 */
export function parseHtmlNodeAttr(p5Node: IP5TagNode, p5Attr: IP5NodeAttr, context: IParseHtmlAttrContext): IHtmlAttrBase | undefined {
	const { name, modifier } = context.store.extension.parseAttrName(p5Attr.name) || {
		name: p5Attr.name,
		modifier: undefined
	};

	const { store, htmlNode } = context;

	const htmlAttr = store.extension.parseHtmlAttr(p5Attr, htmlNode, {
		store,
		p5Node,
		htmlAttrBase: {
			name,
			modifier,
			htmlNode,
			location: makeHtmlAttrLocation(p5Node, p5Attr, context)
		}
	});

	if (htmlAttr == null) return;

	htmlAttr.assignment = parseHtmlAttrAssignment(p5Node, p5Attr, htmlAttr, context);

	return htmlAttr;
}

/**
 * Returns source code location based on a p5Node.
 * @param p5Node
 * @param p5Attr
 * @param context
 */
function makeHtmlAttrLocation(p5Node: IP5TagNode, p5Attr: IP5NodeAttr, context: IParseHtmlAttrContext): IHtmlAttrSourceCodeLocation {
	const { name, modifier } = context.store.extension.parseAttrName(p5Attr.name) || {
		name: p5Attr.name,
		modifier: undefined
	};

	const htmlAttrLocation = (p5Node.sourceCodeLocation.startTag.attrs || {})[p5Attr.name];
	const start = context.getSourceCodeLocation(htmlAttrLocation.startOffset);
	const end = context.getSourceCodeLocation(htmlAttrLocation.endOffset);
	return {
		start,
		end,
		name: {
			start: start + (modifier ? modifier.length : 0),
			end: start + (modifier ? modifier.length : 0) + name.length
		}
	};
}

import { Range } from "../../../../../types/range";
import { IP5NodeAttr, IP5TagNode, getSourceLocation } from "../parse-html-p5/parse-html-types";
import { HtmlNodeAttrAssignment, HtmlNodeAttrAssignmentKind } from "../../../../../types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttr } from "../../../../../types/html-node/html-node-attr-types";
import { ParseHtmlContext } from "./parse-html-context";

/**
 * Parses a html attribute assignment.
 * @param p5Node
 * @param p5Attr
 * @param htmlAttr
 * @param context
 */
export function parseHtmlAttrAssignment(
	p5Node: IP5TagNode,
	p5Attr: IP5NodeAttr,
	htmlAttr: HtmlNodeAttr,
	context: ParseHtmlContext
): HtmlNodeAttrAssignment | undefined {
	const location = getAssignmentLocation(p5Node, p5Attr, htmlAttr, context);

	if (location == null) {
		return { kind: HtmlNodeAttrAssignmentKind.BOOLEAN };
	}

	const values = context.getPartsAtOffsetRange(location);

	if (values.length === 0) {
		return undefined;
	} else if (values.length === 1) {
		const value = values[0];
		if (typeof value === "string") {
			return {
				kind: HtmlNodeAttrAssignmentKind.STRING,
				location,
				value
			};
		} else {
			return {
				kind: HtmlNodeAttrAssignmentKind.EXPRESSION,
				location,
				expression: value
			};
		}
	} else {
		return {
			kind: HtmlNodeAttrAssignmentKind.MIXED,
			location,
			values
		};
	}
}

function getAssignmentLocation(p5Node: IP5TagNode, p5Attr: IP5NodeAttr, htmlAttr: HtmlNodeAttr, context: ParseHtmlContext): Range | undefined {
	const sourceLocation = getSourceLocation(p5Node);
	if (sourceLocation == null) {
		return undefined;
	}

	const htmlAttrLocation = (sourceLocation.startTag.attrs || {})[p5Attr.name];
	if (htmlAttrLocation == null) return undefined;

	const nameEndOffset = htmlAttr.location.name.end;

	const htmlAfterName = context.html.substring(nameEndOffset, htmlAttrLocation.endOffset);

	const firstQuote = htmlAfterName.indexOf('"');
	const lastQuote = htmlAfterName.lastIndexOf('"');
	const firstEquals = htmlAfterName.indexOf("=");

	// Example: attr
	if (firstEquals < 0) return undefined;

	// Example: attr=myvalue
	if (firstQuote < 0 && lastQuote < 0) {
		return {
			start: nameEndOffset + firstEquals + 1,
			end: htmlAttrLocation.endOffset
		};
	}

	// Example: attr="myvalue"
	if (firstQuote >= 0 && lastQuote >= 0) {
		return {
			start: nameEndOffset + firstQuote + 1,
			end: nameEndOffset + lastQuote
		};
	}

	return undefined;
}

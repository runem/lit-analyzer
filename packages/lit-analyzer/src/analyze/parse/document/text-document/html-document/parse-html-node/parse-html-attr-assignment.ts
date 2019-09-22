import { HtmlNodeAttrAssignment, HtmlNodeAttrAssignmentKind } from "../../../../../types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttr } from "../../../../../types/html-node/html-node-attr-types";
import { Range } from "../../../../../types/range";
import { getSourceLocation, IP5NodeAttr, IP5TagNode } from "../parse-html-p5/parse-html-types";
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
		return { kind: HtmlNodeAttrAssignmentKind.BOOLEAN, htmlAttr };
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
				value,
				htmlAttr
			};
		} else {
			return {
				kind: HtmlNodeAttrAssignmentKind.EXPRESSION,
				location,
				expression: value,
				htmlAttr
			};
		}
	} else {
		return {
			kind: HtmlNodeAttrAssignmentKind.MIXED,
			location,
			values,
			htmlAttr
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

	const firstQuote = indexOfRegExp(htmlAfterName, /^([\s=]*)(['"])/);
	const lastQuote = indexOfRegExp(htmlAfterName, /['"]\s*$/);
	const firstEquals = indexOfRegExp(htmlAfterName, /=/);

	// Example: attr
	if (firstEquals == null) return undefined;

	// Example: attr=myvalue | attr=myvalue" | attr="myvalue
	if (firstQuote == null || lastQuote == null) {
		return {
			start: nameEndOffset + firstEquals + 1,
			end: htmlAttrLocation.endOffset
		};
	}

	// Example: attr="myvalue"
	return {
		start: nameEndOffset + firstQuote + 1,
		end: nameEndOffset + lastQuote
	};
}

/**
 * Returns the index of a regex match.
 * Returns -1 when no match is found.
 * @param text
 * @param reg
 */
function indexOfRegExp(text: string, reg: RegExp): number | undefined {
	const match = text.match(reg);
	if (match == null) return undefined;

	// Support matching with a prefix group that counts as padding
	if (match.length === 3) {
		return match[1].length;
	}

	return match.index;
}

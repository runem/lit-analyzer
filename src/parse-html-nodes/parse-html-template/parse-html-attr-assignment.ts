import { SimpleTypeKind } from "ts-simple-type";
import { IP5NodeAttr, IP5TagNode } from "../parse-html-p5/parse-html-types";
import { IHtmlAttrAssignment } from "../types/html-attr-assignment-types";
import { IHtmlAttrBase } from "../types/html-attr-types";
import { IParseHtmlContext } from "./i-parse-html-context";

/**
 * Parses a html attribute assignment.
 * @param p5Node
 * @param p5Attr
 * @param htmlAttr
 * @param context
 */
export function parseHtmlAttrAssignment(p5Node: IP5TagNode, p5Attr: IP5NodeAttr, htmlAttr: IHtmlAttrBase, context: IParseHtmlContext): IHtmlAttrAssignment | undefined {
	const expressionId = (p5Attr.value.match(/\$\{(.+)\}/) || [undefined, undefined])[1];
	const isMixedExpression = expressionId != null && p5Attr.value.match(/^\$.*}$/) == null; // checks if the attributes is "${...}" or "content${}"

	const typeB = expressionId && !isMixedExpression ? context.getTypeFromExpressionId(expressionId) : undefined;

	const isBooleanAssignment = (() => {
		if (p5Attr.value.length === 0) {
			const htmlAttrLocation = (p5Node.sourceCodeLocation.startTag.attrs || {})[p5Attr.name];
			if (htmlAttrLocation == null) return false;
			const equalsSignPosition = htmlAttrLocation.startOffset + p5Attr.name.length;
			if (context.html[equalsSignPosition] !== "=") {
				return true;
			}
		}

		return false;
	})();

	const value = typeB == null && !isBooleanAssignment && !isMixedExpression ? p5Attr.value : undefined;

	const { store } = context;
	return store.extension.parseHtmlAttrAssignment(htmlAttr, {
		store,
		p5Node,
		p5Attr,
		assignmentBase: {
			value,
			isBooleanAssignment,
			isMixedExpression,
			typeB: typeB != null ? typeB : isBooleanAssignment ? { kind: SimpleTypeKind.BOOLEAN } : value != null ? { kind: SimpleTypeKind.STRING_LITERAL, value } : { kind: SimpleTypeKind.STRING }
		}
	});
}

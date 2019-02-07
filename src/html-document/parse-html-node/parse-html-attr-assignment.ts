import { SimpleTypeKind } from "ts-simple-type";
import { VirtualDocument } from "../../virtual-document/virtual-document";
import { IP5NodeAttr, IP5TagNode } from "../parse-html-p5/parse-html-types";
import { IHtmlAttrAssignment } from "../types/html-attr-assignment-types";
import { IHtmlAttrBase } from "../types/html-attr-types";
import { ParseHtmlContext } from "./types/parse-html-context";

/**
 * Parses a html attribute assignment.
 * @param p5Node
 * @param p5Attr
 * @param htmlAttr
 * @param context
 */
export function parseHtmlAttrAssignment(p5Node: IP5TagNode, p5Attr: IP5NodeAttr, htmlAttr: IHtmlAttrBase, context: ParseHtmlContext): IHtmlAttrAssignment | undefined {
	const { ids, isMixed } = VirtualDocument.getSubstitutionIdsInText(p5Attr.value);

	const typeB = ids.length === 1 && !isMixed ? context.getTypeFromExpressionId(ids[0]) : undefined;

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

	const value = typeB == null && !isBooleanAssignment && !isMixed ? p5Attr.value : undefined;

	const { store } = context;
	return store.extension.parseHtmlAttrAssignment(htmlAttr, {
		store,
		p5Node,
		p5Attr,
		assignmentBase: {
			value,
			isBooleanAssignment,
			isMixedExpression: isMixed,
			typeB: typeB != null ? typeB : isBooleanAssignment ? { kind: SimpleTypeKind.BOOLEAN } : value != null ? { kind: SimpleTypeKind.STRING_LITERAL, value } : { kind: SimpleTypeKind.STRING }
		}
	});
}

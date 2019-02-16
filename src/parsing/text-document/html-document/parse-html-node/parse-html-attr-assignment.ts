import { SimpleTypeKind } from "ts-simple-type";
import { HtmlNodeAttrAssignment } from "../../../../types/html-node-attr-assignment-types";
import { HtmlNodeAttr } from "../../../../types/html-node-attr-types";
import { VirtualDocument } from "../../../virtual-document/virtual-document";
import { IP5NodeAttr, IP5TagNode } from "../parse-html-p5/parse-html-types";
import { ParseHtmlContext } from "./types/parse-html-context";

/**
 * Parses a html attribute assignment.
 * @param p5Node
 * @param p5Attr
 * @param htmlAttr
 * @param context
 */
export function parseHtmlAttrAssignment(p5Node: IP5TagNode, p5Attr: IP5NodeAttr, htmlAttr: HtmlNodeAttr, context: ParseHtmlContext): HtmlNodeAttrAssignment | undefined {
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

	return {
		value,
		isBooleanAssignment,
		isMixedExpression: isMixed,
		typeB:
			typeB != null
				? typeB
				: isBooleanAssignment
				? { kind: SimpleTypeKind.BOOLEAN }
				: value != null
				? {
						kind: SimpleTypeKind.STRING_LITERAL,
						value
				  }
				: { kind: SimpleTypeKind.STRING }
	};
}

/*export function parseHtmlAttrAssignmentBase(htmlAttr: HtmlNodeAttr, htmlAttrAssignmentBase: IHtmlNodeAttrAssignmentBase): HtmlNodeAttrAssignment {
 return {
 ...htmlAttrAssignmentBase
 };*/

/*if (htmlAttr.kind === HtmlNodeAttrKind.CUSTOM_PROP) {
 return {
 ...htmlAttrAssignmentBase,
 typeA: htmlAttr.prop.type
 };
 }

 if (htmlAttr.kind === HtmlNodeAttrKind.BUILT_IN) {
 return {
 ...htmlAttrAssignmentBase,
 typeA: getBuiltInAttributeType(htmlAttr.name) || { kind: SimpleTypeKind.ANY }
 };
 }

 return {
 ...htmlAttrAssignmentBase,
 typeA: { kind: SimpleTypeKind.ANY }
 };*/
//}

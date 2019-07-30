import { isSimpleTypeLiteral, SimpleType, SimpleTypeKind } from "ts-simple-type";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { HtmlNodeAttrAssignmentKind } from "../../../types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../../../types/html-node/html-node-attr-types";
import { LitCompletion } from "../../../types/lit-completion";
import { DocumentPositionContext } from "../../../util/get-position-context-in-document";

export function completionsForHtmlAttrValues(
	htmlNodeAttr: HtmlNodeAttr,
	location: DocumentPositionContext,
	{ htmlStore }: LitAnalyzerRequest
): LitCompletion[] {
	// There is not point in showing completions for event listener bindings
	if (htmlNodeAttr.kind === HtmlNodeAttrKind.EVENT_LISTENER) return [];

	// Don't show completions inside assignments with expressions
	if (htmlNodeAttr.assignment && htmlNodeAttr.assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION) return [];

	const htmlTagMember = htmlStore.getHtmlAttrTarget(htmlNodeAttr);
	if (htmlTagMember == null) return [];

	// Special case for handling slot attr as we need to look at its parent
	if (htmlNodeAttr.name === "slot") {
		const parentHtmlTag = htmlNodeAttr.htmlNode.parent && htmlStore.getHtmlTag(htmlNodeAttr.htmlNode.parent);
		if (parentHtmlTag != null && parentHtmlTag.slots.length > 0) {
			return parentHtmlTag.slots.map(
				slot =>
					({
						name: slot.name || " ",
						insert: slot.name || "",
						documentation: () => slot.description,
						kind: "enumElement"
					} as LitCompletion)
			);
		}
	}

	const options = getOptionsFromType(htmlTagMember.getType());

	return options.map(
		option =>
			({
				name: option,
				insert: option,
				kind: "enumElement"
			} as LitCompletion)
	);
}

function getOptionsFromType(type: SimpleType): string[] {
	switch (type.kind) {
		case SimpleTypeKind.UNION:
			return type.types.filter(isSimpleTypeLiteral).map(t => t.value.toString());
		case SimpleTypeKind.ENUM:
			return type.types
				.map(m => m.type)
				.filter(isSimpleTypeLiteral)
				.map(t => t.value.toString());
		case SimpleTypeKind.ALIAS:
			return getOptionsFromType(type.target);
	}

	return [];
}

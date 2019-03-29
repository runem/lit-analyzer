import { isSimpleTypeLiteral, SimpleType, SimpleTypeKind } from "ts-simple-type";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-attr-types";
import { DocumentPositionContext } from "../../../util/get-html-position";
import { DiagnosticsContext } from "../../diagnostics-context";
import { LitCompletion } from "../../types/lit-completion";

export function completionsForHtmlAttrValues(htmlNodeAttr: HtmlNodeAttr, location: DocumentPositionContext, { store }: DiagnosticsContext): LitCompletion[] {
	if (htmlNodeAttr.kind === HtmlNodeAttrKind.EVENT_LISTENER) return [];

	const htmlTagMember = store.getHtmlAttrTarget(htmlNodeAttr);
	if (htmlTagMember == null) return [];

	// Special case for handling slot attr as we need to look at its parent
	if (htmlNodeAttr.name === "slot") {
		const parentHtmlTag = htmlNodeAttr.htmlNode.parent && store.getHtmlTag(htmlNodeAttr.htmlNode.parent);
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

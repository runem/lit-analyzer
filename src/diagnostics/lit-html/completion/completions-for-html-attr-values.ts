import { isSimpleTypeLiteral, SimpleType, SimpleTypeKind } from "ts-simple-type";
import { HtmlNodeAttr } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-attr-types";
import { DiagnosticsContext } from "../../diagnostics-context";
import { LitCompletion } from "../../types/lit-completion";

export function completionsForHtmlAttrValues(htmlNodeAttr: HtmlNodeAttr, { store }: DiagnosticsContext): LitCompletion[] {
	const htmlTagAttr = store.getHtmlTagAttr(htmlNodeAttr);
	if (htmlTagAttr == null) return [];

	const options = getOptionsFromType(htmlTagAttr.type);

	return options.map(
		option =>
			({
				name: option,
				insert: option,
				kind: "label"
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

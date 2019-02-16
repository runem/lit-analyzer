import { isSimpleTypeLiteral, SimpleType, SimpleTypeKind } from "ts-simple-type";
import { CompletionEntry } from "typescript";
import { tsModule } from "../../ts-module";
import { HtmlNodeAttr } from "../../types/html-node-attr-types";
import { HtmlNode } from "../../types/html-node-types";
import { DocumentPositionContext } from "../../util/get-html-position";
import { caseInsensitiveCmp } from "../../util/util";
import { DiagnosticsContext } from "../diagnostics-context";

export function completionsForHtmlAttrValues(htmlNodeAttr: HtmlNodeAttr, positionContext: DocumentPositionContext, { store }: DiagnosticsContext): CompletionEntry[] {
	const htmlTagAttr = store.getHtmlTagAttr(htmlNodeAttr);
	if (htmlTagAttr == null) return [];

	const options = getOptionsFromType(htmlTagAttr.type);

	return options.map((option, i) => ({
		name: option,
		insertText: option,
		kind: tsModule.ts.ScriptElementKind.label,
		sortText: i.toString()
	}));
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

export function completionsForHtmlAttrs(htmlNode: HtmlNode, positionContext: DocumentPositionContext, { store }: DiagnosticsContext): CompletionEntry[] {
	const htmlTagAttrs = store.getHtmlTagAttrs(htmlNode);

	const unusedAttrs = htmlTagAttrs.filter(htmlAttr => !(htmlNode.attributes.find(attr => caseInsensitiveCmp(htmlAttr.name, attr.name)) != null));

	return unusedAttrs.map(htmlTagAttr => ({
		name: `${htmlTagAttr.name}${htmlTagAttr.required ? "!" : ""}`,
		insertText: htmlTagAttr.name,
		kind: htmlTagAttr.hasProp ? tsModule.ts.ScriptElementKind.memberVariableElement : tsModule.ts.ScriptElementKind.label,
		sortText: htmlTagAttr.hasProp ? "0" : "1"
	}));
}

export function completionsForHtmlNodes({ position, leftWord, rightWord }: DocumentPositionContext, { store }: DiagnosticsContext): CompletionEntry[] {
	const htmlTags = store.allHtmlTags;

	return htmlTags.map(
		htmlTag =>
			({
				name: htmlTag.name,
				insertText: htmlTag.name,
				kind: htmlTag.hasDeclaration ? tsModule.ts.ScriptElementKind.memberVariableElement : tsModule.ts.ScriptElementKind.label,
				sortText: htmlTag.hasDeclaration ? "0" : "1",
				replacementSpan: {
					start: position - leftWord.length,
					length: leftWord.length + rightWord.length
				}
			} as CompletionEntry)
	);
}

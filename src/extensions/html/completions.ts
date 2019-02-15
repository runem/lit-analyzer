import { CompletionEntry } from "typescript";
import { TsLitPluginStore } from "../../state/store";
import { tsModule } from "../../ts-module";
import { HtmlNode } from "../../types/html-node-types";
import { IHtmlPositionContext } from "../../util/get-html-position";
import { caseInsensitiveCmp } from "../../util/util";

export function completionsForHtmlAttrs(htmlNode: HtmlNode, positionContext: IHtmlPositionContext, store: TsLitPluginStore): CompletionEntry[] {
	const htmlTagAttrs = store.getHtmlTagAttrs(htmlNode);

	const unusedAttrs = htmlTagAttrs.filter(htmlAttr => !(htmlNode.attributes.find(attr => caseInsensitiveCmp(htmlAttr.name, attr.name)) != null));

	return unusedAttrs.map(htmlTagAttr => ({
		name: `${htmlTagAttr.name}${htmlTagAttr.required ? "!" : ""}`,
		insertText: htmlTagAttr.name,
		kind: htmlTagAttr.hasProp ? tsModule.ts.ScriptElementKind.memberVariableElement : tsModule.ts.ScriptElementKind.label,
		sortText: htmlTagAttr.hasProp ? "0" : "1"
	}));
}

export function completionsForHtmlNodes({ position, leftWord, rightWord }: IHtmlPositionContext, store: TsLitPluginStore): CompletionEntry[] {
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

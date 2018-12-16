import { DefinitionInfoAndBoundSpan, Node } from "typescript";
import { HtmlAttr } from "../../parse-html-nodes/types/html-attr-types";
import { HtmlNode, IHtmlTemplate } from "../../parse-html-nodes/types/html-node-types";
import { TsHtmlPluginStore } from "../../state/store";
import { iterateHtmlTemplate } from "../../util/iterate-html-template";

/**
 * Asks extensions for definitions.
 * @param position
 * @param templates
 * @param store
 */
export function getDefinitionAndBoundSpanFromHtmlTemplates(position: number, templates: IHtmlTemplate[], store: TsHtmlPluginStore): DefinitionInfoAndBoundSpan | undefined {
	const quickInfo = iterateHtmlTemplate<DefinitionInfoAndBoundSpan>(templates, {
		position: { start: position, end: position },
		stopOnNonEmpty: true,

		getNodeItems(htmlNode: HtmlNode, astNode: Node) {
			return store.extension.definitionAndBoundSpanForHtmlNode(htmlNode, {
				file: astNode.getSourceFile(),
				store,
				astNode,
				position
			});
		},
		getAttrItems(htmlAttr: HtmlAttr, astNode: Node) {
			return store.extension.definitionAndBoundSpanForHtmlAttr(htmlAttr, {
				file: astNode.getSourceFile(),
				store,
				astNode,
				position
			});
		}
	});

	return quickInfo.length > 0 ? quickInfo[0] : undefined;
}

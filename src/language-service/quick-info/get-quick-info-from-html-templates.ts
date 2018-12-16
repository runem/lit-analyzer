import { Node, QuickInfo, TypeChecker } from "typescript";
import { HtmlAttr } from "../../parse-html-nodes/types/html-attr-types";
import { HtmlNode, IHtmlTemplate } from "../../parse-html-nodes/types/html-node-types";
import { TsHtmlPluginStore } from "../../state/store";
import { iterateHtmlTemplate } from "../../util/iterate-html-template";

/**
 * Asks extensions for quick info at a specific position.
 * @param position
 * @param checker
 * @param templates
 * @param store
 */
export function getQuickInfoFromHtmlTemplates(position: number, checker: TypeChecker, templates: IHtmlTemplate[], store: TsHtmlPluginStore): QuickInfo | undefined {
	const quickInfo = iterateHtmlTemplate<QuickInfo>(templates, {
		position: { start: position, end: position },
		stopOnNonEmpty: true,

		getNodeItems(htmlNode: HtmlNode, astNode: Node) {
			return store.extension.quickInfoForHtmlNode(htmlNode, {
				file: astNode.getSourceFile(),
				store,
				astNode,
				position,
				checker
			});
		},

		getAttrItems(htmlAttr: HtmlAttr, astNode: Node) {
			return store.extension.quickInfoForHtmlAttr(htmlAttr, {
				file: astNode.getSourceFile(),
				store,
				astNode,
				position,
				checker
			});
		}
	});

	return quickInfo.length > 0 ? quickInfo[0] : undefined;
}

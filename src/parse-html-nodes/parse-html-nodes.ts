import { Node, TypeChecker } from "typescript";
import { TsHtmlPluginStore } from "../state/store";
import { IHtmlTemplateResult } from "./i-html-template-result";
import { IHtmlTemplate } from "./types/html-node-types";
import { visitHtmlNodes } from "./visit-html-nodes";

/**
 * Returns all html templates in a given file.
 * @param astNode
 * @param checker
 * @param store
 */
export function parseHtmlNodes(astNode: Node, checker: TypeChecker, store: TsHtmlPluginStore): IHtmlTemplateResult {
	const result: IHtmlTemplateResult = {
		fileName: astNode.getSourceFile().fileName,
		templates: []
	};

	visitHtmlNodes(astNode, {
		checker,
		store,
		emitHtmlTemplate(template: IHtmlTemplate) {
			result.templates.push(template);
		}
	});

	return result;
}

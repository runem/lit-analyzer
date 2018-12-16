import { Node } from "typescript";
import { IHtmlAttrBase } from "../parse-html-nodes/types/html-attr-types";
import { IHtmlNodeBase, IHtmlTemplate } from "../parse-html-nodes/types/html-node-types";
import { intersects } from "./util";

export interface IContext<T> {
	position?: { start: number; end: number };
	stopOnNonEmpty?: boolean;
	getNodeItems?(htmlNode: IHtmlNodeBase, node?: Node): T[] | T | undefined;
	getAttrItems?(htmlAttr: IHtmlAttrBase, node?: Node): T[] | T | undefined;
}

/**
 * Iterates through all html nodes and html attrs in a html template.
 * @param templates
 * @param ctx
 */
export function iterateHtmlTemplate<T>(templates: IHtmlTemplate[] | IHtmlTemplate, ctx: IContext<T>): T[] {
	const results: T[] = [];
	for (const template of Array.isArray(templates) ? templates : [templates]) {
		for (const childNode of template.childNodes) {
			results.push(...iterateHtmlNode(template.astNode, childNode, ctx));
			if (results.length > 0 && ctx.stopOnNonEmpty) return results;
		}
	}

	return results;
}

/**
 * Gets items from a html node.
 * @param node
 * @param htmlNode
 * @param ctx
 */
function iterateHtmlNode<T>(node: Node, htmlNode: IHtmlNodeBase, ctx: IContext<T>): T[] {
	const results: T[] = [];
	for (const htmlAttr of htmlNode.attributes) {
		results.push(...iterateHtmlAttr(node, htmlAttr, ctx));
		if (results.length > 0 && ctx.stopOnNonEmpty) return results;
	}

	for (const childNode of htmlNode.childNodes || []) {
		results.push(...iterateHtmlNode(node, childNode, ctx));
		if (results.length > 0 && ctx.stopOnNonEmpty) return results;
	}

	const positionInside = ctx.position == null || intersects(ctx.position, htmlNode.location.name);
	if (positionInside && ctx.getNodeItems) {
		const res = ctx.getNodeItems(htmlNode, node);
		results.push(...(res ? [...res] : []));
		if (results.length > 0 && ctx.stopOnNonEmpty) return results;
	}

	return results;
}

/**
 * Gets items from a html attribute.
 * @param astNode
 * @param htmlAttr
 * @param ctx
 */
function iterateHtmlAttr<T>(astNode: Node, htmlAttr: IHtmlAttrBase, ctx: IContext<T>): T[] {
	const positionInside = ctx.position == null || intersects(ctx.position, htmlAttr.location.name);
	const res = positionInside && ctx.getAttrItems != null ? ctx.getAttrItems(htmlAttr, astNode) : [];
	return res ? [...res] : [];
}

import { Node } from "typescript";
import { HTMLDocument } from "../html-document/html-document";
import { HtmlAttr } from "../html-document/types/html-attr-types";
import { HtmlNode } from "../html-document/types/html-node-types";
import { intersects } from "./util";

export interface IContext<T> {
	position?: { start: number; end: number };
	stopOnNonEmpty?: boolean;
	getNodeItems?(htmlNode: HtmlNode, node?: Node): T[] | T | undefined;
	getAttrItems?(htmlAttr: HtmlAttr, node?: Node): T[] | T | undefined;
}

/**
 * Iterates through all html nodes and html attrs in a html document.
 * @param htmlDocuments
 * @param ctx
 */
export function iterateHtmlDocuments<T>(htmlDocuments: HTMLDocument[] | HTMLDocument, ctx: IContext<T>): T[] {
	const results: T[] = [];
	for (const htmlDocument of Array.isArray(htmlDocuments) ? htmlDocuments : [htmlDocuments]) {
		for (const childNode of htmlDocument.rootNodes) {
			results.push(...iterateHtmlNode(htmlDocument.astNode, childNode, ctx));
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
function iterateHtmlNode<T>(node: Node, htmlNode: HtmlNode, ctx: IContext<T>): T[] {
	const results: T[] = [];
	for (const htmlAttr of htmlNode.attributes) {
		results.push(...iterateHtmlAttr(node, htmlAttr, ctx));
		if (results.length > 0 && ctx.stopOnNonEmpty) return results;
	}

	for (const childNode of htmlNode.children || []) {
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
function iterateHtmlAttr<T>(astNode: Node, htmlAttr: HtmlAttr, ctx: IContext<T>): T[] {
	const positionInside = ctx.position == null || intersects(ctx.position, htmlAttr.location.name);
	const res = positionInside && ctx.getAttrItems != null ? ctx.getAttrItems(htmlAttr, astNode) : [];
	return res ? [...res] : [];
}

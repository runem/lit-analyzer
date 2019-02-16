import { Node } from "typescript";
import { HtmlDocument } from "../parsing/text-document/html-document/html-document";
import { HtmlNodeAttr } from "../types/html-node-attr-types";
import { HtmlNode } from "../types/html-node-types";
import { intersects } from "./util";

export interface IContext<T> {
	position?: { start: number; end: number };
	stopOnNonEmpty?: boolean;
	getNodeItems?(htmlNode: HtmlNode, node?: Node): T[] | T | undefined;
	getAttrItems?(htmlAttr: HtmlNodeAttr, node?: Node): T[] | T | undefined;
}

/**
 * Iterates through all html nodes and html attrs in a html document.
 * @param htmlDocuments
 * @param ctx
 */
export function iterateHtmlDocuments<T>(htmlDocuments: HtmlDocument[] | HtmlDocument, ctx: IContext<T>): T[] {
	const results: T[] = [];
	for (const htmlDocument of Array.isArray(htmlDocuments) ? htmlDocuments : [htmlDocuments]) {
		for (const childNode of htmlDocument.rootNodes) {
			results.push(...iterateHtmlNode(htmlDocument.virtualDocument.astNode, childNode, ctx));
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
function iterateHtmlAttr<T>(astNode: Node, htmlAttr: HtmlNodeAttr, ctx: IContext<T>): T[] {
	const positionInside = ctx.position == null || intersects(ctx.position, htmlAttr.location.name);
	const res = positionInside && ctx.getAttrItems != null ? ctx.getAttrItems(htmlAttr, astNode) : [];
	return res ? [...res] : [];
}

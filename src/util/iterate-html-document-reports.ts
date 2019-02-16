import { Node } from "typescript";
import { HtmlDocument } from "../parsing/text-document/html-document/html-document";
import { HtmlNodeAttr } from "../types/html-node-attr-types";
import { HtmlNode } from "../types/html-node-types";
import { HtmlReport } from "../types/html-report-types";
import { TsLitPluginStore } from "../state/store";
import { iterateHtmlDocuments } from "./iterate-html-documents";
import { flatten, intersects } from "./util";

export interface IContext<T> {
	position?: { start: number; end: number };
	store: TsLitPluginStore;
	getNodeItems(htmlNode: HtmlNode, htmlReport: HtmlReport, astNode: Node): T[] | T | undefined;
	getAttrItems(htmlAttr: HtmlNodeAttr, htmlReport: HtmlReport, astNode: Node): T[] | T | undefined;
}

/**
 * Iterates through all html reports on all html attr and html nodes in a html document.
 * @param htmlDocuments
 * @param ctx
 */
export function iterateHtmlDocumentReports<T>(htmlDocuments: HtmlDocument[] | HtmlDocument, ctx: IContext<T>): T[] {
	htmlDocuments = Array.isArray(htmlDocuments) ? htmlDocuments : [htmlDocuments];

	iterateHtmlDocuments(htmlDocuments, {
		...ctx,
		getAttrItems(htmlAttr: HtmlNodeAttr, astNode: Node) {
			return flatten((ctx.store.getReportsForHtmlNodeOrAttr(htmlAttr) || []).map(report => iterateHtmlAttrReport(astNode, htmlAttr, report, ctx)));
		},
		getNodeItems(htmlNode: HtmlNode, astNode: Node) {
			return flatten((ctx.store.getReportsForHtmlNodeOrAttr(htmlNode) || []).map(report => iterateHtmlNodeReport(astNode, htmlNode, report, ctx)));
		}
	});

	return flatten(flatten(htmlDocuments.map(htmlDocument => htmlDocument.rootNodes.map(childNode => iterateHtmlNodeReports(htmlDocument.virtualDocument.astNode, childNode, ctx)))));
}

/**
 * Gets items from all html reports on a html node.
 * @param astNode
 * @param htmlNode
 * @param ctx
 */
function iterateHtmlNodeReports<T>(astNode: Node, htmlNode: HtmlNode, ctx: IContext<T>): T[] {
	const positionInside = ctx.position == null || intersects(ctx.position, htmlNode.location.name);

	return [
		...flatten(htmlNode.attributes.map(htmlAttr => iterateHtmlAttrReports(astNode, htmlAttr, ctx))),
		...(positionInside ? flatten((ctx.store.getReportsForHtmlNodeOrAttr(htmlNode) || []).map(report => iterateHtmlNodeReport(astNode, htmlNode, report, ctx))) : []),
		...flatten((htmlNode.children || []).map(child => iterateHtmlNodeReports(astNode, child, ctx)))
	];
}

/**
 * Gets items from a single html node
 * @param astNode
 * @param htmlNode
 * @param report
 * @param ctx
 */
function iterateHtmlNodeReport<T>(astNode: Node, htmlNode: HtmlNode, report: HtmlReport, ctx: IContext<T>): T[] {
	const res = ctx.getNodeItems(htmlNode, report, astNode);
	return res ? [...res] : [];
}

/**
 * Gets items from all html reports on a html attr.
 * @param astNode
 * @param htmlAttr
 * @param ctx
 */
function iterateHtmlAttrReports<T>(astNode: Node, htmlAttr: HtmlNodeAttr, ctx: IContext<T>): T[] {
	const positionInside = ctx.position == null || intersects(ctx.position, htmlAttr.location.name);

	return positionInside ? flatten((ctx.store.getReportsForHtmlNodeOrAttr(htmlAttr) || []).map(report => iterateHtmlAttrReport(astNode, htmlAttr, report, ctx))) : [];
}

/**
 * Gets attr items from a single html report.
 * @param astNode
 * @param htmlAttr
 * @param report
 * @param ctx
 */
function iterateHtmlAttrReport<T>(astNode: Node, htmlAttr: HtmlNodeAttr, report: HtmlReport, ctx: IContext<T>): T[] {
	const res = ctx.getAttrItems(htmlAttr, report, astNode);
	return res ? [...res] : [];
}

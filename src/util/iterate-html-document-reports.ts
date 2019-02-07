import { Node } from "typescript";
import { HTMLDocument } from "../html-document/html-document";
import { HtmlAttr, IHtmlAttrBase } from "../html-document/types/html-attr-types";
import { HtmlNode, IHtmlNodeBase } from "../html-document/types/html-node-types";
import { IHtmlReportBase } from "../html-document/types/html-report-types";
import { TsHtmlPluginStore } from "../state/store";
import { iterateHtmlDocuments } from "./iterate-html-documents";
import { flatten, intersects } from "./util";

export interface IContext<T> {
	position?: { start: number; end: number };
	store: TsHtmlPluginStore;
	getNodeItems(htmlNode: IHtmlNodeBase, htmlReport: IHtmlReportBase, astNode: Node): T[] | T | undefined;
	getAttrItems(htmlAttr: IHtmlAttrBase, htmlReport: IHtmlReportBase, astNode: Node): T[] | T | undefined;
}

/**
 * Iterates through all html reports on all html attr and html nodes in a html document.
 * @param htmlDocuments
 * @param ctx
 */
export function iterateHtmlDocumentReports<T>(htmlDocuments: HTMLDocument[] | HTMLDocument, ctx: IContext<T>): T[] {
	htmlDocuments = Array.isArray(htmlDocuments) ? htmlDocuments : [htmlDocuments];

	iterateHtmlDocuments(htmlDocuments, {
		...ctx,
		getAttrItems(htmlAttr: HtmlAttr, astNode: Node) {
			return flatten((ctx.store.getReportsForHtmlNodeOrAttr(htmlAttr) || []).map(report => iterateHtmlAttrReport(astNode, htmlAttr, report, ctx)));
		},
		getNodeItems(htmlNode: HtmlNode, astNode: Node) {
			return flatten((ctx.store.getReportsForHtmlNodeOrAttr(htmlNode) || []).map(report => iterateHtmlNodeReport(astNode, htmlNode, report, ctx)));
		}
	});

	return flatten(flatten(htmlDocuments.map(htmlDocument => htmlDocument.rootNodes.map(childNode => iterateHtmlNodeReports(htmlDocument.astNode, childNode, ctx)))));
}

/**
 * Gets items from all html reports on a html node.
 * @param astNode
 * @param htmlNode
 * @param ctx
 */
function iterateHtmlNodeReports<T>(astNode: Node, htmlNode: IHtmlNodeBase, ctx: IContext<T>): T[] {
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
function iterateHtmlNodeReport<T>(astNode: Node, htmlNode: IHtmlNodeBase, report: IHtmlReportBase, ctx: IContext<T>): T[] {
	const res = ctx.getNodeItems(htmlNode, report, astNode);
	return res ? [...res] : [];
}

/**
 * Gets items from all html reports on a html attr.
 * @param astNode
 * @param htmlAttr
 * @param ctx
 */
function iterateHtmlAttrReports<T>(astNode: Node, htmlAttr: IHtmlAttrBase, ctx: IContext<T>): T[] {
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
function iterateHtmlAttrReport<T>(astNode: Node, htmlAttr: IHtmlAttrBase, report: IHtmlReportBase, ctx: IContext<T>): T[] {
	const res = ctx.getAttrItems(htmlAttr, report, astNode);
	return res ? [...res] : [];
}

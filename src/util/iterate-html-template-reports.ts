import { Node } from "typescript";
import { HtmlAttr, IHtmlAttrBase } from "../parse-html-nodes/types/html-attr-types";
import { HtmlNode, IHtmlNodeBase, IHtmlTemplate } from "../parse-html-nodes/types/html-node-types";
import { IHtmlReportBase } from "../parse-html-nodes/types/html-report-types";
import { iterateHtmlTemplate } from "./iterate-html-template";
import { flatten, intersects } from "./util";

export interface IContext<T> {
	position?: { start: number; end: number };
	getNodeItems(htmlNode: IHtmlNodeBase, htmlReport: IHtmlReportBase, astNode: Node): T[] | T | undefined;
	getAttrItems(htmlAttr: IHtmlAttrBase, htmlReport: IHtmlReportBase, astNode: Node): T[] | T | undefined;
}

/**
 * Iterates through all html reports on all html attr and html nodes in a html template.
 * @param templates
 * @param ctx
 */
export function iterateHtmlTemplateReports<T>(templates: IHtmlTemplate[] | IHtmlTemplate, ctx: IContext<T>): T[] {
	templates = Array.isArray(templates) ? templates : [templates];

	iterateHtmlTemplate(templates, {
		...ctx,
		getAttrItems(htmlAttr: HtmlAttr, astNode: Node) {
			return flatten((htmlAttr.reports || []).map(report => iterateHtmlAttrReport(astNode, htmlAttr, report, ctx)));
		},
		getNodeItems(htmlNode: HtmlNode, astNode: Node) {
			return flatten((htmlNode.reports || []).map(report => iterateHtmlNodeReport(astNode, htmlNode, report, ctx)));
		}
	});

	return flatten(flatten(templates.map(template => template.childNodes.map(childNode => iterateHtmlNodeReports(template.astNode, childNode, ctx)))));
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
		...flatten((htmlNode.attributes || []).map(htmlAttr => iterateHtmlAttrReports(astNode, htmlAttr, ctx))),
		...(positionInside ? flatten((htmlNode.reports || []).map(report => iterateHtmlNodeReport(astNode, htmlNode, report, ctx))) : []),
		...flatten((htmlNode.childNodes || []).map(child => iterateHtmlNodeReports(astNode, child, ctx)))
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

	return positionInside ? flatten((htmlAttr.reports || []).map(report => iterateHtmlAttrReport(astNode, htmlAttr, report, ctx))) : [];
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

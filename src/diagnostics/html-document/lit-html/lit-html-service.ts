import { CodeFixAction, CompletionInfo, DefinitionInfoAndBoundSpan, DiagnosticWithLocation, QuickInfo } from "typescript";
import { HtmlDocument } from "../../../parsing/text-document/html-document/html-document";
import { isHTMLAttr } from "../../../types/html-node-attr-types";
import { isHTMLNode } from "../../../types/html-node-types";
import { DocumentPositionContext } from "../../../util/get-html-position";
import { flatten } from "../../../util/util";
import { DiagnosticsContext } from "../../diagnostics-context";
import { codeFixesForHtmlAttrReport, codeFixesForHtmlNodeReport } from "./code-fixes";
import { getCompletionInfoAtPosition } from "./completions";
import { definitionAndBoundSpanForHtmlAttr, definitionAndBoundSpanForHtmlNode } from "./definitions";
import { diagnosticsForHtmlAttrReport, diagnosticsForHtmlNodeReport } from "./diagnostics";
import { quickInfoForHtmlAttr, quickInfoForHtmlNode } from "./quick-info";

export class LitHtmlService {
	private get store() {
		return this.context.store;
	}

	constructor(private htmlDocument: HtmlDocument, private context: DiagnosticsContext) {}

	getCompletionInfoAtPosition(positionContext: DocumentPositionContext): CompletionInfo | undefined {
		return getCompletionInfoAtPosition(this.htmlDocument, positionContext, this.context);
	}

	getCodeFixesAtPosition(start: number, end: number): CodeFixAction[] {
		const hit = this.htmlDocument.htmlNodeOrAttrAtPosition({ start, end });
		if (hit == null) return [];

		const reports = this.store.getReportsForHtmlNodeOrAttr(hit);

		return flatten(
			reports
				.map(htmlReport => {
					if (isHTMLNode(hit)) {
						return codeFixesForHtmlNodeReport(hit, htmlReport, this.context);
					} else if (isHTMLAttr(hit)) {
						return codeFixesForHtmlAttrReport(hit, htmlReport, this.context);
					}
				})
				.filter((report): report is CodeFixAction[] => report != null)
		);
	}

	getQuickInfoAtPosition(position: number): QuickInfo | undefined {
		const hit = this.htmlDocument.htmlNodeOrAttrAtPosition(position);
		if (hit == null) return;

		if (isHTMLNode(hit)) {
			return quickInfoForHtmlNode(hit, this.context);
		}

		if (isHTMLAttr(hit)) {
			return quickInfoForHtmlAttr(hit, this.context);
		}
	}

	getDefinitionAndBoundSpanAtPosition(position: number): DefinitionInfoAndBoundSpan | undefined {
		const hit = this.htmlDocument.htmlNodeOrAttrAtPosition(position);
		if (hit == null) return;

		if (isHTMLNode(hit)) {
			return definitionAndBoundSpanForHtmlNode(hit, this.context);
		} else if (isHTMLAttr(hit)) {
			return definitionAndBoundSpanForHtmlAttr(hit, this.context);
		}
	}

	getDiagnostics(): DiagnosticWithLocation[] {
		return flatten(
			this.htmlDocument.mapNodes(htmlNode => {
				return [
					...flatten(this.store.getReportsForHtmlNodeOrAttr(htmlNode).map(htmlReport => diagnosticsForHtmlNodeReport(htmlNode, htmlReport, this.context))),

					...flatten(
						htmlNode.attributes.map(htmlAttr =>
							flatten(this.store.getReportsForHtmlNodeOrAttr(htmlAttr).map(htmlReport => diagnosticsForHtmlAttrReport(htmlAttr, htmlReport, this.context)))
						)
					)
				];
			})
		);
	}
}

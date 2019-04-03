import { HtmlDocument } from "../../parsing/text-document/html-document/html-document";
import { isHTMLAttr } from "../../parsing/text-document/html-document/parse-html-node/types/html-node-attr-types";
import { isHTMLNode } from "../../parsing/text-document/html-document/parse-html-node/types/html-node-types";
import { Range } from "../../types/range";
import { iterableDefined } from "../../util/iterable-util";
import { flatten, intersects } from "../../util/util";
import { DiagnosticsContext } from "../diagnostics-context";
import { LitCodeFix } from "../types/lit-code-fix";
import { LitCompletion } from "../types/lit-completion";
import { LitCompletionDetails } from "../types/lit-completion-details";
import { LitDefinition } from "../types/lit-definition";
import { LitHtmlDiagnostic } from "../types/lit-diagnostic";
import { LitFormatEdit } from "../types/lit-format-edit";
import { LitOutliningSpan, LitOutliningSpanKind } from "../types/lit-outlining-span";
import { LitQuickInfo } from "../types/lit-quick-info";
import { codeFixesForHtmlReport } from "./code-fix/code-fixes-for-html-report";
import { completionsAtOffset } from "./completion/completions-at-offset";
import { definitionForHtmlAttr } from "./definition/definition-for-html-attr";
import { definitionForHtmlNode } from "./definition/definition-for-html-node";
import { validateHTMLDocument } from "./diagnostic/validate-html-document";
import { quickInfoForHtmlAttr } from "./quick-info/quick-info-for-html-attr";
import { quickInfoForHtmlNode } from "./quick-info/quick-info-for-html-node";
import { VscodeHtmlService } from "./vscode-html-service";

export class LitHtmlService {
	vscodeHtmlService = new VscodeHtmlService();

	private completionsCache: LitCompletion[] = [];

	getOutliningSpans(document: HtmlDocument): LitOutliningSpan[] {
		return iterableDefined(
			document.mapNodes(node => {
				if (node.location.endTag == null) return undefined;

				// Calculate last index of the collapsed span.
				// We don't want to include the last line because it will include the </endtag> in the collapsed region
				const endIndex = (() => {
					const lastChild = node.children[node.children.length - 1];

					if (lastChild != null) {
						return lastChild.location.endTag != null ? lastChild.location.endTag.start : lastChild.location.startTag.end;
					}

					return node.location.endTag.start;
				})();

				return {
					autoCollapse: false,
					bannerText: node.tagName,
					kind: LitOutliningSpanKind.Code,
					location: { start: node.location.startTag.end, end: endIndex }
				} as LitOutliningSpan;
			})
		);
	}

	getCompletionDetails(document: HtmlDocument, offset: number, name: string, context: DiagnosticsContext): LitCompletionDetails | undefined {
		const completionWithName = this.completionsCache.find(completion => completion.name === name);

		if (completionWithName == null || completionWithName.documentation == null) return undefined;

		const primaryInfo = completionWithName.documentation();
		if (primaryInfo == null) return undefined;

		return {
			name,
			kind: completionWithName.kind,
			primaryInfo
		};
	}

	getCompletions(document: HtmlDocument, offset: number, context: DiagnosticsContext): LitCompletion[] {
		this.completionsCache = completionsAtOffset(document, offset, context);
		return completionsAtOffset(document, offset, context);
	}

	getCodeFixes(document: HtmlDocument, rangeOffset: Range, context: DiagnosticsContext): LitCodeFix[] {
		const hit = document.htmlNodeOrAttrAtOffset(rangeOffset);
		if (hit == null) return [];

		const reports = validateHTMLDocument(document, context);
		return flatten(reports.filter(report => intersects(rangeOffset, report.location)).map(report => codeFixesForHtmlReport(report, context)));
	}

	getQuickInfo(document: HtmlDocument, offset: number, context: DiagnosticsContext): LitQuickInfo | undefined {
		const hit = document.htmlNodeOrAttrAtOffset(offset);
		if (hit == null) return undefined;

		if (isHTMLNode(hit)) {
			return quickInfoForHtmlNode(hit, context);
		}

		if (isHTMLAttr(hit)) {
			return quickInfoForHtmlAttr(hit, context);
		}
	}

	getDefinition(document: HtmlDocument, offset: number, context: DiagnosticsContext): LitDefinition | undefined {
		const hit = document.htmlNodeOrAttrAtOffset(offset);
		if (hit == null) return undefined;

		if (isHTMLNode(hit)) {
			return definitionForHtmlNode(hit, context);
		} else if (isHTMLAttr(hit)) {
			return definitionForHtmlAttr(hit, context);
		}
	}

	getDiagnostics(document: HtmlDocument, context: DiagnosticsContext): LitHtmlDiagnostic[] {
		return validateHTMLDocument(document, context);
	}

	doTagComplete(document: HtmlDocument, offset: number): string | undefined {
		return this.vscodeHtmlService.doTagComplete(document, offset);
	}

	format(document: HtmlDocument, settings: ts.FormatCodeSettings): LitFormatEdit[] {
		return this.vscodeHtmlService.format(document, settings);
	}
}

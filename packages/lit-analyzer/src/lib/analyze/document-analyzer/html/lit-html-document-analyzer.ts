import { FormatCodeSettings } from "typescript";
import { LitAnalyzerContext } from "../../lit-analyzer-context.js";
import { HtmlDocument } from "../../parse/document/text-document/html-document/html-document.js";
import { isHTMLAttr } from "../../types/html-node/html-node-attr-types.js";
import { isHTMLNode } from "../../types/html-node/html-node-types.js";
import { LitClosingTagInfo } from "../../types/lit-closing-tag-info.js";
import { LitCodeFix } from "../../types/lit-code-fix.js";
import { LitCompletion } from "../../types/lit-completion.js";
import { LitCompletionDetails } from "../../types/lit-completion-details.js";
import { LitDefinition } from "../../types/lit-definition.js";
import { LitDiagnostic } from "../../types/lit-diagnostic.js";
import { LitFormatEdit } from "../../types/lit-format-edit.js";
import { LitOutliningSpan, LitOutliningSpanKind } from "../../types/lit-outlining-span.js";
import { LitQuickInfo } from "../../types/lit-quick-info.js";
import { LitRenameInfo } from "../../types/lit-rename-info.js";
import { LitRenameLocation } from "../../types/lit-rename-location.js";
import { DocumentOffset, DocumentRange } from "../../types/range.js";
import { iterableDefined } from "../../util/iterable-util.js";
import { documentRangeToSFRange } from "../../util/range-util.js";
import { codeFixesForHtmlDocument } from "./code-fix/code-fixes-for-html-document.js";
import { completionsAtOffset } from "./completion/completions-at-offset.js";
import { definitionForHtmlAttr } from "./definition/definition-for-html-attr.js";
import { definitionForHtmlNode } from "./definition/definition-for-html-node.js";
import { validateHTMLDocument } from "./diagnostic/validate-html-document.js";
import { LitHtmlVscodeService } from "./lit-html-vscode-service.js";
import { quickInfoForHtmlAttr } from "./quick-info/quick-info-for-html-attr.js";
import { quickInfoForHtmlNode } from "./quick-info/quick-info-for-html-node.js";
import { renameLocationsAtOffset } from "./rename-locations/rename-locations-at-offset.js";

export class LitHtmlDocumentAnalyzer {
	private vscodeHtmlService = new LitHtmlVscodeService();
	private completionsCache: LitCompletion[] = [];

	getCompletionDetailsAtOffset(
		document: HtmlDocument,
		offset: DocumentOffset,
		name: string,
		context: LitAnalyzerContext
	): LitCompletionDetails | undefined {
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

	getCompletionsAtOffset(document: HtmlDocument, offset: DocumentOffset, context: LitAnalyzerContext): LitCompletion[] {
		this.completionsCache = completionsAtOffset(document, offset, context);
		return completionsAtOffset(document, offset, context);
	}

	getDiagnostics(document: HtmlDocument, context: LitAnalyzerContext): LitDiagnostic[] {
		return validateHTMLDocument(document, context);
	}

	getClosingTagAtOffset(document: HtmlDocument, offset: DocumentOffset): LitClosingTagInfo | undefined {
		return this.vscodeHtmlService.getClosingTagAtOffset(document, offset);
	}

	getCodeFixesAtOffsetRange(document: HtmlDocument, offsetRange: DocumentRange, context: LitAnalyzerContext): LitCodeFix[] {
		const hit = document.htmlNodeOrAttrAtOffset(offsetRange);
		if (hit == null) return [];

		return codeFixesForHtmlDocument(document, offsetRange, context);
	}

	getDefinitionAtOffset(document: HtmlDocument, offset: DocumentOffset, context: LitAnalyzerContext): LitDefinition | undefined {
		const hit = document.htmlNodeOrAttrAtOffset(offset);
		if (hit == null) return undefined;

		if (isHTMLNode(hit)) {
			return definitionForHtmlNode(hit, context);
		} else if (isHTMLAttr(hit)) {
			return definitionForHtmlAttr(hit, context);
		}
		return;
	}

	getRenameInfoAtOffset(document: HtmlDocument, offset: DocumentOffset, context: LitAnalyzerContext): LitRenameInfo | undefined {
		const hit = document.htmlNodeOrAttrAtOffset(offset);
		if (hit == null) return undefined;

		if (isHTMLNode(hit)) {
			return {
				kind: "memberVariableElement",
				fullDisplayName: hit.tagName,
				displayName: hit.tagName,
				range: documentRangeToSFRange(document, { ...hit.location.name }),
				document,
				target: hit
			};
		}
		return;
	}

	getRenameLocationsAtOffset(document: HtmlDocument, offset: DocumentOffset, context: LitAnalyzerContext): LitRenameLocation[] {
		return renameLocationsAtOffset(document, offset, context);
	}

	getQuickInfoAtOffset(document: HtmlDocument, offset: DocumentOffset, context: LitAnalyzerContext): LitQuickInfo | undefined {
		const hit = document.htmlNodeOrAttrAtOffset(offset);
		if (hit == null) return undefined;

		if (isHTMLNode(hit)) {
			return quickInfoForHtmlNode(hit, context);
		}

		if (isHTMLAttr(hit)) {
			return quickInfoForHtmlAttr(hit, context);
		}
		return;
	}

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
					location: documentRangeToSFRange(document, { start: node.location.startTag.end, end: endIndex })
				} as LitOutliningSpan;
			})
		);
	}

	getFormatEdits(document: HtmlDocument, settings: FormatCodeSettings): LitFormatEdit[] {
		return this.vscodeHtmlService.format(document, settings);
	}
}

import { CodeFixAction, CompletionInfo, DefinitionInfoAndBoundSpan, DiagnosticWithLocation, FormatCodeSettings, JsxClosingTagInfo, QuickInfo, TextChange } from "typescript";
import { CssDocument } from "../parsing/text-document/css-document/css-document";
import { HtmlDocument } from "../parsing/text-document/html-document/html-document";
import { TextDocument } from "../parsing/text-document/text-document";
import { getPositionContextInDocument } from "../util/get-html-position";
import { flatten } from "../util/util";
import { VscodeCssService } from "./css-document/vscode-css/vscode-css-service";
import { DiagnosticsContext } from "./diagnostics-context";
import { LitHtmlService } from "./html-document/lit-html/lit-html-service";
import { VscodeHtmlService } from "./html-document/vscode-html/vscode-html-service";

export class DiagnosticsService {
	getCompletionInfoFromDocument(document: TextDocument, position: number, context: DiagnosticsContext): CompletionInfo | undefined {
		const positionContext = getPositionContextInDocument(document, position);

		if (document instanceof CssDocument) {
			return new VscodeCssService(document).getCompletionInfoAtPosition(positionContext.positionInText);
		} else if (document instanceof HtmlDocument) {
			return new LitHtmlService(document, context).getCompletionInfoAtPosition(positionContext);
		}
	}

	getCodeFixesFromDocument(document: TextDocument, start: number, end: number, context: DiagnosticsContext): CodeFixAction[] {
		if (document instanceof HtmlDocument) {
			return new LitHtmlService(document, context).getCodeFixesAtPosition(start, end);
		}

		return [];
	}

	getQuickInfoFromDocument(document: TextDocument, position: number, context: DiagnosticsContext): QuickInfo | undefined {
		const positionContext = getPositionContextInDocument(document, position);

		if (document instanceof CssDocument) {
			return new VscodeCssService(document).getQuickInfoAtPosition(positionContext.positionInText);
		} else if (document instanceof HtmlDocument) {
			return new LitHtmlService(document, context).getQuickInfoAtPosition(positionContext.position);
		}
	}

	getDefinitionAndBoundSpanFromDocument(document: TextDocument, position: number, context: DiagnosticsContext): DefinitionInfoAndBoundSpan | undefined {
		if (document instanceof HtmlDocument) {
			return new LitHtmlService(document, context).getDefinitionAndBoundSpanAtPosition(position);
		}
	}

	getDiagnosticsFromDocuments(documents: TextDocument[], context: DiagnosticsContext): DiagnosticWithLocation[] {
		return flatten(
			documents.map(document => {
				if (document instanceof CssDocument) {
					return new VscodeCssService(document).getDiagnostics();
				} else if (document instanceof HtmlDocument) {
					return new LitHtmlService(document, context).getDiagnostics();
				}

				return [];
			})
		);
	}

	getClosingTagFromDocument(document: TextDocument, position: number): JsxClosingTagInfo | undefined {
		if (document instanceof HtmlDocument) {
			return new VscodeHtmlService(document).doTagComplete(position);
		}
	}

	getFormattingEditsFromDocuments(documents: TextDocument[], settings: FormatCodeSettings): TextChange[] {
		return flatten(
			documents.map(document => {
				if (document instanceof HtmlDocument) {
					return new VscodeHtmlService(document).format(settings);
				}

				return [];
			})
		);
	}
}

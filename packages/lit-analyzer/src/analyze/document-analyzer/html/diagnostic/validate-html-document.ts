import { LitAnalyzerContext } from "../../../lit-analyzer-context";
import { HtmlDocument } from "../../../parse/document/text-document/html-document/html-document";
import { LitDiagnostic } from "../../../types/lit-diagnostic";
import { convertRuleDiagnosticToLitDiagnostic } from "../../../util/rule-diagnostic-util";

export function validateHTMLDocument(htmlDocument: HtmlDocument, context: LitAnalyzerContext): LitDiagnostic[] {
	return context.rules.getDiagnosticsFromDocument(htmlDocument, context).map(d => convertRuleDiagnosticToLitDiagnostic(d, context));
}

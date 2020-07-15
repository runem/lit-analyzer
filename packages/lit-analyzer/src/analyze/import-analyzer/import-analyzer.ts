import { LitAnalyzerContext } from "../lit-analyzer-context";
import { ReportedRuleDiagnostic } from "../rule-collection";
import { LitDiagnostic } from "../types/lit-diagnostic";
import { convertRuleDiagnosticToLitDiagnostic } from "../util/rule-diagnostic-util";
import { HtmlDocument } from "../parse/document/text-document/html-document/html-document";
import { ImportDeclaration } from "typescript";

export class ImportAnalyzer {
	getDiagnostics(
		importAndDocuments: { importDeclaration: ImportDeclaration; htmlDocuments: HtmlDocument[] },
		context: LitAnalyzerContext
	): LitDiagnostic[] {
		return this.getRuleDiagnostics(importAndDocuments, context).map(diagnostic => convertRuleDiagnosticToLitDiagnostic(diagnostic, context));
	}

	// TODO: Create Codefix and implement this function
	// getCodeFixesAtOffsetRange(
	//     importAndDocuments: { importStatement: Statement, htmlDocuments: HtmlDocument[] },
	//     context: LitAnalyzerContext
	// ): LitCodeFix[] {
	//     return arrayFlat(
	//         arrayDefined(
	//             this.getRuleDiagnostics(definitionOrDeclaration, context)
	//                 .filter(({ diagnostic }) => intersects(range, diagnostic.location))
	//                 .map(({ diagnostic }) => diagnostic.fix?.())
	//         )
	//     ).map(ruleFix => converRuleFixToLitCodeFix(ruleFix));
	// }

	private getRuleDiagnostics(
		importAndDocuments: { importDeclaration: ImportDeclaration; htmlDocuments: HtmlDocument[] },
		context: LitAnalyzerContext
	): ReportedRuleDiagnostic[] {
		return context.rules.getDiagnosticsFromImportStatement(importAndDocuments, context);
	}
}

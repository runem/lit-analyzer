import { LitAnalyzerContext } from "../lit-analyzer-context";
import { ReportedRuleDiagnostic } from "../rule-collection";
import { LitDiagnostic } from "../types/lit-diagnostic";
import { convertRuleDiagnosticToLitDiagnostic } from "../util/rule-diagnostic-util";

export class SourceFileAnalyzer {
	getDiagnostics(context: LitAnalyzerContext): LitDiagnostic[] {
		return this.getRuleDiagnostics(context).map(diagnostic => convertRuleDiagnosticToLitDiagnostic(diagnostic, context));
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

	private getRuleDiagnostics(context: LitAnalyzerContext): ReportedRuleDiagnostic[] {
		return context.rules.getDiagnosticsFromSourceFile(context);
	}
}

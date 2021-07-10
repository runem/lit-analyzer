import { LitAnalyzerContext } from "../lit-analyzer-context";
import { ReportedRuleDiagnostic } from "../rule-collection";
import { LitDiagnostic } from "../types/lit-diagnostic";
import { convertRuleDiagnosticToLitDiagnostic } from "../util/rule-diagnostic-util";
import { LitCodeFix } from "../types/lit-code-fix";
import { arrayDefined, arrayFlat } from "../util/array-util";
import { converRuleFixToLitCodeFix } from "../util/rule-fix-util";
import { Range } from "../types/range";
import { intersects } from "../util/range-util";

export class SourceFileAnalyzer {
	getDiagnostics(context: LitAnalyzerContext): LitDiagnostic[] {
		return this.getRuleDiagnostics(context).map(diagnostic => convertRuleDiagnosticToLitDiagnostic(diagnostic, context));
	}

	getCodeFixesAtOffsetRange(range: Range, context: LitAnalyzerContext): LitCodeFix[] {
		return arrayFlat(
			arrayDefined(
				this.getRuleDiagnostics(context)
					.filter(({ diagnostic }) => intersects(range, diagnostic.location))
					.map(({ diagnostic }) => diagnostic.fix?.())
			)
		).map(ruleFix => converRuleFixToLitCodeFix(ruleFix));
	}

	private getRuleDiagnostics(context: LitAnalyzerContext): ReportedRuleDiagnostic[] {
		return context.rules.getDiagnosticsFromSourceFile(context.currentFile, context);
	}
}

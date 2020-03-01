import { litDiagnosticRuleSeverity } from "../lit-analyzer-config";
import { LitAnalyzerContext } from "../lit-analyzer-context";
import { ReportedRuleDiagnostic } from "../rule-collection";
import { LitDiagnostic } from "../types/lit-diagnostic";

export function convertRuleDiagnosticToLitDiagnostic(reported: ReportedRuleDiagnostic, context: LitAnalyzerContext): LitDiagnostic {
	const source = reported.source;
	const { message, location, fixMessage, suggestion } = reported.diagnostic;

	return {
		fixMessage,
		location,
		suggestion,
		message,
		source,
		file: context.currentFile,
		severity: litDiagnosticRuleSeverity(context.config, source)
	};
}

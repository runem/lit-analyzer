import { LitAnalyzerContext, LitDiagnostic } from "lit-analyzer";
import { DiagnosticMessageChain, DiagnosticWithLocation, SourceFile } from "typescript";
import { translateRange } from "./translate-range";

export function translateDiagnostics(reports: LitDiagnostic[], file: SourceFile, context: LitAnalyzerContext): DiagnosticWithLocation[] {
	return reports.map(report => translateDiagnostic(report, file, context));
}

function translateDiagnostic(report: LitDiagnostic, file: SourceFile, context: LitAnalyzerContext): DiagnosticWithLocation {
	const span = translateRange(report.location);

	const category = report.severity === "error" ? context.ts.DiagnosticCategory.Error : context.ts.DiagnosticCategory.Warning;
	const code = 2322;
	const messageText: string | DiagnosticMessageChain =
		!context.config.dontShowSuggestions && report.suggestion
			? {
					messageText: report.message,
					code,
					category,
					next: {
						messageText: report.suggestion,
						code: 0,
						category: context.ts.DiagnosticCategory.Suggestion
					}
			  }
			: report.message;

	return {
		...span,
		file,
		messageText,
		category,
		code,
		source: report.source == null ? undefined : report.source
	};
}

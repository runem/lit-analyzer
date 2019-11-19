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
					messageText: `${report.message}${report.fix == null ? "" : ` ${report.fix}`}`,
					code,
					category,
					next: {
						messageText: report.suggestion,
						code: 0,
						category: context.ts.DiagnosticCategory.Suggestion
					}
			  }
			: report.message;
	if (Number(context.ts.versionMajorMinor) >= 3.6) {
		// The format of DiagnosticMessageChain#next changed in 3.6 to be an array.
		if (typeof messageText === "object" && messageText.next != null) {
			messageText.next = ([messageText.next] as unknown) as DiagnosticMessageChain;
		}
	}

	return {
		...span,
		file,
		messageText,
		category,
		code,
		source: report.source == null ? undefined : report.source
	};
}

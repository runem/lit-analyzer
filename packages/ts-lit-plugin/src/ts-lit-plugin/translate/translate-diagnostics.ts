import { LitAnalyzerContext, LitDiagnostic } from "lit-analyzer";
import { DiagnosticMessageChain, DiagnosticWithLocation, SourceFile } from "typescript";
import { translateRange } from "./translate-range";

export function translateDiagnostics(reports: LitDiagnostic[], file: SourceFile, context: LitAnalyzerContext): DiagnosticWithLocation[] {
	return reports.map(report => translateDiagnostic(report, file, context));
}

/**
 * Convert a diagnostic into a "message" that can be shown to the user.
 * @param diagnostic
 */
function getMessageTextFromDiagnostic(diagnostic: LitDiagnostic): string {
	return `${diagnostic.message}${diagnostic.fix == null ? "" : ` ${diagnostic.fix}`}`;
}

function translateDiagnostic(diagnostic: LitDiagnostic, file: SourceFile, context: LitAnalyzerContext): DiagnosticWithLocation {
	const span = translateRange(diagnostic.location);

	const category = diagnostic.severity === "error" ? context.ts.DiagnosticCategory.Error : context.ts.DiagnosticCategory.Warning;
	const code = 2322;
	const messageText: string | DiagnosticMessageChain =
		!context.config.dontShowSuggestions && diagnostic.suggestion
			? {
					messageText: getMessageTextFromDiagnostic(diagnostic),
					code,
					category,
					next: [
						{
							messageText: diagnostic.suggestion,
							code: 0,
							category: context.ts.DiagnosticCategory.Suggestion
						}
					]
			  }
			: getMessageTextFromDiagnostic(diagnostic);

	if (Number(context.ts.versionMajorMinor) < 3.6 && typeof messageText !== "string") {
		// The format of DiagnosticMessageChain#next changed in 3.6 to be an array.
		// This check for backwards compatibility
		if (messageText.next != null && Array.isArray(messageText.next)) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			messageText.next = messageText.next[0] as any;
		}
	}

	return {
		...span,
		file,
		messageText,
		category,
		code,
		source: diagnostic.source == null ? undefined : diagnostic.source
	};
}

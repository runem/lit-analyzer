import { SourceFile } from "typescript";
import { LitDiagnostic } from "../../analyze/types/lit-diagnostic.js";
import { AnalysisStats, DiagnosticFormatter } from "./diagnostic-formatter.js";

export class JsonDiagnosticFormatter implements DiagnosticFormatter {
	protected diagnostics: { file: SourceFile; diagnostics: LitDiagnostic[] }[] = [];

	report(_stats: AnalysisStats): string | undefined {
		return JSON.stringify(
			this.diagnostics.map(({ file, diagnostics }) => ({
				filePath: file.fileName,
				messages: diagnostics.map(diag => ({
					ruleId: `lit-analyzer/${diag.source}`,
					severity: diag.severity === "error" ? 2 : 1,
					message: diag.message,
					messageId: diag.code,
					...this.diagnosticsFileLocation(diag)
				})),
				errorCount: diagnostics.filter(d => d.severity === "error").length,
				// "fatalErrorCount": 0,
				// "fixableErrorCount": 0,
				warningCount: diagnostics.filter(d => d.severity === "warning").length,
				// "fixableWarningCount": 0,
				// "suppressedMessages": [],
				// "usedDeprecatedRules": []
				source: file.text
			}))
		);
	}

	diagnosticTextForFile(file: SourceFile, diagnostics: LitDiagnostic[]): string | undefined {
		if (diagnostics.length === 0) return undefined;
		this.diagnostics.push({ file, diagnostics });
		return undefined;
	}

	protected diagnosticsFileLocation(diagnostic: LitDiagnostic) {
		const fileToStart = diagnostic.file.text.slice(0, diagnostic.location.start).split("\n");
		const startLine = fileToStart[fileToStart.length - 1];
		const fileToEnd = diagnostic.file.text.slice(0, diagnostic.location.end).split("\n");
		const endLine = fileToEnd[fileToEnd.length - 1];
		return {
			line: fileToStart.length,
			column: startLine ? startLine.length + 1 : undefined,
			endLine: fileToEnd.length,
			endColumn: endLine ? endLine.length + 1 : undefined
		};
	}
}

import { SourceFile } from "typescript";
import { LitDiagnostic } from "../../analyze/types/lit-diagnostic";
import { AnalysisStats, DiagnosticFormatter } from "./diagnostic-formatter";
import { markdownHeader, markdownHighlight, markdownTable } from "./markdown-util";
import { relativeFileName, translateRange } from "./util";

export class MarkdownDiagnosticFormatter implements DiagnosticFormatter {
	report(stats: AnalysisStats): string | undefined {
		return `
${markdownHeader(2, "Summary")}
${markdownTable([
	["Files analyzed", "Files with problems", "Problems", "Errors", "Warnings"],
	[stats.totalFiles, stats.filesWithProblems, stats.diagnostics, stats.errors, stats.warnings].map(v => v.toString())
])}`;
	}

	diagnosticTextForFile(file: SourceFile, diagnostics: LitDiagnostic[]): string | undefined {
		if (diagnostics.length === 0) return undefined;

		return `
${markdownHeader(2, `${relativeFileName(file.fileName)}`)}
${markdownDiagnosticTable(file, diagnostics)}`;
	}
}

function markdownDiagnosticTable(file: SourceFile, diagnostics: LitDiagnostic[]): string {
	const headerRow: string[] = ["Line", "Column", "Type", "Rule", "Message"];

	const rows: string[][] = diagnostics.map((diagnostic): string[] => {
		const textSpan = translateRange(diagnostic.location);
		const lineContext = file.getLineAndCharacterOfPosition(textSpan.start);

		return [
			(lineContext.line + 1).toString(),
			(lineContext.character + 1).toString(),
			diagnostic.severity === "error" ? markdownHighlight("error") : "warning",
			diagnostic.source || "",
			diagnostic.message
		];
	});

	return markdownTable([headerRow, ...rows], { removeEmptyColumns: true });
}

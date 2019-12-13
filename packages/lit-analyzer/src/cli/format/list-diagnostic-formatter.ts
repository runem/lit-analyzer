import chalk from "chalk";
import { SourceFile } from "typescript";
import { LitDiagnostic } from "../../analyze/types/lit-diagnostic";
import { AnalysisStats, DiagnosticFormatter } from "./diagnostic-formatter";
import { generalReport, relativeFileName, textPad, translateRange } from "./util";

export class ListDiagnosticFormatter implements DiagnosticFormatter {
	report(stats: AnalysisStats): string | undefined {
		return generalReport(stats);
	}

	diagnosticTextForFile(file: SourceFile, diagnostics: LitDiagnostic[]): string | undefined {
		if (diagnostics.length === 0) return undefined;

		return diagnosticTextForFile(file, diagnostics);
	}
}

function diagnosticTextForFile(file: SourceFile, diagnostics: LitDiagnostic[]): string {
	const diagnosticText = diagnostics.map(diagnostic => litDiagnosticToErrorText(file, diagnostic)).join("\n");

	return `
${chalk.underline(`${relativeFileName(file.fileName)}`)}
${diagnosticText}`;
}

function litDiagnosticToErrorText(file: SourceFile, diagnostic: LitDiagnostic): string {
	const textSpan = translateRange(diagnostic.location);
	const lineContext = file.getLineAndCharacterOfPosition(textSpan.start);
	const linePart = `${textPad(`${lineContext.line + 1}`, { width: 5 })}:${textPad(`${lineContext.character}`, {
		width: 4,
		dir: "right"
	})}`;
	const severityPart = `${textPad(diagnostic.severity === "warning" ? chalk.yellow("warning") : chalk.red("error"), {
		width: 18,
		dir: "right"
	})}`;
	const messagePart = diagnostic.message;
	return `${linePart} ${severityPart} ${messagePart}`;
}

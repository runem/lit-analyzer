import chalk from "chalk";
import { TextSpan } from "typescript";
import { AnalysisStats } from "./diagnostic-formatter";

export function generalReport(stats: AnalysisStats): string {
	function numberStatText(n: number, text: string): string {
		return `${n} ${text}${n === 1 ? "" : "s"}`;
	}

	if (stats.diagnostics > 0) {
		const message = `  ✖ ${numberStatText(stats.diagnostics, "problem")} in ${numberStatText(stats.filesWithProblems, "file")} (${numberStatText(
			stats.errors,
			"error"
		)}, ${numberStatText(stats.warnings, "warning")})`;

		if (stats.errors > 0) {
			return `\n${chalk.red(message)}`;
		} else {
			return `\n${chalk.yellow(message)}`;
		}
	} else {
		return `\n${chalk.green(`  ✓ Found 0 problems in ${numberStatText(stats.totalFiles, "file")}`)}`;
	}
}

export function relativeFileName(fileName: string): string {
	return fileName.replace(process.cwd(), ".");
}

export function markText(text: string, range: TextSpan, colorFunction: (str: string) => string = chalk.bgRedBright): string {
	return (
		text.substring(0, range.start) + chalk.bold(colorFunction(text.substr(range.start, range.length))) + text.substring(range.start + range.length)
	);
}

export function textPad(str: string, { width, fill, dir }: { width: number; fill?: string; dir?: "left" | "right" }): string {
	const padding = (fill || " ").repeat(Math.max(0, width - str.length));
	return `${dir !== "right" ? padding : ""}${str}${dir === "right" ? padding : ""}`;
}

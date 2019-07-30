import { LitAnalyzerRules } from "../analyze/lit-analyzer-config";

export type FormatterFormat = "code" | "list" | "markdown";

export interface LitAnalyzerCliConfig {
	debug?: boolean;
	help?: boolean;
	noColor?: boolean;
	maxWarnings?: number;
	outFile?: string;
	failFast?: boolean;
	quiet?: boolean;
	strict?: boolean;
	format?: FormatterFormat;
	rules?: LitAnalyzerRules;
}

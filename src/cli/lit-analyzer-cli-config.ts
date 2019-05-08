export type FormatterFormat = "code" | "list";

export interface LitAnalyzerCliConfig {
	debug?: boolean;
	help?: boolean;
	noColor?: boolean;
	maxWarnings?: number;
	outFile?: string;
	failFast?: boolean;
	quiet?: boolean;
	format?: FormatterFormat;
}

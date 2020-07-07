import { SourceFile } from "typescript";
import { LitAnalyzerRuleId } from "../lit-analyzer-config";
import { SourceFileRange } from "./range";

export type LitDiagnosticSeverity = "error" | "warning";

export interface LitDiagnostic {
	location: SourceFileRange;
	code?: number;
	message: string;
	fixMessage?: string;
	suggestion?: string;
	source: LitAnalyzerRuleId;
	severity: LitDiagnosticSeverity;
	file: SourceFile;
}

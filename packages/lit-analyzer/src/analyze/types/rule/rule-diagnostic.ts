import { SourceFileRange } from "../range";
import { RuleFix } from "./rule-fix";

export interface RuleDiagnostic {
	location: SourceFileRange;
	message: string;
	fixMessage?: string;
	suggestion?: string;
	fix?: () => RuleFix[] | RuleFix;
}

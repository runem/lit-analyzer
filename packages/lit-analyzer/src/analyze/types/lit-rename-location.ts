import { SourceFileRange } from "./range";

export interface LitRenameLocation {
	fileName: string;
	prefixText?: string;
	suffixText?: string;
	range: SourceFileRange;
}

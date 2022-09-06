import { SourceFileRange } from "./range.js";

export interface LitRenameLocation {
	fileName: string;
	prefixText?: string;
	suffixText?: string;
	range: SourceFileRange;
}

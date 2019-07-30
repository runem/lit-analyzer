import { DocumentRange, SourceFileRange } from "./lit-range";

export interface LitRenameLocation {
	fileName: string;
	prefixText?: string;
	suffixText?: string;
	range: DocumentRange | SourceFileRange;
}

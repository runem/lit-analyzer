import { SourceFileRange } from "./range";

export interface LitFormatEdit {
	range: SourceFileRange;
	newText: string;
}

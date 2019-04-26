import { DocumentRange } from "./lit-range";

export interface LitFormatEdit {
	range: DocumentRange;
	newText: string;
}

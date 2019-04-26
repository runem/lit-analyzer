import { DocumentRange } from "./lit-range";

export interface LitQuickInfo {
	range: DocumentRange;
	primaryInfo: string;
	secondaryInfo?: string;
}

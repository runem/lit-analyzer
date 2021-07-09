import { SourceFileRange } from "./range.js";

export interface LitQuickInfo {
	range: SourceFileRange;
	primaryInfo: string;
	secondaryInfo?: string;
}

import { SourceFileRange } from "./range";

export interface LitQuickInfo {
	range: SourceFileRange;
	primaryInfo: string;
	secondaryInfo?: string;
}

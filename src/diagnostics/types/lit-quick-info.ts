import { Range } from "../../types/range";

export interface LitQuickInfo {
	range: Range;
	primaryInfo: string;
	secondaryInfo?: string;
}

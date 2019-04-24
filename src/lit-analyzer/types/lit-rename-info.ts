import { LitTargetKind } from "./lit-target-kind";
import { DocumentRange, SourceFileRange } from "./lit-range";

export interface LitRenameInfo {
	kind: LitTargetKind;
	displayName: string;
	fullDisplayName: string;
	range: SourceFileRange | DocumentRange;
}

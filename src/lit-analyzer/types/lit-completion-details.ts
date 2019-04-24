import { LitTargetKind } from "./lit-target-kind";

export interface LitCompletionDetails {
	name: string;
	kind: LitTargetKind;
	primaryInfo: string;
	secondaryInfo?: string;
}

import { LitTargetKind } from "./lit-target-kind.js";

export interface LitCompletionDetails {
	name: string;
	kind: LitTargetKind;
	primaryInfo: string;
	secondaryInfo?: string;
}

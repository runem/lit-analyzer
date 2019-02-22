import { LitCompletionKind } from "./lit-completion";

export interface LitCompletionDetails {
	name: string;
	kind: LitCompletionKind;
	primaryInfo: string;
	secondaryInfo?: string;
}

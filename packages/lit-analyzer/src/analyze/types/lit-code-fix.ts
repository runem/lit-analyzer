import { LitCodeFixAction } from "./lit-code-fix-action";

export interface LitCodeFix {
	name: string;
	message: string;
	actions: LitCodeFixAction[];
}

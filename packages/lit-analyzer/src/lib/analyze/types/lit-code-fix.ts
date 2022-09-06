import { LitCodeFixAction } from "./lit-code-fix-action.js";

export interface LitCodeFix {
	name: string;
	message: string;
	actions: LitCodeFixAction[];
}

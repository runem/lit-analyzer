import { RuleFixAction } from "./rule-fix-action.js";

export interface RuleFix {
	message: string;
	actions: RuleFixAction[];
}

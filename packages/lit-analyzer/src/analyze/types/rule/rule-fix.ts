import { RuleFixAction } from "./rule-fix-action";

export interface RuleFix {
	message: string;
	actions: RuleFixAction[];
}

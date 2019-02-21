import { Range } from "../../types/range";

export interface LitCompletion {
	name: string;
	insert: string;
	range?: Range;
	kind?: "label" | "member";
	importance?: "high" | "medium" | "low";
}

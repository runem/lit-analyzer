import { LitTargetKind } from "./lit-target-kind";
import { DocumentRange } from "./lit-range";

export interface LitCompletion {
	name: string;
	kind: LitTargetKind;
	kindModifiers?: "color";
	insert: string;
	range?: DocumentRange;
	importance?: "high" | "medium" | "low";
	documentation?(): string | undefined;
}

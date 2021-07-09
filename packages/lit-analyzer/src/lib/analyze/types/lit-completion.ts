import { LitTargetKind } from "./lit-target-kind";
import { SourceFileRange } from "./range";

export interface LitCompletion {
	name: string;
	kind: LitTargetKind;
	kindModifiers?: "color";
	insert: string;
	range?: SourceFileRange;
	importance?: "high" | "medium" | "low";
	sortText?: string;
	documentation?(): string | undefined;
}

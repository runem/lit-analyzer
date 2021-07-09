import { Node, SourceFile } from "typescript";
import { SourceFileRange } from "./range";

export type LitDefinitionTargetKind = "node" | "range";

export interface LitDefinitionTargetBase {
	kind: LitDefinitionTargetKind;
}

export interface LitDefinitionTargetNode extends LitDefinitionTargetBase {
	kind: "node";
	node: Node;
	name?: string;
}

export interface LitDefinitionTargetRange {
	kind: "range";
	sourceFile: SourceFile;
	range: SourceFileRange;
	name?: string;
}

export type LitDefinitionTarget = LitDefinitionTargetNode | LitDefinitionTargetRange;

export interface LitDefinition {
	fromRange: SourceFileRange;
	target: LitDefinitionTarget[] | LitDefinitionTarget;
}

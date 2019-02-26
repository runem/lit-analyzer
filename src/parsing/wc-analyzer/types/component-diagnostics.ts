import { Node } from "typescript";

export interface ComponentParsingDiagnostic {
	message: string;
	severity: "low" | "medium" | "high";
	node: Node;
}

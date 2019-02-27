import { Node } from "typescript";

export interface ComponentParsingDiagnostic {
	message: string;
	severity: "error" | "warning";
	node: Node;
}

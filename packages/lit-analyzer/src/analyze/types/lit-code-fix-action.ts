import { SourceFileRange } from "./range";

export interface LitCodeFixAction {
	range: SourceFileRange;
	newText: string;
}

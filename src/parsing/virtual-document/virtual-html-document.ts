import { Expression } from "typescript";
import { VirtualAstDocument } from "./virtual-ast-document";

export class VirtualAstHtmlDocument extends VirtualAstDocument {
	protected substituteExpression(length: number, expression: Expression): string {
		return "_".repeat(length);
	}
}

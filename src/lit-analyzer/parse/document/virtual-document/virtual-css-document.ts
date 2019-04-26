import { Expression } from "typescript";
import { VirtualAstDocument } from "./virtual-ast-document";

export class VirtualAstCssDocument extends VirtualAstDocument {
	protected substituteExpression(length: number, expression: Expression, prev: string, next: string | undefined): string {
		const hasLeftColon = prev.match(/:\s*\$\{$/) != null;
		const hasRightSemicolon = next != null && next.match(/^\}\s*;/) != null;

		// Take these scenarios into account and replace the expression with: "$a:_____":
		// Inspired by https://github.com/Microsoft/typescript-styled-plugin/blob/909d4f17d61562fe77f24587ea443713b8da851d/src/_substituter.ts#L62
		// div {
		//  ${unsafeCSS("color: red)};
		// }
		if (hasRightSemicolon && !hasLeftColon) {
			return `$a:_${"_".repeat(Math.max(0, length - 4))}`.slice(0, length);
		}

		return "_".repeat(length);
	}
}

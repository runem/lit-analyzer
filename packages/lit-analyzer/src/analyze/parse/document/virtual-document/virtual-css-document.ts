import { Expression } from "typescript";
import { VirtualAstDocument } from "./virtual-ast-document";

export class VirtualAstCssDocument extends VirtualAstDocument {
	protected substituteExpression(length: number, expression: Expression, prev: string, next: string | undefined): string {
		const hasLeftColon = prev.match(/:[^;{]*\${$/) != null;
		const hasRightColon = next != null && next.match(/^}\s*:\s+/) != null;
		const hasRightSemicolon = next != null && next.match(/^}\s*;/) != null;
		const hasRightPercentage = next != null && next.match(/^}%/) != null;

		// Inspired by https://github.com/Microsoft/typescript-styled-plugin/blob/909d4f17d61562fe77f24587ea443713b8da851d/src/_substituter.ts#L62
		// If this substitution contains both a property and a key, replace it with "$_:_"
		//   Example:
		//     div {
		//       ${unsafeCSS("color: red)};
		//     }
		if (hasRightSemicolon && !hasLeftColon) {
			const prefix = "$_:_";
			return `${prefix}${"_".repeat(Math.max(0, length - prefix.length))}`.slice(0, length);
		}

		// If there is "%" to the right of this substitution, replace with a number, because the parser expects a number unit
		//    Example:
		//	    div {
		//        transform-origin: ${x}% ${y}%;
		//      }
		else if (hasRightPercentage) {
			return "0".repeat(length);
		}

		// If there is a ": " to the right of this substitution, replace it with an identifier
		//     Example:
		//       div {
		//         ${unsafeCSS("color")}: red
		//       }
		else if (hasRightColon) {
			return `$${"_".repeat(length - 1)}`;
		}

		// Else replace with an identifier "_"
		return "_".repeat(length);
	}
}

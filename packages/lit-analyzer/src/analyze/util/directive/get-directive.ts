import { SimpleType, SimpleTypeKind, toSimpleType } from "ts-simple-type";
import { Expression } from "typescript";
import { LitAnalyzerRequest } from "../../lit-analyzer-context";
import { HtmlNodeAttrAssignment, HtmlNodeAttrAssignmentKind } from "../../types/html-node/html-node-attr-assignment-types";
import { removeUndefinedFromType } from "../type/remove-undefined-from-type";
import { isLitDirective } from "./is-lit-directive";

export type BuiltInDirectiveKind =
	| "ifDefined"
	| "guard"
	| "classMap"
	| "styleMap"
	| "unsafeHTML"
	| "cache"
	| "repeat"
	| "asyncReplace"
	| "asyncAppend";

export interface UserDefinedDirectiveKind {
	name: string;
}

interface Directive {
	kind: BuiltInDirectiveKind | UserDefinedDirectiveKind;
	actualType?: SimpleType;
	args: Expression[];
}

export function getDirective(assignment: HtmlNodeAttrAssignment, request: LitAnalyzerRequest): Directive | undefined {
	const { ts, program } = request;
	const checker = program.getTypeChecker();

	if (assignment.kind !== HtmlNodeAttrAssignmentKind.EXPRESSION) return;

	// Type check lit-html directives
	if (ts.isCallExpression(assignment.expression)) {
		const functionName = assignment.expression.expression.getText();
		const args = Array.from(assignment.expression.arguments);

		switch (functionName) {
			case "ifDefined": {
				// Example: html`<img src="${ifDefined(imageUrl)}">`;
				// Take the argument to ifDefined and remove undefined from the type union (if possible).
				// This new type becomes the actual type of the expression
				const actualType = (() => {
					if (args.length === 1) {
						const returnType = toSimpleType(checker.getTypeAtLocation(args[0]), checker);
						return removeUndefinedFromType(returnType);
					}

					return undefined;
				})();

				return {
					kind: "ifDefined",
					actualType,
					args
				};
			}

			case "guard": {
				// Example: html`<img src="${guard([imageUrl], () => Math.random() > 0.5 ? imageUrl : "nothing.png")}>`;
				// The return type of the function becomes the actual type of the expression
				const actualType = (() => {
					if (args.length === 2) {
						const returnFunctionType = toSimpleType(checker.getTypeAtLocation(args[1]), checker);

						if (returnFunctionType.kind === SimpleTypeKind.FUNCTION) {
							return returnFunctionType.returnType;
						}
					}

					return undefined;
				})();

				return {
					kind: "guard",
					actualType,
					args
				};
			}

			case "classMap":
			case "styleMap":
				return {
					kind: functionName,
					actualType: { kind: SimpleTypeKind.STRING },
					args
				};

			case "unsafeHTML":
			case "cache":
			case "repeat":
			case "asyncReplace":
			case "asyncAppend":
				return {
					kind: functionName,
					args
				};

			default:
				// Grab the type of the expression and get a SimpleType
				if (assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION) {
					const typeB = toSimpleType(checker.getTypeAtLocation(assignment.expression), checker);

					if (isLitDirective(typeB)) {
						// Now we have an unknown (user defined) directive.
						return {
							kind: {
								name: functionName
							},
							args
						};
					}
				}
		}
	}

	return;
}

import { SimpleType } from "ts-simple-type";

const partTypeNames: ReadonlySet<string | undefined> = new Set([
	"Part",
	"NodePart",
	"AttributePart",
	"BooleanAttributePart",
	"PropertyPart",
	"EventPart"
]);

/**
 * Checks whether a type is a lit-html 1.x or Lit 2 directive.
 */
export function isLitDirective(type: SimpleType): boolean {
	return isLit1Directive(type) || isLit2Directive(type);
}

/**
 * Checks whether a type is a lit-html 1.x directive.
 */
export function isLit1Directive(type: SimpleType): boolean {
	switch (type.kind) {
		case "ALIAS":
			return type.name === "DirectiveFn" || isLit1Directive(type.target);
		case "OBJECT":
			return type.call != null && isLit1Directive(type.call);
		case "FUNCTION": {
			// We expect a directive to be a function with at least one argument that
			// returns void.
			if (
				type.kind !== "FUNCTION" ||
				type.parameters == null ||
				type.parameters.length === 0 ||
				type.returnType == null ||
				type.returnType.kind !== "VOID"
			) {
				return false;
			}
			// And that one argument must all be lit Part types.
			const firstArg = type.parameters[0].type;
			if (firstArg.kind === "UNION") {
				return firstArg.types.every(t => partTypeNames.has(t.name));
			}
			return partTypeNames.has(firstArg.name);
		}
		case "GENERIC_ARGUMENTS":
			// Test for the built in type from lit-html: Directive<NodePart>
			return (type.target.kind === "FUNCTION" && type.target.name === "Directive") || isLit1Directive(type.target);
		default:
			return false;
	}
}

/**
 * Checks whether a type is a Lit 2 directive.
 */
export function isLit2Directive(type: SimpleType): boolean {
	return type.kind === "INTERFACE" && type.name === "DirectiveResult";
}

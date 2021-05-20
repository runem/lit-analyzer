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
 * Checks whether a type is a lit directive.
 * It will return true if the type is a function that takes a Part type and returns a void.
 * @param type
 */
export function isLitDirective(type: SimpleType): boolean {
	switch (type.kind) {
		case "ALIAS":
			return type.name === "DirectiveFn" || isLitDirective(type.target);
		case "INTERFACE":
			return type.name === "DirectiveResult";
		case "OBJECT":
			return type.call != null && isLitDirective(type.call);
		case "FUNCTION": {
			// (Lit 1) We expect a directive to be a function with at least one
			// argument that returns void.
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
			return (type.target.kind === "FUNCTION" && type.target.name === "Directive") || isLitDirective(type.target);
		default:
			return false;
	}
}

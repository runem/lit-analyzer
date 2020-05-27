import { SimpleType, SimpleTypeKind } from "ts-simple-type";

const partTypeNames: ReadonlySet<string | undefined> = new Set(["Part", "NodePart", "AttributePart", "BooleanAttributePart", "PropertyPart"]);

/**
 * Checks whether a type is a lit directive.
 * It will return true if the type is a function that takes a Part type and returns a void.
 * @param type
 */
export function isLitDirective(type: SimpleType): boolean {
	switch (type.kind) {
		case SimpleTypeKind.ALIAS:
			return type.name === "DirectiveFn" || isLitDirective(type.target);
		case SimpleTypeKind.FUNCTION: {
			// We expect a directive to be a function with at least one argument that
			// returns void.
			if (
				type.kind !== SimpleTypeKind.FUNCTION ||
				type.argTypes == null ||
				type.argTypes.length === 0 ||
				type.returnType == null ||
				type.returnType.kind !== SimpleTypeKind.VOID
			) {
				return false;
			}
			// And that one argument must all be lit Part types.
			const firstArg = type.argTypes[0].type;
			if (firstArg.kind === "UNION") {
				return firstArg.types.every(t => partTypeNames.has(t.name));
			}
			return partTypeNames.has(firstArg.name);
		}
		case SimpleTypeKind.GENERIC_ARGUMENTS:
			// Test for the built in type from lit-html: Directive<NodePart>
			return type.target.kind === SimpleTypeKind.FUNCTION && type.target.name === "Directive";
		default:
			return false;
	}
}

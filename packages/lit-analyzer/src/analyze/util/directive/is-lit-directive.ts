import { SimpleType, SimpleTypeKind } from "ts-simple-type";

/**
 * Checks whether a type is a lit directive.
 * It will return true if the type is a function that takes a Part type and returns a void.
 * @param type
 */
export function isLitDirective(type: SimpleType): boolean {
	switch (type.kind) {
		case SimpleTypeKind.ALIAS:
			return type.name === "DirectiveFn" || isLitDirective(type.target);
		case SimpleTypeKind.FUNCTION:
			return (
				type.kind === SimpleTypeKind.FUNCTION &&
				type.argTypes != null &&
				type.argTypes.length > 0 &&
				["Part", "NodePart", "AttributePart", "PropertyPart"].includes(type.argTypes[0].type.name || "") &&
				type.returnType != null &&
				type.returnType.kind === SimpleTypeKind.VOID
			);
		case SimpleTypeKind.GENERIC_ARGUMENTS:
			// Test for the built in type from lit-html: Directive<NodePart>
			return type.target.kind === SimpleTypeKind.FUNCTION && type.target.name === "Directive";
		default:
			return false;
	}
}

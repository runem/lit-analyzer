import { SimpleTypeEnumMember, SimpleType, SimpleTypeKind, isAssignableToSimpleTypeKind } from "ts-simple-type";

/**
 * Relax the type so that for example "string literal" become "string" and "function" become "any"
 * This is used for javascript files to provide type checking with Typescript type inferring
 * @param type
 */
export function relaxType(type: SimpleType): SimpleType {
	switch (type.kind) {
		case SimpleTypeKind.INTERSECTION:
		case SimpleTypeKind.UNION:
			return {
				...type,
				types: type.types.map(t => relaxType(t))
			};

		case SimpleTypeKind.ENUM:
			return {
				...type,
				types: type.types.map(t => relaxType(t) as SimpleTypeEnumMember)
			};

		case SimpleTypeKind.ARRAY:
			return {
				...type,
				type: relaxType(type.type)
			};

		case SimpleTypeKind.PROMISE:
			return {
				...type,
				type: relaxType(type.type)
			};

		case SimpleTypeKind.INTERFACE:
		case SimpleTypeKind.OBJECT:
		case SimpleTypeKind.FUNCTION:
		case SimpleTypeKind.CLASS:
			return {
				kind: SimpleTypeKind.ANY
			};

		case SimpleTypeKind.NUMBER_LITERAL:
			return { kind: SimpleTypeKind.NUMBER };
		case SimpleTypeKind.STRING_LITERAL:
			return { kind: SimpleTypeKind.STRING };
		case SimpleTypeKind.BOOLEAN_LITERAL:
			return { kind: SimpleTypeKind.BOOLEAN };
		case SimpleTypeKind.BIG_INT_LITERAL:
			return { kind: SimpleTypeKind.BIG_INT };

		case SimpleTypeKind.ENUM_MEMBER:
			return {
				...type,
				type: relaxType(type.type)
			} as SimpleTypeEnumMember;

		case SimpleTypeKind.ALIAS:
			return {
				...type,
				target: relaxType(type.target)
			};

		default:
			return type;
	}
}

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

export function removeUndefinedFromType(type: SimpleType): SimpleType {
	switch (type.kind) {
		case SimpleTypeKind.ALIAS:
			return {
				...type,
				target: removeUndefinedFromType(type.target)
			};
		case SimpleTypeKind.UNION:
			return {
				...type,
				types: type.types.filter(t => !isAssignableToSimpleTypeKind(t, SimpleTypeKind.UNDEFINED))
			};
	}

	return type;
}

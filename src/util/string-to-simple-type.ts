import { SimpleType, SimpleTypeKind, SimpleTypeStringLiteral } from "ts-simple-type";

export function stringToSimpleType(typeString: string | string[]): SimpleType {
	if (Array.isArray(typeString)) {
		return {
			kind: SimpleTypeKind.UNION,
			types: typeString.map(value => ({ kind: SimpleTypeKind.STRING_LITERAL, value } as SimpleTypeStringLiteral))
		};
	}

	switch (typeString) {
		case "number":
			return { kind: SimpleTypeKind.NUMBER };
		case "boolean":
			return { kind: SimpleTypeKind.BOOLEAN };
		case "string":
			return { kind: SimpleTypeKind.STRING };
		default:
			return { kind: SimpleTypeKind.ANY };
	}
}

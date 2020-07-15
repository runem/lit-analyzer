import { SimpleType, SimpleTypeUnion } from "ts-simple-type";

const PRIMITIVE_STRING_ARRAY_TYPE_BRAND = Symbol("PRIMITIVE_STRING_ARRAY_TYPE");

/**
 * Brands a union as a primitive array type
 * This type is used for the "role" attribute that is a whitespace separated list
 * @param union
 */
export function makePrimitiveArrayType(union: SimpleTypeUnion): SimpleTypeUnion {
	const extendedUnion: SimpleTypeUnion = {
		...union
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(extendedUnion as any)[PRIMITIVE_STRING_ARRAY_TYPE_BRAND] = true;

	return extendedUnion;
}

/**
 * Returns if a simple type is branded as a primitive array type
 * @param simpleType
 */
export function isPrimitiveArrayType(simpleType: SimpleType): simpleType is SimpleTypeUnion {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return simpleType.kind === "UNION" && (simpleType as any)[PRIMITIVE_STRING_ARRAY_TYPE_BRAND] === true;
}

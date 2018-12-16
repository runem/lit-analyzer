import { isAssignableToPrimitiveType, isAssignableToType, isAssignableToTypeKind, isAssignableToValue, isTypeKind, TypeKind } from "ts-is-assignable";
import { Node, TypeChecker } from "typescript";
import { ITsHtmlExtensionValidateExpressionContext } from "../extensions/i-ts-html-extension";
import { HtmlAttrAssignmentType } from "../parse-html-nodes/types/html-attr-assignment-types";
import { TsHtmlPluginStore } from "../state/store";
import { logger } from "../util/logger";

/**
 * Takes a type and returns a user friendly string that can be used in the UI.
 * @param type
 * @param checker
 */
function getTypeString(type: HtmlAttrAssignmentType, checker: TypeChecker): string {
	// Arrays are treated like enums
	if (Array.isArray(type)) return type.join(" | ");

	// Return a string for a given type kind
	if (isTypeKind(type)) {
		switch (type) {
			case TypeKind.ANY:
				return "any";
			case TypeKind.NUMBER:
				return "number";
			case TypeKind.BOOLEAN:
				return "boolean";
			case TypeKind.STRING:
				return "string";
			default:
				return "unknown";
		}
	}

	// Use the typescript checker to return a string for a type
	return checker.typeToString(type);
}

/**
 * Tests if typeB is assignable to typeA.
 * @param typeA
 * @param typeB
 * @param checker
 */
function testIsAssignableToType(typeA: HtmlAttrAssignmentType, typeB: HtmlAttrAssignmentType, checker: TypeChecker): boolean {
	// Check enum
	if (Array.isArray(typeB)) {
		return typeB.find(vb => testIsAssignableToValue(typeA, vb)) != null;
	}

	// Check typekind
	if (isTypeKind(typeB)) {
		return testIsAssignableToTypeKind(typeA, typeB);
	}

	// Check "typeA" enum
	if (Array.isArray(typeA)) {
		// TODO: Flip
		return typeA.find(ta => isAssignableToValue(typeB, ta)) != null;
	}

	// Check "typeA" typekind
	if (isTypeKind(typeA)) {
		if (typeA === TypeKind.ANY) return true;
		// TODO: Flip
		return isAssignableToTypeKind(typeB, typeA);
	}

	// Catch errors thrown because "isAssignableToType" can't take all possible types at the moment.
	try {
		return isAssignableToType(typeA, typeB, checker);
	} catch (e) {
		logger.debug("Type Checking Failed", e.message);
		return true;
	}
}

/**
 * Tests if typeA is assignable to a typekind
 * @param typeA
 * @param typeB
 */
function testIsAssignableToTypeKind(typeA: HtmlAttrAssignmentType, typeB: TypeKind): boolean {
	// Check enum
	if (Array.isArray(typeA)) {
		return [TypeKind.STRING, TypeKind.ANY].includes(typeB);
	}

	// Check typekind
	if (isTypeKind(typeA)) {
		return typeA === typeB || typeA === TypeKind.ANY || typeB === TypeKind.ANY;
	}

	// Check typescript type
	return isAssignableToTypeKind(typeA, typeB);
}

/**
 * Tests if typeA is assignable to a value.
 * @param typeA
 * @param value
 */
function testIsAssignableToValue(typeA: HtmlAttrAssignmentType, value: string): boolean {
	if (Array.isArray(typeA)) {
		return typeA.includes(value);
	}

	if (isTypeKind(typeA)) {
		return [TypeKind.STRING, TypeKind.ANY].includes(typeA);
	}

	return isAssignableToValue(typeA, value);
}

/**
 * Tests is a specific type is assignable to any primitive type.
 * @param type
 */
function testIsAssignableToPrimitive(type: HtmlAttrAssignmentType): boolean {
	if (Array.isArray(type)) {
		return true;
	}

	if (isTypeKind(type)) {
		return true;
	}

	return isAssignableToPrimitiveType(type);
}

/**
 * Returns a context object with helpers that can be used in type validator functions.
 * @param astNode
 * @param checker
 * @param store
 */
export function makeValidateAttributeAssignmentContext(astNode: Node, checker: TypeChecker, store: TsHtmlPluginStore): ITsHtmlExtensionValidateExpressionContext {
	return {
		store,
		checker,
		astNode,
		getTypeString: (type: HtmlAttrAssignmentType) => getTypeString(type, checker),
		isAssignableToPrimitive: (type: HtmlAttrAssignmentType) => testIsAssignableToPrimitive(type),
		isAssignableTo: (typeA: HtmlAttrAssignmentType, typeB: HtmlAttrAssignmentType) => testIsAssignableToType(typeA, typeB, checker),
		isAssignableToValue: (type: HtmlAttrAssignmentType, value: string) => testIsAssignableToValue(type, value)
	};
}

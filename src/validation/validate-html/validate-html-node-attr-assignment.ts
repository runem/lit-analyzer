import { isAssignableToPrimitiveType, isAssignableToSimpleTypeKind, isAssignableToType, SimpleTypeKind, toTypeString } from "ts-simple-type";
import { TypeChecker } from "typescript";
import { TsLitPluginStore } from "../../state/store";
import { HtmlNodeAttr } from "../../types/html-node-attr-types";
import { HtmlReport, HtmlReportKind } from "../../types/html-report-types";

/**
 * Validates an attribute assignment: lit-html style.
 * @param htmlAttr
 * @param checker
 * @param store
 */
export function validateHtmlAttrAssignment(htmlAttr: HtmlNodeAttr, checker: TypeChecker, store: TsLitPluginStore): HtmlReport[] {
	if (htmlAttr.assignment == null) return [];

	const htmlTagAttr = store.getHtmlTagAttr(htmlAttr);
	if (htmlTagAttr == null) return [];

	const typeA = htmlTagAttr.type;

	const {
		assignment: { isBooleanAssignment, typeB }
	} = htmlAttr;

	// Opt out if typeB is a function (eg. lit-html directive).
	// TODO: Support typechecking of lit-html directives.
	if (isAssignableToSimpleTypeKind(typeB, SimpleTypeKind.FUNCTION, checker)) return [];

	switch (htmlAttr.modifier) {
		case "?":
			// Test if the user is trying to use the ? modifier on a non-boolean type.
			if (!isAssignableToType(typeA, { kind: SimpleTypeKind.BOOLEAN })) {
				return [
					{
						kind: HtmlReportKind.LIT_BOOL_MOD_ON_NON_BOOL,
						typeA: toTypeString(typeA),
						typeB: toTypeString(typeB, checker)
					}
				];
			}
			break;

		case ".":
			break;

		default:
			// In this case there is no modifier. Therefore:
			// Only primitive types should be allowed as "typeB" and "typeA".

			if (!isAssignableToPrimitiveType(typeA)) {
				// Fail if the user is trying to assign a primitive value to a complex value.
				return [
					{
						kind: HtmlReportKind.LIT_PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX,
						isBooleanAssignment,
						typeA: toTypeString(typeA),
						typeB: toTypeString(typeB, checker) // isBooleanAssignment ? "boolean" : "string"
					}
				];
			} else if (
				isAssignableToPrimitiveType(typeB, checker) &&
				!(isAssignableToSimpleTypeKind(typeA, SimpleTypeKind.STRING) || isAssignableToSimpleTypeKind(typeA, SimpleTypeKind.STRING_LITERAL))
			) {
				// Return if typeA and typeB are both primitives and we don't have any modifiers.
				// However if typeA is a string, validate that the "value" (typeB which is a string literal) is assignable to typeA
				return [];
			}
	}

	// Take into account that 'disabled=""' is equal to a "true"
	if (
		htmlAttr.assignment.value != null &&
		htmlAttr.assignment.value.length === 0 &&
		isAssignableToType(typeA, {
			kind: SimpleTypeKind.BOOLEAN_LITERAL,
			value: true
		})
	) {
		return [];
	}

	if (!isAssignableToType(typeA, typeB, checker)) {
		// Fail if the two types are not assignable to each other.
		return [
			{
				kind: HtmlReportKind.LIT_INVALID_ATTRIBUTE_EXPRESSION_TYPE,
				typeA: toTypeString(typeA),
				typeB: toTypeString(typeB, checker)
			}
		];
	}

	return [];
}

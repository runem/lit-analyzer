import { isAssignableToType as _isAssignableToType, SimpleType, SimpleTypeComparisonOptions, typeToString } from "ts-simple-type";
import { HtmlNodeAttrAssignment, HtmlNodeAttrAssignmentKind } from "../../../analyze/types/html-node/html-node-attr-assignment-types.js";
import { HtmlNodeAttr } from "../../../analyze/types/html-node/html-node-attr-types.js";
import { RuleModuleContext } from "../../../analyze/types/rule/rule-module-context.js";
import { documentRangeToSFRange, rangeFromHtmlNodeAttr } from "../../../analyze/util/range-util.js";
import { isPrimitiveArrayType } from "../../../analyze/util/type-util.js";
import { isLitDirective } from "../directive/is-lit-directive.js";
import { isAssignableBindingUnderSecuritySystem } from "./is-assignable-binding-under-security-system.js";
import { isAssignableToType } from "./is-assignable-to-type.js";
import { HtmlNodeAttrKind } from "../../../analyze/types/html-node/html-node-attr-types.js";

export function isAssignableInAttributeBinding(
	htmlAttr: HtmlNodeAttr,
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	context: RuleModuleContext
): boolean | undefined {
	const { assignment } = htmlAttr;
	if (assignment == null) return undefined;

	if (htmlAttr.kind === HtmlNodeAttrKind.ATTRIBUTE) {
		const htmlAttrTarget = context.htmlStore.getHtmlAttrTarget(htmlAttr);
		const hasConverter = htmlAttrTarget?.declaration?.meta?.hasConverter;

		if (hasConverter) {
			return undefined;
		}
	}

	if (assignment.kind === HtmlNodeAttrAssignmentKind.BOOLEAN) {
		if (!isAssignableToType({ typeA, typeB }, context)) {
			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `Type '${typeToString(typeB)}' is not assignable to '${typeToString(typeA)}'`
			});

			return false;
		}
	} else {
		if (assignment.kind !== HtmlNodeAttrAssignmentKind.STRING) {
			// Purely static attributes are never security checked, they're handled
			// in the lit-html internals as trusted by default, because they can
			// not contain untrusted data, they were written by the developer.
			//
			// For everything else, we may need to apply a different type comparison
			// for some security-sensitive built in attributes and properties (like
			// <script src>).
			const securitySystemResult = isAssignableBindingUnderSecuritySystem(htmlAttr, { typeA, typeB }, context);
			if (securitySystemResult !== undefined) {
				// The security diagnostics take precedence here,
				// and we should not do any more checking.
				return securitySystemResult;
			}
		}

		const primitiveArrayTypeResult = isAssignableInPrimitiveArray(assignment, { typeA, typeB }, context);
		if (primitiveArrayTypeResult !== undefined) {
			return primitiveArrayTypeResult;
		}

		if (!isAssignableToType({ typeA, typeB }, context, { isAssignable: isAssignableToTypeWithStringCoercion })) {
			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `Type '${typeToString(typeB)}' is not assignable to '${typeToString(typeA)}'`
			});

			return false;
		}
	}

	return true;
}

/**
 * Assignability check that simulates string coercion
 * This is used to type check attribute bindings
 * @param typeA
 * @param typeB
 * @param options
 */
export function isAssignableToTypeWithStringCoercion(
	typeA: SimpleType,
	typeB: SimpleType,
	options: SimpleTypeComparisonOptions
): boolean | undefined {
	const safeOptions = { ...options, isAssignable: undefined };

	switch (typeB.kind) {
		/*case "NULL":
		 return _isAssignableToType(typeA, { kind: "STRING_LITERAL", value: "null" }, safeOptions);

		 case "UNDEFINED":
		 return _isAssignableToType(typeA, { kind: "STRING_LITERAL", value: "undefined" }, safeOptions);
		 */
		case "ALIAS":
		case "FUNCTION":
		case "GENERIC_ARGUMENTS":
			// Always return true if this is a lit directive
			if (isLitDirective(typeB)) {
				return true;
			}
			break;

		case "OBJECT":
		case "CLASS":
		case "INTERFACE":
			// This allows for types like: string | (part: Part) => void
			return _isAssignableToType(
				typeA,
				{
					kind: "STRING_LITERAL",
					value: "[object Object]"
				},
				safeOptions
			);

		case "STRING_LITERAL":
			/*if (typeA.kind === "ARRAY" && typeA.type.kind === "STRING_LITERAL") {
			}*/

			// Take into account that the empty string is is equal to true
			if (typeB.value.length === 0) {
				if (_isAssignableToType(typeA, { kind: "BOOLEAN_LITERAL", value: true }, safeOptions)) {
					return true;
				}
			}

			// Test if a potential string literal is a assignable to a number
			// Example: max="123"
			if (!isNaN(typeB.value as unknown as number)) {
				if (
					_isAssignableToType(
						typeA,
						{
							kind: "NUMBER_LITERAL",
							value: Number(typeB.value)
						},
						safeOptions
					)
				) {
					return true;
				}
			}

			break;

		case "BOOLEAN":
			// Test if a boolean coerced string is possible.
			// Example: aria-expanded="${this.open}"
			return _isAssignableToType(
				typeA,
				{
					kind: "UNION",
					types: [
						{
							kind: "STRING_LITERAL",
							value: "true"
						},
						{ kind: "STRING_LITERAL", value: "false" }
					]
				},
				safeOptions
			);

		case "BOOLEAN_LITERAL":
			/**
			 * Test if a boolean literal coerced to string is possible
			 * Example: aria-expanded="${this.open}"
			 */
			return _isAssignableToType(
				typeA,
				{
					kind: "STRING_LITERAL",
					value: String(typeB.value)
				},
				safeOptions
			);

		case "NUMBER":
			// Test if a number coerced to string is possible
			// Example: value="${this.max}"
			if (_isAssignableToType(typeA, { kind: "STRING" }, safeOptions)) {
				return true;
			}
			break;

		case "NUMBER_LITERAL":
			// Test if a number literal coerced to string is possible
			// Example: value="${this.max}"
			if (
				_isAssignableToType(
					typeA,
					{
						kind: "STRING_LITERAL",
						value: String(typeB.value)
					},
					safeOptions
				)
			) {
				return true;
			}
			break;
	}

	return undefined;
}

/**
 * Certain attributes like "role" are string literals, but should be type checked
 *   by comparing each item in the white-space-separated array against typeA
 * @param assignment
 * @param typeA
 * @param typeB
 * @param context
 */
export function isAssignableInPrimitiveArray(
	assignment: HtmlNodeAttrAssignment,
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	context: RuleModuleContext
): boolean | undefined {
	// Only check "STRING" and "EXPRESSION" for now
	if (assignment.kind !== HtmlNodeAttrAssignmentKind.STRING && assignment.kind !== HtmlNodeAttrAssignmentKind.EXPRESSION) {
		return undefined;
	}

	// Check if typeA is marked as a "primitive array type"
	if (isPrimitiveArrayType(typeA) && typeB.kind === "STRING_LITERAL") {
		// Split a value like: "button listitem" into ["button", " ", "listitem"]
		const valuesAndWhitespace = typeB.value.split(/(\s+)/g);
		const valuesNotAssignable: string[] = [];

		const startOffset = assignment.location.start;
		let offset = 0;

		for (const value of valuesAndWhitespace) {
			// Check all non-whitespace values
			if (value.match(/\s+/) == null && value !== "") {
				// Make sure that the the value is assignable to the union
				if (
					!isAssignableToType({ typeA, typeB: { kind: "STRING_LITERAL", value } }, context, { isAssignable: isAssignableToTypeWithStringCoercion })
				) {
					valuesNotAssignable.push(value);

					// If the assignment kind is "STRING" we can report diagnostics directly on the value in the HTML
					if (assignment.kind === "STRING") {
						context.report({
							location: documentRangeToSFRange(assignment.htmlAttr.document, {
								start: startOffset + offset,
								end: startOffset + offset + value.length
							}),
							message: `The value '${value}' is not assignable to '${typeToString(typeA)}'`
						});
					}
				}
			}

			offset += value.length;
		}

		// If the assignment kind as "EXPRESSION" report a single diagnostic on the attribute name
		if (assignment.kind === "EXPRESSION" && valuesNotAssignable.length > 0) {
			const multiple = valuesNotAssignable.length > 1;
			context.report({
				location: rangeFromHtmlNodeAttr(assignment.htmlAttr),
				message: `The value${multiple ? "s" : ""} ${valuesNotAssignable.map(v => `'${v}'`).join(", ")} ${
					multiple ? "are" : "is"
				} not assignable to '${typeToString(typeA)}'`
			});
		}

		return valuesNotAssignable.length === 0;
	}

	return undefined;
}

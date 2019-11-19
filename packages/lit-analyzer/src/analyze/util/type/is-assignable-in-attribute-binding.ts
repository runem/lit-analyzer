import { isAssignableToType as _isAssignableToType, SimpleType, SimpleTypeComparisonOptions, SimpleTypeKind, toTypeString } from "ts-simple-type";
import { litDiagnosticRuleSeverity } from "../../lit-analyzer-config";
import { LitAnalyzerRequest } from "../../lit-analyzer-context";
import { HtmlNodeAttrAssignmentKind } from "../../types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttr } from "../../types/html-node/html-node-attr-types";
import { LitHtmlDiagnostic, LitHtmlDiagnosticKind } from "../../types/lit-diagnostic";
import { isAssignableToType } from "./is-assignable-to-type";
import { isLitDirective } from "../directive/is-lit-directive";
import { isAssignableBindingUnderSecuritySystem } from "./is-assignable-binding-under-security-system";

export function isAssignableInAttributeBinding(
	htmlAttr: HtmlNodeAttr,
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	request: LitAnalyzerRequest
): LitHtmlDiagnostic[] | undefined {
	const { assignment } = htmlAttr;
	if (assignment == null) return undefined;

	if (assignment.kind === HtmlNodeAttrAssignmentKind.BOOLEAN) {
		if (!isAssignableToType({ typeA, typeB }, request)) {
			return [
				{
					kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE,
					message: `Type '${toTypeString(typeB)}' is not assignable to '${toTypeString(typeA)}'`,
					severity: litDiagnosticRuleSeverity(request.config, "no-incompatible-type-binding"),
					source: "no-incompatible-type-binding",
					location: { document: request.document, ...htmlAttr.location.name },
					htmlAttr,
					typeA,
					typeB
				}
			];
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
			const securityDiagnostics = isAssignableBindingUnderSecuritySystem(htmlAttr, { typeA, typeB }, request, "no-incompatible-type-binding");
			if (securityDiagnostics !== undefined) {
				// The security diagnostics take precedence here, and we should not
				// do any more checking. Note that this may be an empty array.
				return securityDiagnostics;
			}
		}
		if (!isAssignableToType({ typeA, typeB }, request, { isAssignable: isAssignableToTypeWithStringCoercion })) {
			return [
				{
					kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE,
					message: `Type '${toTypeString(typeB)}' is not assignable to '${toTypeString(typeA)}'`,
					severity: litDiagnosticRuleSeverity(request.config, "no-incompatible-type-binding"),
					source: "no-incompatible-type-binding",
					location: { document: request.document, ...htmlAttr.location.name },
					htmlAttr,
					typeA,
					typeB
				}
			];
		}
	}

	return undefined;
}

/**
 * Assignability check that simulates string coercion
 * This is used to type check attribute bindings
 * @param typeA
 * @param typeB
 * @param options
 */
export function isAssignableToTypeWithStringCoercion(typeA: SimpleType, typeB: SimpleType, options: SimpleTypeComparisonOptions) {
	const safeOptions = { ...options, isAssignable: undefined };

	switch (typeB.kind) {
		/*case SimpleTypeKind.NULL:
		 return _isAssignableToType(typeA, { kind: SimpleTypeKind.STRING_LITERAL, value: "null" }, safeOptions);

		 case SimpleTypeKind.UNDEFINED:
		 return _isAssignableToType(typeA, { kind: SimpleTypeKind.STRING_LITERAL, value: "undefined" }, safeOptions);
		 */
		case SimpleTypeKind.ALIAS:
		case SimpleTypeKind.FUNCTION:
		case SimpleTypeKind.GENERIC_ARGUMENTS:
			// Always return true if this is a lit directive
			if (isLitDirective(typeB)) {
				return true;
			}
			break;

		case SimpleTypeKind.OBJECT:
		case SimpleTypeKind.CLASS:
		case SimpleTypeKind.INTERFACE:
			// This allows for types like: string | (part: Part) => void
			return _isAssignableToType(
				typeA,
				{
					kind: SimpleTypeKind.STRING_LITERAL,
					value: "[object Object]"
				},
				safeOptions
			);

		case SimpleTypeKind.STRING_LITERAL:
			// Take into account that the empty string is is equal to true
			if (typeB.value.length === 0) {
				if (_isAssignableToType(typeA, { kind: SimpleTypeKind.BOOLEAN_LITERAL, value: true }, safeOptions)) {
					return true;
				}
			}

			// Test if a potential string literal is a assignable to a number
			// Example: max="123"
			if (!isNaN((typeB.value as unknown) as number)) {
				if (
					_isAssignableToType(
						typeA,
						{
							kind: SimpleTypeKind.NUMBER_LITERAL,
							value: Number(typeB.value)
						},
						safeOptions
					)
				) {
					return true;
				}
			}

			break;

		case SimpleTypeKind.BOOLEAN:
			// Test if a boolean coerced string is possible.
			// Example: aria-expanded="${this.open}"
			return _isAssignableToType(
				typeA,
				{
					kind: SimpleTypeKind.UNION,
					types: [
						{
							kind: SimpleTypeKind.STRING_LITERAL,
							value: "true"
						},
						{ kind: SimpleTypeKind.STRING_LITERAL, value: "false" }
					]
				},
				safeOptions
			);

		case SimpleTypeKind.BOOLEAN_LITERAL:
			/**
			 * Test if a boolean literal coerced to string is possible
			 * Example: aria-expanded="${this.open}"
			 */
			return _isAssignableToType(
				typeA,
				{
					kind: SimpleTypeKind.STRING_LITERAL,
					value: String(typeB.value)
				},
				safeOptions
			);

		case SimpleTypeKind.NUMBER:
			// Test if a number coerced to string is possible
			// Example: value="${this.max}"
			if (_isAssignableToType(typeA, { kind: SimpleTypeKind.STRING }, safeOptions)) {
				return true;
			}
			break;

		case SimpleTypeKind.NUMBER_LITERAL:
			// Test if a number literal coerced to string is possible
			// Example: value="${this.max}"
			if (
				_isAssignableToType(
					typeA,
					{
						kind: SimpleTypeKind.STRING_LITERAL,
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

import { isAssignableToSimpleTypeKind, SimpleTypeKind } from "ts-simple-type";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";
import { extractBindingTypes } from "../analyze/util/type/extract-binding-types";
import { isAssignableToTypeWithStringCoercion } from "../analyze/util/type/is-assignable-in-attribute-binding";
import { isAssignableToType } from "../analyze/util/type/is-assignable-to-type";

/**
 * This rule validates that you are not binding a boolean type in an attribute binding
 * This would result in binding the string 'true' or 'false' and a '?' binding should be used instead.
 */
const rule: RuleModule = {
	name: "no-boolean-in-attribute-binding",
	visitHtmlAssignment(assignment, request) {
		// Don't validate boolean attribute bindings.
		if (assignment.kind === HtmlNodeAttrAssignmentKind.BOOLEAN) return;

		// Only validate attribute bindings.
		const { htmlAttr } = assignment;
		if (htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE) return;

		const { typeA, typeB } = extractBindingTypes(assignment, request);

		// Return early if the attribute is like 'required=""' because this is assignable to boolean.
		if (typeB.kind === SimpleTypeKind.STRING_LITERAL && typeB.value.length === 0) {
			return;
		}

		// Check that typeB is not of any|unknown type and typeB is assignable to boolean.
		// Report a diagnostic if typeB is assignable to boolean type because this would result in binding the boolean coerced to string.
		if (
			!isAssignableToSimpleTypeKind(typeB, [SimpleTypeKind.ANY, SimpleTypeKind.UNKNOWN], { op: "or" }) &&
			isAssignableToType({ typeA: { kind: SimpleTypeKind.BOOLEAN }, typeB }, request)
		) {
			// Don't emit error if typeB is assignable to typeA with string coercion.
			if (isAssignableToType({ typeA, typeB }, request, { isAssignable: isAssignableToTypeWithStringCoercion })) {
				return;
			}

			return [
				{
					kind: LitHtmlDiagnosticKind.EXPRESSION_ONLY_ASSIGNABLE_WITH_BOOLEAN_BINDING,
					severity: litDiagnosticRuleSeverity(request.config, "no-boolean-in-attribute-binding"),
					source: "no-boolean-in-attribute-binding",
					message: `The value being assigned is a boolean type, but you are not using a boolean binding.`,
					fix: "Change to boolean binding?",
					location: { document: request.document, ...htmlAttr.location.name },
					htmlAttr,
					typeA,
					typeB
				}
			];
		}

		// Check that typeA is not of any|unknown type and typeA is assignable to boolean.
		// Report a diagnostic if typeA is assignable to boolean type because then
		//   we should probably be using a boolean binding instead of an attribute binding.
		if (
			!isAssignableToSimpleTypeKind(typeA, [SimpleTypeKind.ANY, SimpleTypeKind.UNKNOWN], { op: "or" }) &&
			isAssignableToType(
				{
					typeA: { kind: SimpleTypeKind.BOOLEAN },
					typeB: typeA
				},
				request
			)
		) {
			return [
				{
					kind: LitHtmlDiagnosticKind.EXPRESSION_ONLY_ASSIGNABLE_WITH_BOOLEAN_BINDING,
					severity: litDiagnosticRuleSeverity(request.config, "no-boolean-in-attribute-binding"),
					source: "no-boolean-in-attribute-binding",
					message: `The '${htmlAttr.name}' attribute is of boolean type but you are not using a boolean binding.`,
					fix: "Change to boolean binding?",
					location: { document: request.document, ...htmlAttr.location.name },
					htmlAttr,
					typeA,
					typeB
				}
			];
		}

		return;
	}
};

export default rule;

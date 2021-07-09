import { isAssignableToSimpleTypeKind } from "ts-simple-type";
import { LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER } from "../analyze/constants.js";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types.js";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types.js";
import { RuleModule } from "../analyze/types/rule/rule-module.js";
import { rangeFromHtmlNodeAttr } from "../analyze/util/range-util.js";
import { extractBindingTypes } from "./util/type/extract-binding-types.js";
import { isAssignableToTypeWithStringCoercion } from "./util/type/is-assignable-in-attribute-binding.js";
import { isAssignableToType } from "./util/type/is-assignable-to-type.js";

/**
 * This rule validates that you are not binding a boolean type in an attribute binding
 * This would result in binding the string 'true' or 'false' and a '?' binding should be used instead.
 */
const rule: RuleModule = {
	id: "no-boolean-in-attribute-binding",
	meta: {
		priority: "medium"
	},
	visitHtmlAssignment(assignment, context) {
		// Don't validate boolean attribute bindings.
		if (assignment.kind === HtmlNodeAttrAssignmentKind.BOOLEAN) return;

		// Only validate attribute bindings.
		const { htmlAttr } = assignment;
		if (htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE) return;

		const { typeA, typeB } = extractBindingTypes(assignment, context);

		// Return early if the attribute is like 'required=""' because this is assignable to boolean.
		if (typeB.kind === "STRING_LITERAL" && typeB.value.length === 0) return;

		// Check that typeB is not of any|unknown type and typeB is assignable to boolean.
		// Report a diagnostic if typeB is assignable to boolean type because this would result in binding the boolean coerced to string.
		if (!isAssignableToSimpleTypeKind(typeB, ["ANY", "UNKNOWN"]) && isAssignableToType({ typeA: { kind: "BOOLEAN" }, typeB }, context)) {
			// Don't emit error if typeB is assignable to typeA with string coercion.
			if (isAssignableToType({ typeA, typeB }, context, { isAssignable: isAssignableToTypeWithStringCoercion })) {
				return;
			}

			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `The value being assigned is a boolean type, but you are not using a boolean binding.`,
				fixMessage: "Change to boolean binding?",
				fix: () => {
					const newName = `${LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER}${htmlAttr.name}`;

					return {
						message: `Change to '${newName}'`,
						actions: [
							{
								kind: "changeAttributeName",
								htmlAttr,
								newName
							}
						]
					};
				}
			});
		}

		// Check that typeA is not of any|unknown type and typeA is assignable to boolean.
		// Report a diagnostic if typeA is assignable to boolean type because then
		//   we should probably be using a boolean binding instead of an attribute binding.
		else if (
			!isAssignableToSimpleTypeKind(typeA, ["ANY", "UNKNOWN"]) &&
			isAssignableToType(
				{
					typeA: { kind: "BOOLEAN" },
					typeB: typeA
				},
				context
			)
		) {
			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `The '${htmlAttr.name}' attribute is of boolean type but you are not using a boolean binding.`,
				fixMessage: "Change to boolean binding?",
				fix: () => {
					const newName = `${LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER}${htmlAttr.name}`;

					return {
						message: `Change to '${newName}'`,
						actions: [
							{
								kind: "changeAttributeName",
								htmlAttr,
								newName
							}
						]
					};
				}
			});
		}
	}
};

export default rule;

import { isAssignableToSimpleTypeKind, typeToString } from "ts-simple-type";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types.js";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types.js";
import { RuleModule } from "../analyze/types/rule/rule-module.js";
import { rangeFromHtmlNodeAttr } from "../analyze/util/range-util.js";
import { extractBindingTypes } from "./util/type/extract-binding-types.js";

/**
 * This rule validates that "null" and "undefined" types are not bound in an attribute binding.
 */
const rule: RuleModule = {
	id: "no-nullable-attribute-binding",
	meta: {
		priority: "high"
	},
	visitHtmlAssignment(assignment, context) {
		// Only validate "expression" kind bindings.
		if (assignment.kind !== HtmlNodeAttrAssignmentKind.EXPRESSION) return;

		// Only validate "attribute" bindings because these will coerce null|undefined to a string.
		const { htmlAttr } = assignment;
		if (htmlAttr.kind !== HtmlNodeAttrKind.ATTRIBUTE) return;

		const { typeB } = extractBindingTypes(assignment, context);
		const isAssignableToNull = isAssignableToSimpleTypeKind(typeB, "NULL");

		// Test if removing "undefined" or "null" from typeB would work and suggest using "ifDefined".
		if (isAssignableToNull || isAssignableToSimpleTypeKind(typeB, "UNDEFINED")) {
			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `This attribute binds the type '${typeToString(typeB)}' which can end up binding the string '${
					isAssignableToNull ? "null" : "undefined"
				}'.`,
				fixMessage: "Use the 'ifDefined' directive?",
				fix: () => ({
					message: `Use the 'ifDefined' directive.`,
					actions: [{ kind: "changeAssignment", assignment, newValue: `ifDefined(${assignment.expression.getText()})` }]
				})
			});
		}
	}
};
export default rule;

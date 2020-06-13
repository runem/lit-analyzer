import { isAssignableToSimpleTypeKind, typeToString } from "ts-simple-type";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { RuleModule } from "../analyze/types/rule/rule-module";
import { rangeFromHtmlNodeAttr } from "../analyze/util/range-util";
import { extractBindingTypes } from "./util/type/extract-binding-types";

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

		// Test if removing "null" from typeB would work and suggest using "ifDefined(exp === null ? undefined : exp)".
		if (isAssignableToSimpleTypeKind(typeB, "NULL")) {
			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `This attribute binds the type '${typeToString(typeB)}' which can be 'null'.`,
				fixMessage: "Use the 'ifDefined' directive and strict null check?",
				fix: () => {
					const newValue = `ifDefined(${assignment.expression.getText()} === null ? undefined : ${assignment.expression.getText()})`;

					return {
						message: `Use '${newValue}'`,
						actions: [{ kind: "changeAssignment", assignment, newValue }]
					};
				}
			});
		}

		// Test if removing "undefined" from typeB would work and suggest using "ifDefined".
		else if (isAssignableToSimpleTypeKind(typeB, "UNDEFINED")) {
			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `This attribute binds the type '${typeToString(typeB)}' which can be 'undefined'.`,
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

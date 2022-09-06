import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types.js";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types.js";
import { RuleModule } from "../analyze/types/rule/rule-module.js";
import { rangeFromHtmlNodeAttr } from "../analyze/util/range-util.js";

/**
 * This rule validates that non-attribute bindings are always used with an expression.
 */
const rule: RuleModule = {
	id: "no-expressionless-property-binding",
	meta: {
		priority: "high"
	},

	visitHtmlAssignment(assignment, context) {
		const { htmlAttr } = assignment;

		// Only make this check non-expression type assignments.
		switch (assignment.kind) {
			case HtmlNodeAttrAssignmentKind.STRING:
			case HtmlNodeAttrAssignmentKind.BOOLEAN:
				switch (htmlAttr.kind) {
					case HtmlNodeAttrKind.EVENT_LISTENER:
						context.report({
							location: rangeFromHtmlNodeAttr(htmlAttr),
							message: `You are using an event listener binding without an expression`
						});
						break;
					case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
						context.report({
							location: rangeFromHtmlNodeAttr(htmlAttr),
							message: `You are using a boolean attribute binding without an expression`
						});
						break;
					case HtmlNodeAttrKind.PROPERTY:
						context.report({
							location: rangeFromHtmlNodeAttr(htmlAttr),
							message: `You are using a property binding without an expression`
						});
						break;
				}
		}
	}
};

export default rule;

import {
	LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER,
	LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER,
	LIT_HTML_PROP_ATTRIBUTE_MODIFIER
} from "../analyze/constants.js";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types.js";
import { RuleModule } from "../analyze/types/rule/rule-module.js";
import { extractBindingTypes } from "./util/type/extract-binding-types.js";
import { isAssignableInAttributeBinding } from "./util/type/is-assignable-in-attribute-binding.js";
import { isAssignableInBooleanBinding } from "./util/type/is-assignable-in-boolean-binding.js";
import { isAssignableInPropertyBinding } from "./util/type/is-assignable-in-property-binding.js";
import { isAssignableInElementBinding } from "./util/type/is-assignable-in-element-binding.js";

/**
 * This rule validate if the types of a binding are assignable.
 */
const rule: RuleModule = {
	id: "no-incompatible-type-binding",
	meta: {
		priority: "low"
	},
	visitHtmlAssignment(assignment, context) {
		const { htmlAttr } = assignment;

		if (assignment.kind === HtmlNodeAttrAssignmentKind.ELEMENT_EXPRESSION) {
			// For element bindings we only care about the expression type
			const { typeB } = extractBindingTypes(assignment, context);
			isAssignableInElementBinding(htmlAttr, typeB, context);
		}

		if (context.htmlStore.getHtmlAttrTarget(htmlAttr) == null) {
			return;
		}

		const { typeA, typeB } = extractBindingTypes(assignment, context);

		// Validate types based on the binding in which they appear
		switch (htmlAttr.modifier) {
			case LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER:
				isAssignableInBooleanBinding(htmlAttr, { typeA, typeB }, context);
				break;

			case LIT_HTML_PROP_ATTRIBUTE_MODIFIER:
				isAssignableInPropertyBinding(htmlAttr, { typeA, typeB }, context);
				break;

			case LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER:
				break;

			default: {
				isAssignableInAttributeBinding(htmlAttr, { typeA, typeB }, context);
				break;
			}
		}
	}
};

export default rule;

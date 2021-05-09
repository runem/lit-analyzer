import {
	LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER,
	LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER,
	LIT_HTML_PROP_ATTRIBUTE_MODIFIER
} from "../analyze/constants";
import { RuleModule } from "../analyze/types/rule/rule-module";
import { extractBindingTypes } from "./util/type/extract-binding-types";
import { isAssignableInAttributeBinding } from "./util/type/is-assignable-in-attribute-binding";
import { isAssignableInBooleanBinding } from "./util/type/is-assignable-in-boolean-binding";
import { isAssignableInPropertyBinding } from "./util/type/is-assignable-in-property-binding";
import { isAssignableInEventBinding } from "./util/type/is-assignable-in-event-binding";

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

		if (context.htmlStore.getHtmlAttrTarget(assignment.htmlAttr) == null) {
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
				isAssignableInEventBinding(htmlAttr, { typeA, typeB }, context);
				break;

			default: {
				isAssignableInAttributeBinding(htmlAttr, { typeA, typeB }, context);
				break;
			}
		}
	}
};

export default rule;

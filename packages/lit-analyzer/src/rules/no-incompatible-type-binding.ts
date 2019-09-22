import {
	LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER,
	LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER,
	LIT_HTML_PROP_ATTRIBUTE_MODIFIER
} from "../analyze/constants";
import { RuleModule } from "../analyze/types/rule-module";
import { extractBindingTypes } from "../analyze/util/type/extract-binding-types";
import { isAssignableInAttributeBinding } from "../analyze/util/type/is-assignable-in-attribute-binding";
import { isAssignableInBooleanBinding } from "../analyze/util/type/is-assignable-in-boolean-binding";
import { isAssignableInPropertyBinding } from "../analyze/util/type/is-assignable-in-property-binding";

/**
 * This rule validate if the types of a binding are assignable.
 */
const rule: RuleModule = {
	name: "no-incompatible-type-binding",
	visitHtmlAssignment(assignment, request) {
		const { htmlAttr } = assignment;

		const { typeA, typeB } = extractBindingTypes(assignment, request);

		// Validate types based on the binding in which they appear
		switch (htmlAttr.modifier) {
			case LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER:
				return isAssignableInBooleanBinding(htmlAttr, { typeA, typeB }, request);

			case LIT_HTML_PROP_ATTRIBUTE_MODIFIER:
				return isAssignableInPropertyBinding(htmlAttr, { typeA, typeB }, request);

			case LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER:
				break;

			default: {
				return isAssignableInAttributeBinding(htmlAttr, { typeA, typeB }, request);
			}
		}

		return;
	}
};

export default rule;

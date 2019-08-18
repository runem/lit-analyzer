import {
	LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER,
	LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER,
	LIT_HTML_PROP_ATTRIBUTE_MODIFIER
} from "../../../../../constants";
import { RuleModule } from "../rule-module";
import { extractBindingTypes } from "./util/extract-binding-types";
import { isAssignableInAttributeBinding } from "./util/is-assignable-in-attribute-binding";
import { isAssignableInBooleanBinding } from "./util/is-assignable-in-boolean-binding";
import { isAssignableInPropertyBinding } from "./util/is-assignable-in-property-binding";

const rule: RuleModule = {
	name: "no-incompatible-type-binding",
	visitHtmlAssignment(assignment, request) {
		const { htmlAttr } = assignment;

		const { typeA, typeB } = extractBindingTypes(assignment, request);

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

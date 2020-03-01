import { isAssignableToSimpleTypeKind, SimpleType, SimpleTypeKind, toTypeString } from "ts-simple-type";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { RuleModule } from "../analyze/types/rule/rule-module";
import { rangeFromHtmlNodeAttr } from "../analyze/util/range-util";
import { extractBindingTypes } from "./util/type/extract-binding-types";

/**
 * This rule validates that only callable types are used within event binding expressions.
 * This rule catches typos like: @click="onClick()"
 */
const rule: RuleModule = {
	id: "no-noncallable-event-binding",
	meta: {
		priority: "high"
	},
	visitHtmlAssignment(assignment, context) {
		// Only validate event listener bindings.
		const { htmlAttr } = assignment;
		if (htmlAttr.kind !== HtmlNodeAttrKind.EVENT_LISTENER) return;

		const { typeB } = extractBindingTypes(assignment, context);

		// Make sure that the expression given to the event listener binding a function or an object with "handleEvent" property.
		if (!isTypeBindableToEventListener(typeB)) {
			context.report({
				location: rangeFromHtmlNodeAttr(htmlAttr),
				message: `You are setting up an event listener with a non-callable type '${toTypeString(typeB)}'`
			});
		}
	}
};

export default rule;

/**
 * Returns if this type can be used in a event listener binding
 * @param type
 */
function isTypeBindableToEventListener(type: SimpleType): boolean {
	// Callable types can be used in the binding
	if (
		isAssignableToSimpleTypeKind(type, [SimpleTypeKind.FUNCTION, SimpleTypeKind.METHOD, SimpleTypeKind.UNKNOWN], {
			matchAny: true,
			op: "or"
		})
	) {
		return true;
	}

	// Object types with attributes for the setup function of the event listener can be used
	if (type.kind === SimpleTypeKind.OBJECT || type.kind === SimpleTypeKind.INTERFACE) {
		// The "handleEvent" property must be present
		const handleEventFunction = type.members != null ? type.members.find(m => m.name === "handleEvent") : undefined;

		// The "handleEvent" property must be callable
		if (handleEventFunction != null) {
			return isTypeBindableToEventListener(handleEventFunction.type);
		}
	}

	return false;
}

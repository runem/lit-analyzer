import { isAssignableToSimpleTypeKind, SimpleType, typeToString, validateType } from "ts-simple-type";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types.js";
import { RuleModule } from "../analyze/types/rule/rule-module.js";
import { rangeFromHtmlNodeAttr } from "../analyze/util/range-util.js";
import { extractBindingTypes } from "./util/type/extract-binding-types.js";

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
				message: `You are setting up an event listener with a non-callable type '${typeToString(typeB)}'`
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
	// Return "true" if the type has a call signature
	if ("call" in type && type.call != null) {
		return true;
	}

	// Callable types can be used in the binding
	if (isAssignableToSimpleTypeKind(type, ["FUNCTION", "METHOD", "UNKNOWN"], { matchAny: true })) {
		return true;
	}

	return validateType(type, simpleType => {
		switch (simpleType.kind) {
			// Object types with attributes for the setup function of the event listener can be used
			case "OBJECT":
			case "INTERFACE": {
				// The "handleEvent" property must be present
				const handleEventFunction = simpleType.members != null ? simpleType.members.find(m => m.name === "handleEvent") : undefined;

				// The "handleEvent" property must be callable
				if (handleEventFunction != null) {
					return isTypeBindableToEventListener(handleEventFunction.type);
				}
			}
		}

		return undefined;
	});
}

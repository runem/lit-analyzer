import { isAssignableToSimpleTypeKind, SimpleType, SimpleTypeKind, toTypeString } from "ts-simple-type";
import { litDiagnosticRuleSeverity } from "../../../../../lit-analyzer-config";
import { HtmlNodeAttrKind } from "../../../../../types/html-node/html-node-attr-types";
import { LitHtmlDiagnosticKind } from "../../../../../types/lit-diagnostic";
import { RuleModule } from "../rule-module";
import { extractBindingTypes } from "./util/extract-binding-types";

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

const rule: RuleModule = {
	name: "no-noncallable-event-binding",
	visitHtmlAssignment(assignment, request) {
		const { htmlAttr } = assignment;
		if (htmlAttr.kind !== HtmlNodeAttrKind.EVENT_LISTENER) return;

		const { typeB } = extractBindingTypes(assignment, request);

		// Make sure that there is a function as event listener value.
		// Here we catch errors like: @click="onClick()"
		if (!isTypeBindableToEventListener(typeB)) {
			return [
				{
					kind: LitHtmlDiagnosticKind.NO_EVENT_LISTENER_FUNCTION,
					message: `You are setting up an event listener with a non-callable type '${toTypeString(typeB)}'`,
					source: "no-noncallable-event-binding",
					severity: litDiagnosticRuleSeverity(request.config, "no-noncallable-event-binding"),
					location: { document: request.document, ...htmlAttr.location.name },
					typeB
				}
			];
		}

		return;
	}
};

export default rule;

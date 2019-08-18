import { toTypeString, SimpleType, isAssignableToSimpleTypeKind, SimpleTypeKind } from "ts-simple-type";
import { RuleModule } from "../analyze/types/rule-module";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { extractAttributeTypes } from "../analyze/util/attribute-util";

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

const rule: RuleModule = context => {
	return {
		enterHtmlAttribute(node: HtmlNodeAttr) {
			const { assignment } = node;

			if (assignment == null || node.kind !== HtmlNodeAttrKind.EVENT_LISTENER) {
				return;
			}

			const { document } = context;
			const types = extractAttributeTypes(context, node);

			if (!types) {
				return;
			}

			const { typeB } = types;

			// Make sure that there is a function as event listener value.
			// Here we catch errors like: @click="onClick()"
			if (!isTypeBindableToEventListener(typeB)) {
				context.reports.push({
					kind: LitHtmlDiagnosticKind.NO_EVENT_LISTENER_FUNCTION,
					message: `You are setting up an event listener with a non-callable type '${toTypeString(typeB)}'`,
					source: "no-noncallable-event-binding",
					severity: litDiagnosticRuleSeverity(context.config, "no-noncallable-event-binding"),
					location: { document, ...node.location.name },
					typeB
				});
			}
		}
	};
};

export default rule;

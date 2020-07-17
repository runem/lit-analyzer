import { SimpleType, typeToString } from "ts-simple-type";
import { parseSimpleJsDocTypeExpression } from "web-component-analyzer";
import { HtmlNodeAttr } from "../../../analyze/types/html-node/html-node-attr-types";
import { RuleModuleContext } from "../../../analyze/types/rule/rule-module-context";
import { rangeFromHtmlNodeAttr } from "../../../analyze/util/range-util";
import { isAssignableToType } from "./is-assignable-to-type";

export function isAssignableInEventBinding(
	htmlAttr: HtmlNodeAttr,
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	context: RuleModuleContext
): boolean | undefined {
	let strictFunctionTypes: undefined | boolean = undefined;

	// Treat type "ANY" as "Event"
	if (typeA.kind === "ANY") {
		typeA = parseSimpleJsDocTypeExpression("Event", context);

		// If we don't know the exact type of event required, always type check
		//   the event bivariant. In this case we only care if the parameter in
		//   typeB is an Event, and this is achieved forcing "strictFunctionTypes"
		//   to false (to have bivariant type checking for parameters)
		// Examples on invalid error message we get if "strictFunctionTypes" is true:
		//      Type '(event: MouseEvent) => void' is not assignable to '(event: Event) => void'
		//      Type '(event: CustomEvent<string>) => void' is not assignable to '(event: Event) => void'
		strictFunctionTypes = false;
	}

	// Construct an event handler type to perform type checking against
	const expectedType: SimpleType = {
		kind: "OBJECT",
		call: {
			kind: "FUNCTION",
			returnType: { kind: "VOID" },
			parameters: [
				{
					name: "event",
					type: typeA,
					optional: false,
					rest: false,
					initializer: false
				}
			]
		}
	};

	// Extract the type of "handleEvent" from typeB if an object was given to the event binding
	switch (typeB.kind) {
		case "OBJECT":
		case "INTERFACE": {
			const handleEventMember = typeB.members != null ? typeB.members.find(m => m.name === "handleEvent") : undefined;
			if (handleEventMember != null) {
				typeB = handleEventMember.type;
			}
			break;
		}
	}

	let assignable: boolean;
	if (typeA.kind === "UNION") {
		// If events have been merged into one UNION type, check each event type separately
		const mutedContext = { ...context, report() {} };
		assignable = typeA.types.some(tA => isAssignableInEventBinding(htmlAttr, { typeA: tA, typeB }, mutedContext));
	} else {
		assignable = isAssignableToType({ typeA: expectedType, typeB }, context, { strictFunctionTypes });
	}

	if (!assignable) {
		context.report({
			location: rangeFromHtmlNodeAttr(htmlAttr),
			message: `Type '${typeToString(typeB)}' is not assignable to '${typeToString(expectedType)}'`
		});
	}

	return assignable;
}

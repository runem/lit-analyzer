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
	// Treat type "ANY" as "Event"
	if (typeA.kind === "ANY") {
		typeA = parseSimpleJsDocTypeExpression("Event", context);
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

	if (!isAssignableToType({ typeA: expectedType, typeB }, context)) {
		context.report({
			location: rangeFromHtmlNodeAttr(htmlAttr),
			message: `Type '${typeToString(typeB)}' is not assignable to '${typeToString(expectedType)}'`
		});

		return false;
	}

	return true;
}

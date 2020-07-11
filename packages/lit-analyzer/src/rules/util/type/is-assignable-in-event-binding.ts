import { SimpleType, typeToString } from "ts-simple-type";
import { HtmlNodeAttr } from "../../../analyze/types/html-node/html-node-attr-types";
import { RuleModuleContext } from "../../../analyze/types/rule/rule-module-context";
import { rangeFromHtmlNodeAttr } from "../../../analyze/util/range-util";
import { isAssignableToType } from "./is-assignable-to-type";

export function isAssignableInEventBinding(
	htmlAttr: HtmlNodeAttr,
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	context: RuleModuleContext
): boolean | undefined {
	const expectedType: SimpleType = {
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
	};

	if (!isAssignableToType({ typeA: expectedType, typeB }, context)) {
		context.report({
			location: rangeFromHtmlNodeAttr(htmlAttr),
			message: `Type '${typeToString(typeB)}' is not assignable to '${typeToString(expectedType)}'`
		});

		return false;
	}

	return true;
}

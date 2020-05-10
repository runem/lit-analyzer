import { SimpleType, SimpleTypeKind, toTypeString } from "ts-simple-type";
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
		kind: SimpleTypeKind.FUNCTION,
		returnType: { kind: SimpleTypeKind.VOID },
		argTypes: [
			{
				name: 'event',
				type: typeA,
				optional: false,
				spread: false,
				initializer: false
			}
		]
	};

	if (!isAssignableToType({ typeA: expectedType, typeB }, context)) {
		context.report({
			location: rangeFromHtmlNodeAttr(htmlAttr),
			message: `Type '${toTypeString(typeB)}' is not assignable to '${toTypeString(expectedType)}'`
		});

		return false;
	}

	return true;
}

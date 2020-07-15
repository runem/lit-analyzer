import { SimpleType, typeToString } from "ts-simple-type";
import { HtmlNodeAttr } from "../../../analyze/types/html-node/html-node-attr-types";
import { RuleModuleContext } from "../../../analyze/types/rule/rule-module-context";
import { rangeFromHtmlNodeAttr } from "../../../analyze/util/range-util";
import { isAssignableBindingUnderSecuritySystem } from "./is-assignable-binding-under-security-system";
import { isAssignableToType } from "./is-assignable-to-type";

export function isAssignableInPropertyBinding(
	htmlAttr: HtmlNodeAttr,
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	context: RuleModuleContext
): boolean | undefined {
	const securitySystemResult = isAssignableBindingUnderSecuritySystem(htmlAttr, { typeA, typeB }, context);
	if (securitySystemResult !== undefined) {
		// The security diagnostics take precedence here,
		//   and we should not do any more checking.
		return securitySystemResult;
	}

	if (!isAssignableToType({ typeA, typeB }, context)) {
		context.report({
			location: rangeFromHtmlNodeAttr(htmlAttr),
			message: `Type '${typeToString(typeB)}' is not assignable to '${typeToString(typeA)}'`
		});

		return false;
	}

	return true;
}

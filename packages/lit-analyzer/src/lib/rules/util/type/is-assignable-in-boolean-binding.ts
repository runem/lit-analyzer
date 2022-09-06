import { SimpleType, typeToString } from "ts-simple-type";
import { HtmlNodeAttr } from "../../../analyze/types/html-node/html-node-attr-types.js";
import { RuleModuleContext } from "../../../analyze/types/rule/rule-module-context.js";
import { rangeFromHtmlNodeAttr } from "../../../analyze/util/range-util.js";
import { isAssignableToType } from "./is-assignable-to-type.js";

export function isAssignableInBooleanBinding(
	htmlAttr: HtmlNodeAttr,
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	context: RuleModuleContext
): boolean | undefined {
	// Test if the user is trying to use ? modifier on a non-boolean type.
	if (!isAssignableToType({ typeA: { kind: "UNION", types: [{ kind: "BOOLEAN" }, { kind: "UNDEFINED" }, { kind: "NULL" }] }, typeB }, context)) {
		context.report({
			location: rangeFromHtmlNodeAttr(htmlAttr),
			message: `Type '${typeToString(typeB)}' is not assignable to 'boolean'`
		});

		return false;
	}

	// Test if the user is trying to use the ? modifier on a non-boolean type.
	if (!isAssignableToType({ typeA, typeB: { kind: "BOOLEAN" } }, context)) {
		context.report({
			location: rangeFromHtmlNodeAttr(htmlAttr),
			message: `You are using a boolean binding on a non boolean type '${typeToString(typeA)}'`,
			fix: () => {
				const htmlAttrTarget = context.htmlStore.getHtmlAttrTarget(htmlAttr);
				const newModifier = htmlAttrTarget == null ? "." : "";

				return {
					message: newModifier.length === 0 ? `Remove '${htmlAttr.modifier || ""}' modifier` : `Use '${newModifier}' modifier instead`,
					actions: [
						{
							kind: "changeAttributeModifier",
							htmlAttr,
							newModifier
						}
					]
				};
			}
		});

		return false;
	}

	return true;
}

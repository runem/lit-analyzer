import { isAssignableToType as _isAssignableToType, SimpleType, SimpleTypeComparisonOptions } from "ts-simple-type";
import { RuleModuleContext } from "../../../analyze/types/rule/rule-module-context";

export function isAssignableToType(
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	context: RuleModuleContext,
	options?: SimpleTypeComparisonOptions
): boolean {
	const inJsFile = context.file.fileName.endsWith(".js");
	const expandedOptions = {
		...(inJsFile ? { strict: false } : {}),
		options: context.ts,
		...(options || {})
	};
	return _isAssignableToType(typeA, typeB, context.program, expandedOptions);
}

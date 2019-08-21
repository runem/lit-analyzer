import { isAssignableToType as _isAssignableToType, SimpleType, SimpleTypeComparisonOptions } from "ts-simple-type";
import { LitAnalyzerRequest } from "../../lit-analyzer-context";

export function isAssignableToType(
	{ typeA, typeB }: { typeA: SimpleType; typeB: SimpleType },
	request: LitAnalyzerRequest,
	options?: SimpleTypeComparisonOptions
): boolean {
	const inJsFile = request.file.fileName.endsWith(".js");
	return _isAssignableToType(typeA, typeB, request.program, { ...(inJsFile ? { strict: false } : {}), ...(options || {}) });
}

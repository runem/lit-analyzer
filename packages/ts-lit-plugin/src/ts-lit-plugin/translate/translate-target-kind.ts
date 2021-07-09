import { LitTargetKind } from "lit-analyzer";
import { ScriptElementKind } from "typescript";
import { tsModule } from "../../ts-module.js";

export function translateTargetKind(kind: LitTargetKind): ScriptElementKind {
	switch (kind) {
		case "memberFunctionElement":
			return tsModule.ts.ScriptElementKind.memberFunctionElement;
		case "functionElement":
			return tsModule.ts.ScriptElementKind.functionElement;
		case "constructorImplementationElement":
			return tsModule.ts.ScriptElementKind.constructorImplementationElement;
		case "variableElement":
			return tsModule.ts.ScriptElementKind.variableElement;
		case "classElement":
			return tsModule.ts.ScriptElementKind.classElement;
		case "interfaceElement":
			return tsModule.ts.ScriptElementKind.interfaceElement;
		case "moduleElement":
			return tsModule.ts.ScriptElementKind.moduleElement;
		case "memberVariableElement":
		case "member":
			return tsModule.ts.ScriptElementKind.memberVariableElement;
		case "constElement":
			return tsModule.ts.ScriptElementKind.constElement;
		case "enumElement":
			return tsModule.ts.ScriptElementKind.enumElement;
		case "keyword":
			return tsModule.ts.ScriptElementKind.keyword;
		case "alias":
			return tsModule.ts.ScriptElementKind.alias;
		case "label":
			return tsModule.ts.ScriptElementKind.label;
		default:
			return tsModule.ts.ScriptElementKind.unknown;
	}
}

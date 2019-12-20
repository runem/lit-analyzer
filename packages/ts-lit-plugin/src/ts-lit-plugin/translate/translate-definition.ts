import { LitDefinition } from "lit-analyzer";
import { DefinitionInfoAndBoundSpan } from "typescript";
import { tsModule } from "../../ts-module";
import { translateRange } from "./translate-range";

export function translateDefinition(definition: LitDefinition): DefinitionInfoAndBoundSpan {
	const targetNode = "declarationNodes" in definition.target ? definition.target.declarationNodes.values().next().value : definition.target.node;

	const targetStart = targetNode.getStart();
	const targetEnd = targetNode.getEnd();
	const targetFileName = targetNode.getSourceFile().fileName;
	const target = definition.target;

	return {
		definitions: [
			{
				name: ("name" in target && target.name) || ("propName" in target && target.propName) || ("attrName" in target && target.attrName) || "",
				textSpan: {
					start: targetStart,
					length: targetEnd - targetStart
				},
				fileName: targetFileName,
				containerName: targetFileName,
				kind: tsModule.ts.ScriptElementKind.memberVariableElement,
				containerKind: tsModule.ts.ScriptElementKind.functionElement
			}
		],
		textSpan: translateRange(definition.fromRange)
	};
}

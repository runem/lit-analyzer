import { LitDefinition, LitDefinitionTarget } from "lit-analyzer";
import { DefinitionInfo, DefinitionInfoAndBoundSpan } from "typescript";
import { tsModule } from "../../ts-module.js";
import { translateRange } from "./translate-range.js";

export function translateDefinition(definition: LitDefinition): DefinitionInfoAndBoundSpan {
	return {
		definitions: definition.targets.map(translateDefinitionInfo),
		textSpan: translateRange(definition.fromRange)
	};
}

function translateDefinitionInfo(target: LitDefinitionTarget): DefinitionInfo {
	let targetStart: number;
	let targetEnd: number;
	let targetFileName: string;
	let targetName: string;

	switch (target.kind) {
		case "range":
			targetStart = target.range.start;
			targetEnd = target.range.end;
			targetFileName = target.sourceFile.fileName;
			targetName = target.name || "";
			break;

		case "node": {
			const node = target.node;
			targetStart = node.getStart();
			targetEnd = node.getEnd();
			targetFileName = node.getSourceFile().fileName;
			targetName = target.name || (tsModule.ts.isIdentifier(node) ? node.getText() : "");
			break;
		}
	}

	return {
		name: targetName,
		textSpan: {
			start: targetStart,
			length: targetEnd - targetStart
		},
		fileName: targetFileName,
		containerName: targetFileName,
		kind: tsModule.ts.ScriptElementKind.memberVariableElement,
		containerKind: tsModule.ts.ScriptElementKind.functionElement
	};
}

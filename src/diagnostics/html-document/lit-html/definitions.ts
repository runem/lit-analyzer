import { DefinitionInfoAndBoundSpan } from "typescript";
import { tsModule } from "../../../ts-module";
import { HtmlNodeAttr } from "../../../types/html-node-attr-types";
import { HtmlNode } from "../../../types/html-node-types";
import { DiagnosticsContext } from "../../diagnostics-context";

export function definitionAndBoundSpanForHtmlNode(htmlNode: HtmlNode, { sourceFile, store }: DiagnosticsContext): DefinitionInfoAndBoundSpan | undefined {
	const { start: sourceStart, end: sourceEnd } = htmlNode.location.name;

	const decl = store.getComponentDeclaration(htmlNode);
	if (decl == null) return undefined;

	const { start: targetStart, end: targetEnd } = decl.location;

	return {
		definitions: [
			{
				name: decl.meta.className || "",
				textSpan: {
					start: targetStart,
					length: targetEnd - targetStart
				},
				fileName: decl.fileName,
				containerName: decl.fileName,
				kind: tsModule.ts.ScriptElementKind.classElement,
				containerKind: tsModule.ts.ScriptElementKind.functionElement
			}
		],
		textSpan: {
			start: sourceStart,
			length: sourceEnd - sourceStart
		}
	};
}

export function definitionAndBoundSpanForHtmlAttr(htmlAttr: HtmlNodeAttr, { sourceFile, store }: DiagnosticsContext): DefinitionInfoAndBoundSpan | undefined {
	const { start: sourceStart, end: sourceEnd } = htmlAttr.location.name;

	const decl = store.getComponentDeclaration(htmlAttr.htmlNode);
	const prop = store.getComponentDeclarationProp(htmlAttr);
	if (decl == null || prop == null) return undefined;

	const { start: targetStart, end: targetEnd } = prop.location;
	return {
		definitions: [
			{
				name: decl.meta.className || "",
				textSpan: {
					start: targetStart,
					length: targetEnd - targetStart
				},
				fileName: decl.fileName,
				containerName: decl.fileName,
				kind: tsModule.ts.ScriptElementKind.memberVariableElement,
				containerKind: tsModule.ts.ScriptElementKind.functionElement
			}
		],
		textSpan: {
			start: sourceStart,
			length: sourceEnd - sourceStart
		}
	};
}

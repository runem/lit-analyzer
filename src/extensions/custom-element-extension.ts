import { DefinitionInfoAndBoundSpan, ScriptElementKind } from "typescript";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../types/html-node-attr-types";
import { HtmlNode, HtmlNodeKind } from "../types/html-node-types";
import { ITsHtmlExtension, ITsHtmlExtensionDefinitionAndBoundSpanContext } from "./i-ts-html-extension";

/**
 * An extension that adds custom element capabilities to the ts-html plugin.
 */
export class CustomElementExtension implements ITsHtmlExtension {
	/**
	 * Returns goto definition for a custom element html node.
	 * @param htmlNode
	 * @param context
	 */
	definitionAndBoundSpanForHtmlNode(htmlNode: HtmlNode, context: ITsHtmlExtensionDefinitionAndBoundSpanContext): DefinitionInfoAndBoundSpan | undefined {
		const { start: sourceStart, end: sourceEnd } = htmlNode.location.name;

		switch (htmlNode.kind) {
			case HtmlNodeKind.COMPONENT:
				const { start: targetStart, end: targetEnd } = htmlNode.component.location;

				return {
					definitions: [
						{
							name: htmlNode.component.meta.className || "",
							textSpan: {
								start: targetStart,
								length: targetEnd - targetStart
							},
							fileName: htmlNode.component.fileName,
							containerName: htmlNode.component.fileName,
							kind: ScriptElementKind.classElement,
							containerKind: ScriptElementKind.functionElement
						}
					],
					textSpan: {
						start: sourceStart,
						length: sourceEnd - sourceStart
					}
				};
		}
	}

	/**
	 * Returns goto definitions for a custom element attribute.
	 * @param htmlAttr
	 * @param context
	 */
	definitionAndBoundSpanForHtmlAttr(htmlAttr: HtmlNodeAttr, context: ITsHtmlExtensionDefinitionAndBoundSpanContext): DefinitionInfoAndBoundSpan | undefined {
		const { start: sourceStart, end: sourceEnd } = htmlAttr.location.name;

		switch (htmlAttr.kind) {
			case HtmlNodeAttrKind.CUSTOM_PROP:
				const { start: targetStart, end: targetEnd } = htmlAttr.prop.location;
				return {
					definitions: [
						{
							name: htmlAttr.component.meta.className || "",
							textSpan: {
								start: targetStart,
								length: targetEnd - targetStart
							},
							fileName: htmlAttr.component.fileName,
							containerName: htmlAttr.component.fileName,
							kind: ScriptElementKind.memberVariableElement,
							containerKind: ScriptElementKind.functionElement
						}
					],
					textSpan: {
						start: sourceStart,
						length: sourceEnd - sourceStart
					}
				};
		}
	}
}

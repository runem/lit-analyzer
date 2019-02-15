import { DefinitionInfoAndBoundSpan, SourceFile } from "typescript";
import { TsLitPluginStore } from "../state/store";
import { HtmlNodeAttr } from "../types/html-node-attr-types";
import { HtmlNode } from "../types/html-node-types";

export interface ITsHtmlExtensionBaseContext {
	store: TsLitPluginStore;
}

export interface ITsHtmlExtensionDefinitionAndBoundSpanContext extends ITsHtmlExtensionBaseContext {
	file: SourceFile;
	position: number;
}

/**
 * An interface that extensions must implement.
 */
export interface ITsHtmlExtension {
	definitionAndBoundSpanForHtmlNode?(htmlNode: HtmlNode, context: ITsHtmlExtensionDefinitionAndBoundSpanContext): DefinitionInfoAndBoundSpan | undefined;
	definitionAndBoundSpanForHtmlAttr?(htmlAttr: HtmlNodeAttr, context: ITsHtmlExtensionDefinitionAndBoundSpanContext): DefinitionInfoAndBoundSpan | undefined;
}

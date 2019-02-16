import { Type } from "typescript";
import { TsLitPluginStore } from "../../../../../state/store";

export interface ParseHtmlContext {
	html: string;
	store: TsLitPluginStore;
	getSourceCodeLocation(htmlOffset: number): number;
	getTypeFromExpressionId(id: string): Type | undefined;
}

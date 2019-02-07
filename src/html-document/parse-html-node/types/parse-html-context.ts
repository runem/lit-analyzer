import { Type } from "typescript";
import { TsHtmlPluginStore } from "../../../state/store";

export interface ParseHtmlContext {
	html: string;
	store: TsHtmlPluginStore;
	getSourceCodeLocation(htmlOffset: number): number;
	getTypeFromExpressionId(id: string): Type | undefined;
}

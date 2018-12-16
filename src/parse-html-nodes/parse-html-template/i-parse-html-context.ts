import { Node, Type } from "typescript";
import { TsHtmlPluginStore } from "../../state/store";

export interface IParseHtmlContext {
	astNode: Node;
	html: string;
	store: TsHtmlPluginStore;
	getSourceCodeLocation(htmlOffset: number): number;
	getTypeFromExpressionId(id: string): Type | undefined;
}

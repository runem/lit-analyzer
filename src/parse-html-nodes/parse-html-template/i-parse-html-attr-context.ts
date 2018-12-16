import { IHtmlNodeBase } from "../types/html-node-types";
import { IParseHtmlContext } from "./i-parse-html-context";

export interface IParseHtmlAttrContext extends IParseHtmlContext {
	htmlNode: IHtmlNodeBase;
}

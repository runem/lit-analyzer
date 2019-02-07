import { IHtmlNodeBase } from "../../types/html-node-types";
import { ParseHtmlContext } from "./parse-html-context";

export interface ParseHtmlAttrContext extends ParseHtmlContext {
	htmlNode: IHtmlNodeBase;
}

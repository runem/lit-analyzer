import { HtmlNode } from "../../../../../types/html-node/html-node-types.js";
import { ParseHtmlContext } from "./parse-html-context.js";

export interface ParseHtmlAttrContext extends ParseHtmlContext {
	htmlNode: HtmlNode;
}

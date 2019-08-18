import { LitAnalyzerRequest } from "../lit-analyzer-context";
import { HtmlNode } from "./html-node/html-node-types";
import { HtmlNodeAttr } from "./html-node/html-node-attr-types";

export interface RuleVisitor {
	enterHtmlNode(node: HtmlNode): void;
	enterHtmlAttribute(node: HtmlNodeAttr): void;
}

export type RuleModule = (context: LitAnalyzerRequest) => Partial<RuleVisitor>;

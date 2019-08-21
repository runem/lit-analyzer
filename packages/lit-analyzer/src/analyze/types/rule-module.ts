import { LitAnalyzerRuleName } from "../lit-analyzer-config";
import { LitAnalyzerRequest } from "../lit-analyzer-context";
import { HtmlNodeAttrAssignment } from "./html-node/html-node-attr-assignment-types";
import { HtmlNodeAttr } from "./html-node/html-node-attr-types";
import { HtmlNode } from "./html-node/html-node-types";
import { LitHtmlDiagnostic } from "./lit-diagnostic";

export interface RuleModule {
	name: LitAnalyzerRuleName;
	visitHtmlNode?(node: HtmlNode, context: LitAnalyzerRequest): LitHtmlDiagnostic[] | void;
	visitHtmlAttribute?(attribute: HtmlNodeAttr, context: LitAnalyzerRequest): LitHtmlDiagnostic[] | void;
	visitHtmlAssignment?(assignment: HtmlNodeAttrAssignment, context: LitAnalyzerRequest): LitHtmlDiagnostic[] | void;
}

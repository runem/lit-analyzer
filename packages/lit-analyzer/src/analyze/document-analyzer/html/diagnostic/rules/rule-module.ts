import { SimpleType } from "ts-simple-type";
import { LitAnalyzerRuleName } from "../../../../lit-analyzer-config";
import { LitAnalyzerRequest } from "../../../../lit-analyzer-context";
import { HtmlNodeAttrAssignment } from "../../../../types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttr } from "../../../../types/html-node/html-node-attr-types";
import { HtmlNode } from "../../../../types/html-node/html-node-types";
import { LitHtmlDiagnostic } from "../../../../types/lit-diagnostic";

export interface RuleModule {
	name: LitAnalyzerRuleName;
	visitHtmlNode?(node: HtmlNode, context: LitAnalyzerRequest): LitHtmlDiagnostic[] | void;
	visitHtmlAttribute?(attribute: HtmlNodeAttr, context: LitAnalyzerRequest): LitHtmlDiagnostic[] | void;
	visitHtmlAssignment?(
		assignment: HtmlNodeAttrAssignment,
		types: { typeA: SimpleType; typeB: SimpleType },
		context: LitAnalyzerRequest
	): LitHtmlDiagnostic[] | void;
}

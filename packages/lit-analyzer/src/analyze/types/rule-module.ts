import { ComponentDeclaration, ComponentDefinition, ComponentMember } from "web-component-analyzer";
import { LitAnalyzerRuleName } from "../lit-analyzer-config";
import { LitAnalyzerRequest } from "../lit-analyzer-context";
import { HtmlNodeAttrAssignment } from "./html-node/html-node-attr-assignment-types";
import { HtmlNodeAttr } from "./html-node/html-node-attr-types";
import { HtmlNode } from "./html-node/html-node-types";
import { LitHtmlDiagnostic } from "./lit-diagnostic";

export interface RuleModule {
	name: LitAnalyzerRuleName;

	// Document based rules
	visitHtmlNode?(node: HtmlNode, context: LitAnalyzerRequest): LitHtmlDiagnostic[] | void;
	visitHtmlAttribute?(attribute: HtmlNodeAttr, context: LitAnalyzerRequest): LitHtmlDiagnostic[] | void;
	visitHtmlAssignment?(assignment: HtmlNodeAttrAssignment, context: LitAnalyzerRequest): LitHtmlDiagnostic[] | void;

	// Component based rules
	visitComponentDefinition?(definition: ComponentDefinition, context: LitAnalyzerRequest): LitHtmlDiagnostic[] | void;
	visitComponentDeclaration?(declaration: ComponentDeclaration, context: LitAnalyzerRequest): LitHtmlDiagnostic[] | void;
	visitComponentMember?(declaration: ComponentMember, context: LitAnalyzerRequest): LitHtmlDiagnostic[] | void;
}

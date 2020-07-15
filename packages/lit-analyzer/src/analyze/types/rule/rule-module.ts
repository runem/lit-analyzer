import { ComponentDeclaration, ComponentDefinition, ComponentMember } from "web-component-analyzer";
import { LitAnalyzerRuleId } from "../../lit-analyzer-config";
import { HtmlNodeAttrAssignment } from "../html-node/html-node-attr-assignment-types";
import { HtmlNodeAttr } from "../html-node/html-node-attr-types";
import { HtmlNode } from "../html-node/html-node-types";
import { RuleModuleContext } from "./rule-module-context";
import { ImportDeclaration } from "typescript";
import { HtmlDocument } from "../../parse/document/text-document/html-document/html-document";

export type RuleModulePriority = "low" | "medium" | "high";

//export type RuleModuleCategory = "HTML" | "CSS" | "Component";

export interface RuleModuleImplementation {
	// Document based rules
	visitHtmlNode?(node: HtmlNode, context: RuleModuleContext): void;
	visitHtmlAttribute?(attribute: HtmlNodeAttr, context: RuleModuleContext): void;
	visitHtmlAssignment?(assignment: HtmlNodeAttrAssignment, context: RuleModuleContext): void;

	// Component based rules
	visitComponentDefinition?(definition: ComponentDefinition, context: RuleModuleContext): void;
	visitComponentDeclaration?(declaration: ComponentDeclaration, context: RuleModuleContext): void;
	visitComponentMember?(declaration: ComponentMember, context: RuleModuleContext): void;
	visitImportStatement?(
		importAndDocuments: { importDeclaration: ImportDeclaration; htmlDocuments: HtmlDocument[] },
		context: RuleModuleContext
	): void;
}

export interface RuleModule extends RuleModuleImplementation {
	id: LitAnalyzerRuleId;

	meta?: {
		priority?: RuleModulePriority;
		/*docs?: {
			description: string;
			category: RuleModuleCategory;
		};*/
	};
}

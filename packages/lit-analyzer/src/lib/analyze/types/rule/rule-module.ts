import { ComponentDeclaration, ComponentDefinition, ComponentMember } from "web-component-analyzer";
import { LitAnalyzerRuleId } from "../../lit-analyzer-config.js";
import { HtmlNodeAttrAssignment } from "../html-node/html-node-attr-assignment-types.js";
import { HtmlNodeAttr } from "../html-node/html-node-attr-types.js";
import { HtmlNode } from "../html-node/html-node-types.js";
import { RuleModuleContext } from "./rule-module-context.js";

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

import { ComponentDeclaration, ComponentDefinition } from "web-component-analyzer";
import { isRuleEnabled, LitAnalyzerRuleId } from "./lit-analyzer-config";
import { LitAnalyzerContext } from "./lit-analyzer-context";
import { HtmlDocument } from "./parse/document/text-document/html-document/html-document";
import { HtmlNodeAttr } from "./types/html-node/html-node-attr-types";
import { HtmlNode, HtmlNodeKind } from "./types/html-node/html-node-types";
import { RuleDiagnostic } from "./types/rule/rule-diagnostic";
import { RuleModule, RuleModuleImplementation } from "./types/rule/rule-module";
import { RuleModuleContext } from "./types/rule/rule-module-context";
import { SourceFile } from "typescript";

export interface ReportedRuleDiagnostic {
	source: LitAnalyzerRuleId;
	diagnostic: RuleDiagnostic;
}

export class RuleCollection {
	private rules: RuleModule[] = [];

	push(...rule: RuleModule[]): void {
		this.rules.push(...rule);

		// Sort rules by most important first
		this.rules.sort((ruleA, ruleB) => (getPriorityValue(ruleA) > getPriorityValue(ruleB) ? -1 : 1));
	}

	private invokeRules<VisitFunctionName extends keyof RuleModuleImplementation>(
		functionName: VisitFunctionName,
		parameter: Parameters<NonNullable<RuleModuleImplementation[VisitFunctionName]>>[0],
		report: (diagnostic: ReportedRuleDiagnostic) => void,
		baseContext: LitAnalyzerContext
	): void {
		let shouldBreak = false;

		const { config, htmlStore, program, definitionStore, dependencyStore, documentStore, logger, ts } = baseContext;

		let currentRuleId: LitAnalyzerRuleId | undefined = undefined;

		const context: RuleModuleContext = {
			config,
			htmlStore,
			program,
			definitionStore,
			dependencyStore,
			documentStore,
			logger,
			ts,
			file: baseContext.currentFile,
			report(diagnostic: RuleDiagnostic): void {
				if (currentRuleId != null) {
					report({ diagnostic, source: currentRuleId });
				}
				shouldBreak = true;
			},
			break(): void {
				shouldBreak = true;
			}
		};

		for (const rule of this.rules) {
			if (isRuleEnabled(context.config, rule.id)) {
				const func = rule[functionName];
				if (func != null) {
					currentRuleId = rule.id;

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					func(parameter as any, context);
				}
			}

			if (shouldBreak) {
				break;
			}
		}
	}

	getDiagnosticsFromDeclaration(declaration: ComponentDeclaration, baseContext: LitAnalyzerContext): ReportedRuleDiagnostic[] {
		const file = baseContext.currentFile;

		const diagnostics: ReportedRuleDiagnostic[] = [];

		this.invokeRules("visitComponentDeclaration", declaration, d => diagnostics.push(d), baseContext);

		for (const member of declaration.members) {
			if (member.node.getSourceFile() === file) {
				this.invokeRules("visitComponentMember", member, d => diagnostics.push(d), baseContext);
			}
		}

		return diagnostics;
	}

	getDiagnosticsFromDefinition(definition: ComponentDefinition, baseContext: LitAnalyzerContext): ReportedRuleDiagnostic[] {
		const file = baseContext.currentFile;

		const diagnostics: ReportedRuleDiagnostic[] = [];

		if (definition.sourceFile === file) {
			this.invokeRules("visitComponentDefinition", definition, d => diagnostics.push(d), baseContext);
		}

		return diagnostics;
	}

	getDiagnosticsFromDocument(htmlDocument: HtmlDocument, baseContext: LitAnalyzerContext): ReportedRuleDiagnostic[] {
		const diagnostics: ReportedRuleDiagnostic[] = [];

		const iterateNodes = (nodes: HtmlNode[]) => {
			for (const childNode of nodes) {
				// Don't check SVG yet. We don't yet have all the data for it, and it hasn't been tested fully.
				if (childNode.kind === HtmlNodeKind.SVG) {
					continue;
				}

				this.invokeRules("visitHtmlNode", childNode, d => diagnostics.push(d), baseContext);

				const iterateAttrs = (attrs: HtmlNodeAttr[]) => {
					for (const attr of attrs) {
						this.invokeRules("visitHtmlAttribute", attr, d => diagnostics.push(d), baseContext);

						if (attr.assignment != null) {
							this.invokeRules("visitHtmlAssignment", attr.assignment, d => diagnostics.push(d), baseContext);
						}
					}
				};

				iterateAttrs(childNode.attributes);

				iterateNodes(childNode.children);
			}
		};

		iterateNodes(htmlDocument.rootNodes);

		return diagnostics;
	}

	getDiagnosticsFromSourceFile(sourceFile: SourceFile, baseContext: LitAnalyzerContext): ReportedRuleDiagnostic[] {
		const diagnostics: ReportedRuleDiagnostic[] = [];
		this.invokeRules("visitSourceFile", sourceFile, d => diagnostics.push(d), baseContext);
		return diagnostics;
	}
}

function getPriorityValue(rule: RuleModule): number {
	if (rule.meta?.priority != null) {
		switch (rule.meta?.priority) {
			case "low":
				return 0;
			case "medium":
				return 1;
			case "high":
				return 2;
		}
	}

	return 0;
}

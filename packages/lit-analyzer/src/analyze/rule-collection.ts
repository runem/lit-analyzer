import { ComponentDefinition } from "web-component-analyzer";
import { isRuleEnabled, LitAnalyzerRuleId } from "./lit-analyzer-config";
import { LitAnalyzerContext } from "./lit-analyzer-context";
import { HtmlDocument } from "./parse/document/text-document/html-document/html-document";
import { HtmlNodeAttr } from "./types/html-node/html-node-attr-types";
import { HtmlNode } from "./types/html-node/html-node-types";
import { RuleDiagnostic } from "./types/rule/rule-diagnostic";
import { RuleModule, RuleModuleImplementation } from "./types/rule/rule-module";
import { RuleModuleContext } from "./types/rule/rule-module-context";
import { iterableFirst } from "./util/iterable-util";

export interface ReportedRuleDiagnostic {
	source: LitAnalyzerRuleId;
	diagnostic: RuleDiagnostic;
}

export class RuleCollection {
	private rules: RuleModule[] = [];

	push(...rule: RuleModule[]) {
		this.rules.push(...rule);

		// Sort rules by most important first
		this.rules.sort((ruleA, ruleB) => (getPriorityValue(ruleA) > getPriorityValue(ruleB) ? -1 : 1));
	}

	private invokeRule<VisitFunctionName extends keyof RuleModuleImplementation>(
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

	getDiagnosticsFromDefinition(definition: ComponentDefinition, baseContext: LitAnalyzerContext): ReportedRuleDiagnostic[] {
		const file = baseContext.currentFile;

		const diagnostics: ReportedRuleDiagnostic[] = [];

		if (iterableFirst(definition.tagNameNodes)?.getSourceFile() === file) {
			this.invokeRule("visitComponentDefinition", definition, d => diagnostics.push(d), baseContext);
		}

		const declaration = definition.declaration();
		this.invokeRule("visitComponentDeclaration", declaration, d => diagnostics.push(d), baseContext);

		for (const member of declaration.members) {
			if (member.node.getSourceFile() === file) {
				this.invokeRule("visitComponentMember", member, d => diagnostics.push(d), baseContext);
			}
		}

		return diagnostics;
	}

	getDiagnosticsFromDocument(htmlDocument: HtmlDocument, baseContext: LitAnalyzerContext): ReportedRuleDiagnostic[] {
		const diagnostics: ReportedRuleDiagnostic[] = [];

		const iterateNodes = (nodes: HtmlNode[]) => {
			for (const childNode of nodes) {
				this.invokeRule("visitHtmlNode", childNode, d => diagnostics.push(d), baseContext);

				const iterateAttrs = (attrs: HtmlNodeAttr[]) => {
					for (const attr of attrs) {
						this.invokeRule("visitHtmlAttribute", attr, d => diagnostics.push(d), baseContext);

						if (attr.assignment != null) {
							this.invokeRule("visitHtmlAssignment", attr.assignment, d => diagnostics.push(d), baseContext);
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

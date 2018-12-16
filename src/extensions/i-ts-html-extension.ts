import { CodeFixAction, CompletionEntry, DefinitionInfoAndBoundSpan, DiagnosticWithLocation, Node, QuickInfo, SourceFile, TypeChecker } from "typescript";
import { IP5NodeAttr, IP5TagNode } from "../parse-html-nodes/parse-html-p5/parse-html-types";
import { HtmlAttrAssignmentType, IHtmlAttrAssignment } from "../parse-html-nodes/types/html-attr-assignment-types";
import { IHtmlAttrBase } from "../parse-html-nodes/types/html-attr-types";
import { IHtmlNodeBase } from "../parse-html-nodes/types/html-node-types";
import { IHtmlReportBase } from "../parse-html-nodes/types/html-report-types";
import { TsHtmlPluginStore } from "../state/store";
import { Omit } from "../util/util";

export interface ITsHtmlExtensionBaseContext {
	store: TsHtmlPluginStore;
}

export interface ITsHtmlExtensionParseHtmlNodeContext extends ITsHtmlExtensionBaseContext {
	htmlNodeBase: IHtmlNodeBase;
}

export interface ITsHtmlExtensionParseAttrContext extends ITsHtmlExtensionBaseContext {
	htmlAttrBase: IHtmlAttrBase;
	p5Node: IP5TagNode;
}

export interface ITsHtmlExtensionParseAttrAssignmentContext extends ITsHtmlExtensionBaseContext {
	assignmentBase: Omit<IHtmlAttrAssignment, "typeA">;
	p5Node: IP5TagNode;
	p5Attr: IP5NodeAttr;
}

export interface ITsHtmlExtensionValidateContext extends ITsHtmlExtensionBaseContext {
	astNode: Node;
}

export interface ITsHtmlExtensionDiagnosticContext extends ITsHtmlExtensionBaseContext {
	astNode: Node;
	file: SourceFile;
}

export interface ITsHtmlExtensionCodeFixContext extends ITsHtmlExtensionBaseContext {
	astNode: Node;
	file: SourceFile;
}

export interface ITsHtmlExtensionQuickInfoContext extends ITsHtmlExtensionBaseContext {
	astNode: Node;
	file: SourceFile;
	position: number;
	checker: TypeChecker;
}

export interface ITsHtmlExtensionDefinitionAndBoundSpanContext extends ITsHtmlExtensionBaseContext {
	astNode: Node;
	file: SourceFile;
	position: number;
}

export interface ITsHtmlExtensionValidateExpressionContext extends ITsHtmlExtensionBaseContext {
	astNode: Node;
	checker: TypeChecker;
	getTypeString: (type: HtmlAttrAssignmentType) => string;
	isAssignableToPrimitive: (type: HtmlAttrAssignmentType) => boolean;
	isAssignableTo: (typeA: HtmlAttrAssignmentType, typeB: HtmlAttrAssignmentType) => boolean;
	isAssignableToValue: (type: HtmlAttrAssignmentType, value: string) => boolean;
}

export interface ITsHtmlExtensionCompletionContext extends ITsHtmlExtensionBaseContext {
	position: number;
	word: string;
	leftWord: string;
	rightWord: string;
	beforeWord: string;
	afterWord: string;
}

/**
 * An interface that extensions must implement.
 */
export interface ITsHtmlExtension {
	completionsForHtmlAttrs?(htmlNode: IHtmlNodeBase, context: ITsHtmlExtensionCompletionContext): CompletionEntry[] | undefined;
	completionsForHtmlNodes?(context: ITsHtmlExtensionCompletionContext): CompletionEntry[] | undefined;
	definitionAndBoundSpanForHtmlNode?(htmlNode: IHtmlNodeBase, context: ITsHtmlExtensionDefinitionAndBoundSpanContext): DefinitionInfoAndBoundSpan | undefined;
	definitionAndBoundSpanForHtmlAttr?(htmlAttr: IHtmlAttrBase, context: ITsHtmlExtensionDefinitionAndBoundSpanContext): DefinitionInfoAndBoundSpan | undefined;
	quickInfoForHtmlNode?(htmlNode: IHtmlNodeBase, context: ITsHtmlExtensionQuickInfoContext): QuickInfo | undefined;
	quickInfoForHtmlAttr?(htmlAttr: IHtmlAttrBase, context: ITsHtmlExtensionQuickInfoContext): QuickInfo | undefined;
	codeFixesForHtmlNode?(htmlNode: IHtmlNodeBase, htmlReport: IHtmlReportBase, context: ITsHtmlExtensionCodeFixContext): CodeFixAction[] | undefined;
	codeFixesForHtmlAttr?(htmlAttr: IHtmlAttrBase, htmlReport: IHtmlReportBase, context: ITsHtmlExtensionCodeFixContext): CodeFixAction[] | undefined;
	diagnosticsForHtmlNode?(htmlNode: IHtmlNodeBase, htmlReport: IHtmlReportBase, context: ITsHtmlExtensionDiagnosticContext): DiagnosticWithLocation[] | undefined;
	diagnosticsForHtmlAttr?(htmlAttr: IHtmlAttrBase, htmlReport: IHtmlReportBase, context: ITsHtmlExtensionDiagnosticContext): DiagnosticWithLocation[] | undefined;
	parseAttrName?(attrName: string): { name: string; modifier?: string } | undefined;
	parseHtmlNode?(p5Node: IP5TagNode, context: ITsHtmlExtensionParseHtmlNodeContext): IHtmlNodeBase | undefined;
	parseHtmlAttr?(p5Attr: IP5NodeAttr, htmlNode: IHtmlNodeBase, context: ITsHtmlExtensionParseAttrContext): IHtmlAttrBase | undefined;
	parseHtmlAttrAssignment?(htmlAttr: IHtmlAttrBase, context: ITsHtmlExtensionParseAttrAssignmentContext): IHtmlAttrAssignment | undefined;
	validateHtmlNode?(htmlNode: IHtmlNodeBase, context: ITsHtmlExtensionValidateContext): IHtmlReportBase[] | undefined;
	validateHtmlAttr?(htmlAttr: IHtmlAttrBase, context: ITsHtmlExtensionValidateContext): IHtmlReportBase[] | undefined;
	validateHtmlAttrAssignment?(htmlAttr: IHtmlAttrBase, context: ITsHtmlExtensionValidateExpressionContext): IHtmlReportBase[] | undefined;
}

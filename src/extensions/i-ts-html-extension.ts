import { SimpleTypeKind } from "ts-simple-type";
import { CodeFixAction, CompletionEntry, DefinitionInfoAndBoundSpan, DiagnosticWithLocation, QuickInfo, SourceFile, TypeChecker } from "typescript";
import { IP5NodeAttr, IP5TagNode } from "../html-document/parse-html-p5/parse-html-types";
import { HtmlAttrAssignmentType, IHtmlAttrAssignment } from "../html-document/types/html-attr-assignment-types";
import { IHtmlAttrBase } from "../html-document/types/html-attr-types";
import { IHtmlNodeBase } from "../html-document/types/html-node-types";
import { IHtmlReportBase } from "../html-document/types/html-report-types";
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

export interface ITsHtmlExtensionDiagnosticContext extends ITsHtmlExtensionBaseContext {
	file: SourceFile;
}

export interface ITsHtmlExtensionCodeFixContext extends ITsHtmlExtensionBaseContext {
	file: SourceFile;
}

export interface ITsHtmlExtensionValidateContext extends ITsHtmlExtensionBaseContext {
	file: SourceFile;
}

export interface ITsHtmlExtensionQuickInfoContext extends ITsHtmlExtensionBaseContext {
	file: SourceFile;
	position: number;
	checker: TypeChecker;
}

export interface ITsHtmlExtensionDefinitionAndBoundSpanContext extends ITsHtmlExtensionBaseContext {
	file: SourceFile;
	position: number;
}

export interface ITsHtmlExtensionValidateExpressionContext extends ITsHtmlExtensionBaseContext {
	file: SourceFile;
	checker: TypeChecker;
	getTypeString: (type: HtmlAttrAssignmentType) => string;
	isAssignableToPrimitive: (type: HtmlAttrAssignmentType) => boolean;
	isAssignableTo: (typeA: HtmlAttrAssignmentType, typeB: HtmlAttrAssignmentType) => boolean;
	isAssignableToValue: (type: HtmlAttrAssignmentType, value: string) => boolean;
	isAssignableToSimpleTypeKind: (type: HtmlAttrAssignmentType, kind: SimpleTypeKind) => boolean;
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

	codeFixesForHtmlNodeReport?(htmlNode: IHtmlNodeBase, htmlReport: IHtmlReportBase, context: ITsHtmlExtensionCodeFixContext): CodeFixAction[] | undefined;
	codeFixesForHtmlAttrReport?(htmlAttr: IHtmlAttrBase, htmlReport: IHtmlReportBase, context: ITsHtmlExtensionCodeFixContext): CodeFixAction[] | undefined;

	diagnosticsForHtmlNodeReport?(htmlNode: IHtmlNodeBase, htmlReport: IHtmlReportBase, context: ITsHtmlExtensionDiagnosticContext): DiagnosticWithLocation[] | undefined;
	diagnosticsForHtmlAttrReport?(htmlAttr: IHtmlAttrBase, htmlReport: IHtmlReportBase, context: ITsHtmlExtensionDiagnosticContext): DiagnosticWithLocation[] | undefined;

	validateHtmlNode?(htmlNode: IHtmlNodeBase, context: ITsHtmlExtensionValidateContext): IHtmlReportBase[] | undefined;
	validateHtmlAttr?(htmlAttr: IHtmlAttrBase, context: ITsHtmlExtensionValidateContext): IHtmlReportBase[] | undefined;
	validateHtmlAttrAssignment?(htmlAttr: IHtmlAttrBase, context: ITsHtmlExtensionValidateExpressionContext): IHtmlReportBase[] | undefined;

	parseAttrName?(attrName: string): { name: string; modifier?: string } | undefined;
	parseHtmlNode?(p5Node: IP5TagNode, context: ITsHtmlExtensionParseHtmlNodeContext): IHtmlNodeBase | undefined;
	parseHtmlAttr?(p5Attr: IP5NodeAttr, htmlNode: IHtmlNodeBase, context: ITsHtmlExtensionParseAttrContext): IHtmlAttrBase | undefined;
	parseHtmlAttrAssignment?(htmlAttr: IHtmlAttrBase, context: ITsHtmlExtensionParseAttrAssignmentContext): IHtmlAttrAssignment | undefined;
}

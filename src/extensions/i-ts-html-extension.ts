import { SimpleTypeKind } from "ts-simple-type";
import { CodeFixAction, CompletionEntry, DefinitionInfoAndBoundSpan, DiagnosticWithLocation, QuickInfo, SourceFile, TypeChecker } from "typescript";
import { IP5NodeAttr, IP5TagNode } from "../html-document/parse-html-p5/parse-html-types";
import { HtmlAttrAssignmentType, IHtmlAttrAssignment } from "../html-document/types/html-attr-assignment-types";
import { HtmlAttr, IHtmlAttrBase } from "../html-document/types/html-attr-types";
import { HtmlNode, IHtmlNodeBase } from "../html-document/types/html-node-types";
import { HtmlReport } from "../html-document/types/html-report-types";
import { TsLitPluginStore } from "../state/store";
import { Omit } from "../util/util";

export interface ITsHtmlExtensionBaseContext {
	store: TsLitPluginStore;
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
	completionsForHtmlAttrs?(htmlNode: HtmlNode, context: ITsHtmlExtensionCompletionContext): CompletionEntry[] | undefined;
	completionsForHtmlNodes?(context: ITsHtmlExtensionCompletionContext): CompletionEntry[] | undefined;

	definitionAndBoundSpanForHtmlNode?(htmlNode: HtmlNode, context: ITsHtmlExtensionDefinitionAndBoundSpanContext): DefinitionInfoAndBoundSpan | undefined;
	definitionAndBoundSpanForHtmlAttr?(htmlAttr: HtmlAttr, context: ITsHtmlExtensionDefinitionAndBoundSpanContext): DefinitionInfoAndBoundSpan | undefined;

	quickInfoForHtmlNode?(htmlNode: HtmlNode, context: ITsHtmlExtensionQuickInfoContext): QuickInfo | undefined;
	quickInfoForHtmlAttr?(htmlAttr: HtmlAttr, context: ITsHtmlExtensionQuickInfoContext): QuickInfo | undefined;

	codeFixesForHtmlNodeReport?(htmlNode: HtmlNode, htmlReport: HtmlReport, context: ITsHtmlExtensionCodeFixContext): CodeFixAction[] | undefined;
	codeFixesForHtmlAttrReport?(htmlAttr: HtmlAttr, htmlReport: HtmlReport, context: ITsHtmlExtensionCodeFixContext): CodeFixAction[] | undefined;

	diagnosticsForHtmlNodeReport?(htmlNode: HtmlNode, htmlReport: HtmlReport, context: ITsHtmlExtensionDiagnosticContext): DiagnosticWithLocation[] | undefined;
	diagnosticsForHtmlAttrReport?(htmlAttr: HtmlAttr, htmlReport: HtmlReport, context: ITsHtmlExtensionDiagnosticContext): DiagnosticWithLocation[] | undefined;

	validateHtmlNode?(htmlNode: HtmlNode, context: ITsHtmlExtensionValidateContext): HtmlReport[] | undefined;
	validateHtmlAttr?(htmlAttr: HtmlAttr, context: ITsHtmlExtensionValidateContext): HtmlReport[] | undefined;
	validateHtmlAttrAssignment?(htmlAttr: HtmlAttr, context: ITsHtmlExtensionValidateExpressionContext): HtmlReport[] | undefined;

	parseAttrName?(attrName: string): { name: string; modifier?: string } | undefined;
	parseHtmlNode?(p5Node: IP5TagNode, context: ITsHtmlExtensionParseHtmlNodeContext): HtmlNode | undefined;
	parseHtmlAttr?(p5Attr: IP5NodeAttr, htmlNode: HtmlNode, context: ITsHtmlExtensionParseAttrContext): HtmlAttr | undefined;
	parseHtmlAttrAssignment?(htmlAttr: HtmlAttr, context: ITsHtmlExtensionParseAttrAssignmentContext): IHtmlAttrAssignment | undefined;
}

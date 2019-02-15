import { DiagnosticWithLocation, SourceFile } from "typescript";
import { DIAGNOSTIC_SOURCE } from "../../constants";
import { TsLitPluginStore } from "../../state/store";
import { tsModule } from "../../ts-module";
import { HtmlNodeAttr } from "../../types/html-node-attr-types";
import { HtmlNode } from "../../types/html-node-types";
import { HtmlReport, HtmlReportKind } from "../../types/html-report-types";
import { rangeToTSSpan } from "../../util/util";

export function diagnosticsForHtmlNodeReport(htmlNode: HtmlNode, htmlReport: HtmlReport, file: SourceFile, store: TsLitPluginStore): DiagnosticWithLocation[] {
	const messageText = getMessageTextFromHtmlReportOnNode(htmlNode, htmlReport);
	if (messageText == null) return [];

	return [
		{
			file,
			...rangeToTSSpan(htmlNode.location.name),
			messageText,
			category: tsModule.ts.DiagnosticCategory.Error,
			source: DIAGNOSTIC_SOURCE,
			code: 2322
		}
	];
}

function getMessageTextFromHtmlReportOnNode(htmlNode: HtmlNode, htmlReport: HtmlReport): string | undefined {
	switch (htmlReport.kind) {
		case HtmlReportKind.UNKNOWN:
			return `Unknown tag "${htmlNode.tagName}"${htmlReport.suggestedName ? `. Did you mean '${htmlReport.suggestedName}'?` : ""}`;
		case HtmlReportKind.TAG_NOT_CLOSED:
			return "This tag isn't closed.";
		case HtmlReportKind.MISSING_PROPS:
			return `Missing required properties: ${htmlReport.props.map(p => `${p.name}`).join(", ")}`;
		case HtmlReportKind.MISSING_IMPORT:
			return `Missing import`; // <${htmlNode.tagName}>: ${htmlNode.component.meta.className}`;
		//return `Missing import <${htmlNode.tagName}>: ${htmlNode.component.meta.className}`;
	}

	return undefined;
}

export function diagnosticsForHtmlAttrReport(htmlAttr: HtmlNodeAttr, htmlReport: HtmlReport, file: SourceFile, store: TsLitPluginStore): DiagnosticWithLocation[] {
	const messageText = getMessageTextFromHtmlReportOnAttr(htmlAttr, htmlReport);
	if (messageText == null) return [];

	return [
		{
			...rangeToTSSpan(htmlAttr.location.name),
			file,
			messageText,
			category: tsModule.ts.DiagnosticCategory.Error,
			source: DIAGNOSTIC_SOURCE,
			code: 2322
		}
	];
}

function getMessageTextFromHtmlReportOnAttr(htmlAttr: HtmlNodeAttr, htmlReport: HtmlReport): string | undefined {
	switch (htmlReport.kind) {
		case HtmlReportKind.LIT_INVALID_ATTRIBUTE_EXPRESSION_TYPE:
			return `Type '${htmlReport.typeB}' is not assignable to '${htmlReport.typeA}'`;
		case HtmlReportKind.LIT_BOOL_MOD_ON_NON_BOOL:
			return `You are using a boolean attribute modifier on a non boolean type '${htmlReport.typeA}'`;
		case HtmlReportKind.LIT_PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX:
			if (htmlReport.isBooleanAssignment) {
				return `You are assigning a boolean to a non-primitive type '${htmlReport.typeA}'. Use '.' modifier instead?`;
			} else {
				return `You are assigning the string '${htmlReport.typeB}' to a non-primitive type '${htmlReport.typeA}'. Use '.' modifier instead?`;
			}

		case HtmlReportKind.UNKNOWN:
			return `Unknown attribute "${htmlAttr.name}"${htmlReport.suggestedName ? `. Did you mean '${htmlReport.suggestedName}'?` : ""}`;
	}

	return undefined;
}

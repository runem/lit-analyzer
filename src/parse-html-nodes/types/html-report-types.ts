import { IComponentDeclarationProp } from "../../parse-components/component-types";

export enum HtmlReportKind {
	MISSING_IMPORT = "MISSING_IMPORT",
	MISSING_PROPS = "MISSING_ATTRIBUTES",
	UNKNOWN = "UNKNOWN"
}

export interface IHtmlReportBase {
	kind: string;
}

export interface IHtmlReportUnknown extends IHtmlReportBase {
	kind: HtmlReportKind.UNKNOWN;
	suggestedName?: string;
}

export interface IHtmlReportMissingImport extends IHtmlReportBase {
	kind: HtmlReportKind.MISSING_IMPORT;
}

export interface IHtmlReportMissingProps extends IHtmlReportBase {
	kind: HtmlReportKind.MISSING_PROPS;
	props: IComponentDeclarationProp[];
}

export type HtmlReport = IHtmlReportUnknown | IHtmlReportMissingImport | IHtmlReportMissingProps;

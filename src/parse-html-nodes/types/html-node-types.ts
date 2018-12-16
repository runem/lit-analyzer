import { Node } from "typescript";
import { IComponentDeclaration } from "../../parse-components/component-types";
import { IHtmlAttrBase } from "./html-attr-types";
import { IHtmlReportBase } from "./html-report-types";

export interface IHtmlSourceCodeLocation {
	start: number;
	end: number;
}

export interface IHtmlNodeSourceCodeLocation extends IHtmlSourceCodeLocation {
	name: IHtmlSourceCodeLocation;
	startTag: IHtmlSourceCodeLocation;
	endTag?: IHtmlSourceCodeLocation;
}

export interface IHtmlTemplate {
	astNode: Node;
	childNodes: IHtmlNodeBase[];
	location: IHtmlSourceCodeLocation;
}

export enum HtmlNodeKind {
	COMPONENT = "COMPONENT",
	BUILT_IN = "BUILT_IN",
	UNKNOWN = "UNKNOWN"
}

export interface IHtmlNodeBase {
	tagName: string;
	location: IHtmlNodeSourceCodeLocation;
	attributes: IHtmlAttrBase[];
	reports?: IHtmlReportBase[];
	childNodes?: IHtmlNodeBase[];
	selfClosed: boolean;
}

export interface IHtmlNodeCustomElement extends IHtmlNodeBase {
	kind: HtmlNodeKind.COMPONENT;
	component: IComponentDeclaration;
}

export interface IHtmlNodeBuiltIn extends IHtmlNodeBase {
	kind: HtmlNodeKind.BUILT_IN;
}

export interface IHtmlNodeUnknown extends IHtmlNodeBase {
	kind: HtmlNodeKind.UNKNOWN;
}

export type HtmlNode = IHtmlNodeCustomElement | IHtmlNodeBuiltIn | IHtmlNodeUnknown;

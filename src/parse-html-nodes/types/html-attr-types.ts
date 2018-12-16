import { IComponentDeclaration, IComponentDeclarationProp } from "../../parse-components/component-types";
import { IHtmlAttrAssignment } from "./html-attr-assignment-types";
import { IHtmlNodeBase, IHtmlSourceCodeLocation } from "./html-node-types";
import { IHtmlReportBase } from "./html-report-types";

export enum HtmlAttrKind {
	CUSTOM_PROP = "CUSTOM_PROP",
	BUILT_IN = "BUILT_IN",
	UNKNOWN = "UNKNOWN"
}

export interface IHtmlAttrSourceCodeLocation extends IHtmlSourceCodeLocation {
	name: IHtmlSourceCodeLocation;
}

export interface IHtmlAttrBase {
	name: string;
	modifier?: string;
	location: IHtmlAttrSourceCodeLocation;
	assignment?: IHtmlAttrAssignment;
	reports?: IHtmlReportBase[];
	htmlNode: IHtmlNodeBase;
}

export interface IHtmlAttrCustomProp extends IHtmlAttrBase {
	kind: HtmlAttrKind.CUSTOM_PROP;
	prop: IComponentDeclarationProp;
	component: IComponentDeclaration;
}

export interface IHtmlAttrBuiltIn extends IHtmlAttrBase {
	kind: HtmlAttrKind.BUILT_IN;
}

export interface IHtmlAttrUnknown extends IHtmlAttrBase {
	kind: HtmlAttrKind.UNKNOWN;
}

export type HtmlAttr = IHtmlAttrCustomProp | IHtmlAttrBuiltIn | IHtmlAttrUnknown;

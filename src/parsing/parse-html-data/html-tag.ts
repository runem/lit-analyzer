import { SimpleType } from "ts-simple-type";

export interface HtmlTag {
	name: string;
	description?: string;
	hasDeclaration?: boolean;
	attributes: HtmlAttr[];
	properties: HtmlProp[];
	events: HtmlEvent[];
}

export interface HtmlAttr {
	name: string;
	description?: string;
	required?: boolean;
	hasProp?: boolean;
	type: SimpleType;
}

export interface HtmlProp {
	name: string;
	description?: string;
	required?: boolean;
	hasAttr?: boolean;
	type: SimpleType;
}

export interface HtmlEvent {
	name: string;
	description?: string;
	type: SimpleType;
}

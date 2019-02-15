import { SimpleType } from "ts-simple-type";

export interface HtmlTag {
	name: string;
	description?: string;
	hasDeclaration?: boolean;
	attributes: HtmlTagAttr[];
}

export interface HtmlTagAttr {
	name: string;
	description?: string;
	required?: boolean;
	hasProp?: boolean;
	type: SimpleType;
}

export interface HtmlDataTagAttrValue {
	name: string;
	description?: string;
}

export interface HtmlDataTagAttr {
	name: string;
	description?: string;
	values?: HtmlDataTagAttrValue[];
	valueSet?: string;
}

export interface HtmlDataTag {
	name: string;
	description?: string;
	attributes: HtmlDataTagAttr[];
}

export interface HtmlDataTagValueSet {
	name: string;
	values: HtmlDataTagAttrValue[];
}

export interface HtmlDataV1 {
	version: 1;
	tags?: HtmlDataTag[];
	globalAttributes?: HtmlDataTagAttr[];
	valueSets?: HtmlDataTagValueSet[];
}

export type HtmlData = HtmlDataV1;

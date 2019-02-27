import { SimpleType, SimpleTypeKind, SimpleTypeStringLiteral, SimpleTypeUnion } from "ts-simple-type";
import { HtmlData, HtmlDataAttr, HtmlDataAttrValue, HtmlDataTag, HtmlDataV1, HtmlDataValueSet } from "./html-data-tag";
import { HtmlAttr, HtmlEvent, HtmlTag } from "./html-tag";

export type HtmlDataResult = {
	tags: HtmlTag[];
	globalAttrs: HtmlAttr[];
	globalEvents: HtmlEvent[];
};

export function parseHtmlData(data: HtmlData): HtmlDataResult {
	switch (data.version) {
		case 1:
			return parseDataV1(data);
	}
}

function parseDataV1(data: HtmlDataV1): HtmlDataResult {
	const valueSetTypeMap = valueSetsToTypeMap(data.valueSets || []);
	valueSetTypeMap.set("v", { kind: SimpleTypeKind.BOOLEAN });

	const tags = (data.tags || []).map(tagData => tagDataToHtmlTag(tagData, valueSetTypeMap));

	const globalAttrs = (data.globalAttributes || []).map(tagDataAttr => tagDataToHtmlTagAttr(tagDataAttr, valueSetTypeMap));

	const globalEvents: HtmlEvent[] = [];

	return {
		tags,
		globalAttrs,
		globalEvents
	};
}

function tagDataToHtmlTag(tagData: HtmlDataTag, typeMap: ValueSetTypeMap): HtmlTag {
	const { name, description } = tagData;

	return {
		name,
		description,
		attributes: tagData.attributes.map(tagDataAttr => tagDataToHtmlTagAttr(tagDataAttr, typeMap)),
		properties: [],
		events: []
	};
}

function tagDataToHtmlTagAttr(tagDataAttr: HtmlDataAttr, typeMap: ValueSetTypeMap): HtmlAttr {
	const { name, description, valueSet, values } = tagDataAttr;

	const type = valueSet != null ? typeMap.get(valueSet) : values != null ? attrValuesToUnion(values) : undefined;

	return {
		name,
		description,
		type: type || { kind: SimpleTypeKind.ANY }
	};
}

type ValueSetTypeMap = Map<string, SimpleType>;

function valueSetsToTypeMap(valueSets: HtmlDataValueSet[]): ValueSetTypeMap {
	const entries = valueSets.map(valueSet => [valueSet.name, attrValuesToUnion(valueSet.values)] as [string, SimpleTypeUnion]);

	return new Map(entries);
}

function attrValuesToUnion(attrValues: HtmlDataAttrValue[]): SimpleTypeUnion {
	return {
		kind: SimpleTypeKind.UNION,
		types: attrValues.map(
			value =>
				({
					value: value.name,
					kind: SimpleTypeKind.STRING_LITERAL
				} as SimpleTypeStringLiteral)
		)
	};
}

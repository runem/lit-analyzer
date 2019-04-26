import { SimpleType, SimpleTypeKind, SimpleTypeStringLiteral } from "ts-simple-type";
import { lazy } from "../../util/general-util";
import { HtmlData, HtmlDataAttr, HtmlDataAttrValue, HtmlDataTag, HtmlDataV1, HtmlDataValueSet } from "./html-data-tag";
import { HtmlAttr, HtmlDataCollection, HtmlTag } from "./html-tag";

export function parseHtmlData(data: HtmlData): HtmlDataCollection {
	switch (data.version) {
		case 1:
			return parseDataV1(data);
	}
}

function parseDataV1(data: HtmlDataV1): HtmlDataCollection {
	const valueSetTypeMap = valueSetsToTypeMap(data.valueSets || []);
	valueSetTypeMap.set("v", { kind: SimpleTypeKind.BOOLEAN });

	const tags = (data.tags || []).map(tagData => tagDataToHtmlTag(tagData, valueSetTypeMap));

	const attrs = (data.globalAttributes || []).map(tagDataAttr => tagDataToHtmlTagAttr(tagDataAttr, valueSetTypeMap));

	return {
		tags,
		attrs,
		events: []
	};
}

function tagDataToHtmlTag(tagData: HtmlDataTag, typeMap: ValueSetTypeMap): HtmlTag {
	const { name, description } = tagData;

	const attributes = tagData.attributes.map(tagDataAttr => tagDataToHtmlTagAttr(tagDataAttr, typeMap, name));

	return {
		tagName: name,
		description,
		attributes,
		properties: [],
		events: [],
		slots: []
	};
}

function tagDataToHtmlTagAttr(tagDataAttr: HtmlDataAttr, typeMap: ValueSetTypeMap, fromTagName?: string): HtmlAttr {
	const { name, description, valueSet, values } = tagDataAttr;

	const type = valueSet != null ? typeMap.get(valueSet) : values != null ? attrValuesToUnion(values) : undefined;

	return {
		kind: "attribute",
		name,
		description,
		fromTagName,
		getType: lazy(() => type || { kind: SimpleTypeKind.ANY })
	};
}

type ValueSetTypeMap = Map<string, SimpleType>;

function valueSetsToTypeMap(valueSets: HtmlDataValueSet[]): ValueSetTypeMap {
	const entries = valueSets.map(valueSet => [valueSet.name, attrValuesToUnion(valueSet.values)] as [string, SimpleType]);

	return new Map(entries);
}

function attrValuesToUnion(attrValues: HtmlDataAttrValue[]): SimpleType {
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

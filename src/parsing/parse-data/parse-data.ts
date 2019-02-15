import { SimpleType, SimpleTypeKind, SimpleTypeStringLiteral, SimpleTypeUnion } from "ts-simple-type";
import { HtmlData, HtmlDataTag, HtmlDataTagAttr, HtmlDataTagAttrValue, HtmlDataTagValueSet, HtmlDataV1 } from "./html-data-tag";
import { HtmlTag, HtmlTagAttr } from "./html-tag";

export type HtmlDataResult = {
	tags: HtmlTag[];
	globalAttrs: HtmlTagAttr[];
};

export function parseData(data: HtmlData) {
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

	return {
		tags,
		globalAttrs
	};
}

function tagDataToHtmlTag(tagData: HtmlDataTag, typeMap: ValueSetTypeMap): HtmlTag {
	const { name, description } = tagData;

	return {
		name,
		description,
		attributes: tagData.attributes.map(tagDataAttr => tagDataToHtmlTagAttr(tagDataAttr, typeMap))
	};
}

function tagDataToHtmlTagAttr(tagDataAttr: HtmlDataTagAttr, typeMap: ValueSetTypeMap): HtmlTagAttr {
	const { name, description, valueSet, values } = tagDataAttr;

	const type = valueSet != null ? typeMap.get(valueSet) : values != null ? attrValuesToUnion(values) : undefined;

	return {
		name,
		description,
		type: type || { kind: SimpleTypeKind.ANY }
	};
}

type ValueSetTypeMap = Map<string, SimpleType>;

function valueSetsToTypeMap(valueSets: HtmlDataTagValueSet[]): ValueSetTypeMap {
	const entries = valueSets.map(valueSet => [valueSet.name, attrValuesToUnion(valueSet.values)] as [string, SimpleTypeUnion]);

	return new Map(entries);
}

function attrValuesToUnion(attrValues: HtmlDataTagAttrValue[]): SimpleTypeUnion {
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

import { SimpleType, SimpleTypeStringLiteral } from "ts-simple-type";
import { HTMLDataV1, IAttributeData, ITagData, IValueData, IValueSet } from "vscode-html-languageservice";
import { MarkupContent } from "vscode-languageserver-types";
import { lazy } from "../../util/general-util";
import { HtmlAttr, HtmlDataCollection, HtmlEvent, HtmlTag } from "./html-tag";

export interface ParseVscodeHtmlDataConfig {
	builtIn?: boolean;
	typeMap?: Map<string, SimpleType>;
}

export function parseVscodeHtmlData(data: HTMLDataV1, config: ParseVscodeHtmlDataConfig = {}): HtmlDataCollection {
	switch (data.version) {
		case 1:
		case 1.1:
			return parseVscodeDataV1(data, config);
	}
}

function parseVscodeDataV1(data: HTMLDataV1, config: ParseVscodeHtmlDataConfig): HtmlDataCollection {
	const valueSetTypeMap = valueSetsToTypeMap(data.valueSets || []);
	valueSetTypeMap.set("v", { kind: "BOOLEAN" });

	// Transfer existing typemap to new typemap
	if (config.typeMap != null) {
		for (const [k, v] of config.typeMap.entries()) {
			valueSetTypeMap.set(k, v);
		}
	}

	const newConfig = {
		...config,
		typeMap: valueSetTypeMap
	};

	const globalAttributes = (data.globalAttributes || []).map(tagDataAttr => tagDataToHtmlTagAttr(tagDataAttr, newConfig));

	const globalEvents = attrsToEvents(globalAttributes).map(evt => ({ ...evt, global: true }));

	return {
		tags: (data.tags || []).map(tagData => tagDataToHtmlTag(tagData, newConfig)),
		global: {
			attributes: globalAttributes,
			events: globalEvents
		}
	};
}

function tagDataToHtmlTag(tagData: ITagData, config: ParseVscodeHtmlDataConfig): HtmlTag {
	const { name, description } = tagData;

	const attributes = tagData.attributes.map(tagDataAttr => tagDataToHtmlTagAttr(tagDataAttr, config, name));

	const events = attrsToEvents(attributes);

	return {
		tagName: name,
		description: stringOrMarkupContentToString(description),
		attributes,
		events,
		properties: [],
		slots: [],
		builtIn: config.builtIn,
		cssParts: [],
		cssProperties: []
	};
}

function tagDataToHtmlTagAttr(tagDataAttr: IAttributeData, config: ParseVscodeHtmlDataConfig, fromTagName?: string): HtmlAttr {
	const { name, description, valueSet, values } = tagDataAttr;

	const type = valueSet != null ? config.typeMap?.get(valueSet) : values != null ? attrValuesToUnion(values) : undefined;

	return {
		kind: "attribute",
		name,
		description: stringOrMarkupContentToString(description),
		fromTagName,
		getType: lazy(() => type || { kind: "ANY" }),
		builtIn: config.builtIn
	};
}

function valueSetsToTypeMap(valueSets: IValueSet[]): Map<string, SimpleType> {
	const entries = valueSets.map(valueSet => [valueSet.name, attrValuesToUnion(valueSet.values)] as [string, SimpleType]);

	return new Map(entries);
}

function attrValuesToUnion(attrValues: IValueData[]): SimpleType {
	return {
		kind: "UNION",
		types: attrValues.map(
			value =>
				({
					value: value.name,
					kind: "STRING_LITERAL"
				} as SimpleTypeStringLiteral)
		)
	};
}

function stringOrMarkupContentToString(str: string | MarkupContent | undefined): string | undefined {
	if (str == null || typeof str === "string") {
		return str;
	}

	return str.value;
}

function attrsToEvents(htmlAttrs: HtmlAttr[]): HtmlEvent[] {
	return htmlAttrs
		.filter(htmlAttr => htmlAttr.name.startsWith("on"))
		.map(htmlAttr => ({
			name: htmlAttr.name.replace(/^on/, ""),
			description: htmlAttr.description,
			fromTagName: htmlAttr.fromTagName,
			getType: lazy(() => ({ kind: "ANY" } as SimpleType)),
			builtIn: htmlAttr.builtIn
		}));
}

import { existsSync, readFileSync } from "fs";
import { SimpleType, SimpleTypeKind } from "ts-simple-type";
import { LitAnalyzerConfig } from "../lit-analyzer-config";
import { HtmlData } from "../parse/parse-html-data/html-data-tag";
import { HtmlAttr, HtmlDataCollection, HtmlEvent, HtmlTag, mergeHtmlAttrs, mergeHtmlEvents, mergeHtmlTags } from "../parse/parse-html-data/html-tag";
import { parseHtmlData } from "../parse/parse-html-data/parse-html-data";
import { lazy } from "../util/general-util";

export function getUserConfigHtmlCollection(config: LitAnalyzerConfig): HtmlDataCollection {
	const collection = (() => {
		let collection: HtmlDataCollection = { tags: [], events: [], attrs: [] };
		for (const customHtmlData of Array.isArray(config.customHtmlData) ? config.customHtmlData : [config.customHtmlData]) {
			try {
				const data: HtmlData =
					typeof customHtmlData === "string" && existsSync(customHtmlData)
						? JSON.parse(readFileSync(customHtmlData, "utf8").toString())
						: customHtmlData;
				const parsedCollection = parseHtmlData(data);
				collection = {
					tags: mergeHtmlTags([...collection.tags, ...parsedCollection.tags]),
					attrs: mergeHtmlAttrs([...collection.attrs, ...parsedCollection.attrs]),
					events: mergeHtmlEvents([...collection.events, ...parsedCollection.events])
				};
			} catch (e) {
				//logger.error("Error parsing user configuration 'customHtmlData'", e, customHtmlData);
			}
		}
		return collection;
	})();

	const tags = config.globalTags.map(
		tagName =>
			({
				tagName: tagName,
				properties: [],
				attributes: [],
				events: [],
				slots: []
			} as HtmlTag)
	);

	const attrs = config.globalAttributes.map(
		attrName =>
			({
				name: attrName,
				kind: "attribute",
				getType: lazy(() => ({ kind: SimpleTypeKind.ANY } as SimpleType))
			} as HtmlAttr)
	);

	const events = config.globalEvents.map(
		eventName =>
			({
				name: eventName,
				kind: "event",
				getType: lazy(() => ({ kind: SimpleTypeKind.ANY } as SimpleType))
			} as HtmlEvent)
	);

	return {
		tags: [...tags, ...collection.tags],
		attrs: [...attrs, ...collection.attrs],
		events: [...events, ...collection.events]
	};
}

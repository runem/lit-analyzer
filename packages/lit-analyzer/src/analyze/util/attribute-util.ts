import { HtmlAttrTarget } from "../parse/parse-html-data/html-tag";
import { AnalyzerHtmlStore } from "../store/analyzer-html-store";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../types/html-node/html-node-attr-types";
import { findBestMatch } from "./find-best-match";

export function suggestTargetForHtmlAttr(htmlNodeAttr: HtmlNodeAttr, htmlStore: AnalyzerHtmlStore): HtmlAttrTarget | undefined {
	const properties = htmlStore.getAllPropertiesForTag(htmlNodeAttr.htmlNode);
	const attributes = htmlStore.getAllAttributesForTag(htmlNodeAttr.htmlNode);
	const events = htmlStore.getAllEventsForTag(htmlNodeAttr.htmlNode);

	switch (htmlNodeAttr.kind) {
		case HtmlNodeAttrKind.EVENT_LISTENER:
			return findSuggestedTarget(htmlNodeAttr.name, [events]);
		case HtmlNodeAttrKind.PROPERTY:
			return findSuggestedTarget(htmlNodeAttr.name, [properties, attributes]);
		case HtmlNodeAttrKind.ATTRIBUTE:
		case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
			return findSuggestedTarget(htmlNodeAttr.name, [attributes, properties]);
	}
}

function findSuggestedTarget(name: string, tests: Iterable<HtmlAttrTarget>[]): HtmlAttrTarget | undefined {
	for (const test of tests) {
		let items = [...test];

		// If the search string starts with "on"/"aria", only check members starting with "on"/"aria"
		// If not, remove members starting with "on"/"aria" from the list of items
		if (name.startsWith("on")) {
			items = items.filter(item => item.name.startsWith("on"));
		} else if (name.startsWith("aria")) {
			items = items.filter(item => item.name.startsWith("aria"));
		} else {
			items = items.filter(item => !item.name.startsWith("on") && !item.name.startsWith("aria"));
		}

		const match = findBestMatch(name, items, { matchKey: "name", caseSensitive: false });
		if (match != null) {
			return match;
		}
	}
	return;
}

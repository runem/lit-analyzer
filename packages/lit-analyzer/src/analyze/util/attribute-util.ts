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
			return findSuggestedTarget(htmlNodeAttr.name, events);
		case HtmlNodeAttrKind.PROPERTY:
			return findSuggestedTarget(htmlNodeAttr.name, properties, attributes);
		case HtmlNodeAttrKind.ATTRIBUTE:
		case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
			return findSuggestedTarget(htmlNodeAttr.name, attributes, properties);
	}
}

function findSuggestedTarget(name: string, ...tests: Iterable<HtmlAttrTarget>[]): HtmlAttrTarget | undefined {
	for (const test of tests) {
		const match = findBestMatch(name, [...test], { matchKey: "name", caseSensitive: false });
		if (match != null) {
			return match;
		}
	}
	return;
}

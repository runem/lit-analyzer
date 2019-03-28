import { SimpleType, SimpleTypeKind } from "ts-simple-type";
import { HTML5_GLOBAL_ATTRIBUTES, HTML5_VALUE_MAP } from "vscode-html-languageservice/lib/umd/languageFacts/data/html5";
import { ARIA_ATTRIBUTES } from "vscode-html-languageservice/lib/umd/languageFacts/data/html5Aria";
import { HTML5_EVENTS } from "vscode-html-languageservice/lib/umd/languageFacts/data/html5Events";
import { HTML5_TAGS } from "vscode-html-languageservice/lib/umd/languageFacts/data/html5Tags";
import { html5TagAttrType } from "./extra-html-data";
import { HtmlAttr, HtmlDataCollection, HtmlTag } from "./parsing/parse-html-data/html-tag";
import { parseHtmlData } from "./parsing/parse-html-data/parse-html-data";
import { Config } from "./state/config";
import { lazy } from "./util/util";

export function getUserConfigHtmlCollection(config: Config): HtmlDataCollection {
	const tags = config.globalHtmlTags.map(
		tagName =>
			({
				tagName: tagName,
				properties: [],
				attributes: [],
				events: [],
				slots: []
			} as HtmlTag)
	);

	const attrs = config.globalHtmlAttributes.map(
		attrName =>
			({
				name: attrName,
				kind: "attribute",
				getType: lazy(() => ({ kind: SimpleTypeKind.ANY } as SimpleType))
			} as HtmlAttr)
	);

	return { tags, attrs, events: [] };
}

export function getBuiltInHtmlCollection(): HtmlDataCollection {
	const result = parseHtmlData({
		version: 1,
		tags: HTML5_TAGS,
		globalAttributes: [...HTML5_GLOBAL_ATTRIBUTES, ...HTML5_EVENTS, ...ARIA_ATTRIBUTES],
		valueSets: HTML5_VALUE_MAP
	});

	result.tags.push({
		attributes: [],
		properties: [],
		events: [],
		slots: [],
		tagName: "svg",
		description: ""
	});

	result.tags.push({
		properties: [],
		events: [
			{
				name: "slotchange",
				description:
					"The slotchange event is fired on an HTMLSlotElement instance (<slot> element) when the node(s) contained in that slot change.\n\nNote: the slotchange event doesn't fire if the children of a slotted node change — only if you change (e.g. add or delete) the actual nodes themselves.",
				getType: lazy(() => ({ kind: SimpleTypeKind.ANY } as SimpleType)),
				fromTagName: "slot",
				builtIn: true
			}
		],
		slots: [],
		attributes: [
			{
				kind: "attribute",
				name: "name",
				getType: lazy(() => ({ kind: SimpleTypeKind.STRING } as SimpleType)),
				fromTagName: "slot",
				builtIn: true
			},
			{
				kind: "attribute",
				name: "onslotchange",
				getType: lazy(() => ({ kind: SimpleTypeKind.STRING } as SimpleType)),
				fromTagName: "slot",
				builtIn: true
			}
		],
		tagName: "slot",
		description: ""
	});

	result.attrs.push({
		kind: "attribute",
		name: "slot",
		getType: lazy(() => ({ kind: SimpleTypeKind.STRING } as SimpleType)),
		builtIn: true
	});

	const videoElement = result.tags.find(t => t.tagName === "video");
	if (videoElement != null) {
		videoElement.attributes = [
			...videoElement.attributes,
			{
				kind: "attribute",
				fromTagName: "video",
				builtIn: true,
				name: "playsinline",
				getType: lazy(() => ({ kind: SimpleTypeKind.BOOLEAN } as SimpleType)),
				description:
					'The playsinline attribute is a boolean attribute. If present, it serves as a hint to the user agent that the video ought to be displayed "inline" in the document by default, constrained to the element\'s playback area, instead of being displayed fullscreen or in an independent resizable window.'
			} as HtmlAttr
		];
	}

	for (const globalEvent of HTML5_EVENTS) {
		result.events.push({
			name: globalEvent.name.replace(/^on/, ""),
			description: globalEvent.description,
			getType: lazy(() => ({ kind: SimpleTypeKind.ANY } as SimpleType)),
			builtIn: true
		});
	}

	return {
		...result,
		tags: result.tags.map(tag => ({
			...tag,
			attributes: addMissingAttrTypes(tag.attributes)
		})),
		attrs: addMissingAttrTypes(result.attrs)
	};
}

function addMissingAttrTypes(attrs: HtmlAttr[]): HtmlAttr[] {
	return attrs.map(attr => {
		if (attr.getType().kind === SimpleTypeKind.ANY) {
			const newType = html5TagAttrType(attr.name);
			return {
				...attr,
				getType: lazy(() => newType)
			};
		}

		return attr;
	});
}

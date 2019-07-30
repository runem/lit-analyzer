import { SimpleType, SimpleTypeKind } from "ts-simple-type";
import { HTML5_GLOBAL_ATTRIBUTES, HTML5_VALUE_MAP } from "vscode-html-languageservice/lib/umd/languageFacts/data/html5";
import { ARIA_ATTRIBUTES } from "vscode-html-languageservice/lib/umd/languageFacts/data/html5Aria";
import { HTML5_EVENTS } from "vscode-html-languageservice/lib/umd/languageFacts/data/html5Events";
import { HTML5_TAGS } from "vscode-html-languageservice/lib/umd/languageFacts/data/html5Tags";
import { HtmlAttr, HtmlDataCollection } from "../parse/parse-html-data/html-tag";
import { parseHtmlData } from "../parse/parse-html-data/parse-html-data";
import { lazy } from "../util/general-util";
import { EXTRA_HTML5_EVENTS, hasTypeForAttrName, html5TagAttrType } from "./extra-html-data";

export function getBuiltInHtmlCollection(): HtmlDataCollection {
	// Combine data with extra html5 events because vscode-html-language-service hasn't included all events yet.
	const ALL_HTML5_EVENTS: typeof HTML5_EVENTS = [
		...HTML5_EVENTS,
		...EXTRA_HTML5_EVENTS.filter(evt => HTML5_EVENTS.find(existingEvt => existingEvt.name === evt.name) == null)
	];

	// It seems like the autocompletion value map for <select>, <textarea> and <input> needs "on" and "off" values
	const EXTENDED_HTML5_VALUE_MAP = HTML5_VALUE_MAP.map(VALUE_MAP => {
		switch (VALUE_MAP.name) {
			case "inputautocomplete":
				return {
					...VALUE_MAP,
					values: [{ name: "on" }, { name: "off" }, ...VALUE_MAP.values]
				};
			default:
				return VALUE_MAP;
		}
	});

	const result = parseHtmlData({
		version: 1,
		tags: HTML5_TAGS,
		globalAttributes: [...HTML5_GLOBAL_ATTRIBUTES, ...ALL_HTML5_EVENTS, ...ARIA_ATTRIBUTES],
		valueSets: EXTENDED_HTML5_VALUE_MAP
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

	result.attrs.push({
		kind: "attribute",
		name: "part",
		description: `This attribute specifies a "styleable" part on the element in your shadow tree.`,
		getType: lazy(() => ({ kind: SimpleTypeKind.STRING } as SimpleType)),
		builtIn: true
	});

	result.attrs.push({
		kind: "attribute",
		name: "theme",
		description: `This attribute specifies a global "styleable" part on the element.`,
		getType: lazy(() => ({ kind: SimpleTypeKind.STRING } as SimpleType)),
		builtIn: true
	});

	result.attrs.push({
		kind: "attribute",
		name: "exportparts",
		description: `This attribute is used to explicitly forward a child’s part to be styleable outside of the parent’s shadow tree.

The value must be a comma-separated list of part mappings:
  - "some-box, some-input"
  - "some-input: foo-input"
`,
		getType: lazy(() => ({ kind: SimpleTypeKind.STRING } as SimpleType)),
		builtIn: true
	});

	const textareaElement = result.tags.find(t => t.tagName === "textarea");
	if (textareaElement != null) {
		textareaElement.properties.push({
			kind: "property",
			name: "value",
			builtIn: true,
			fromTagName: "textarea",
			getType: lazy(
				() =>
					({
						kind: SimpleTypeKind.UNION,
						types: [{ kind: SimpleTypeKind.STRING }, { kind: SimpleTypeKind.NULL }]
					} as SimpleType)
			)
		});
	}

	const imageElement = result.tags.find(t => t.tagName === "img");
	if (imageElement != null) {
		imageElement.attributes.push({
			kind: "attribute",
			name: "loading",
			builtIn: true,
			fromTagName: "img",
			getType: lazy(
				() =>
					({
						kind: SimpleTypeKind.UNION,
						types: [
							{
								kind: SimpleTypeKind.STRING_LITERAL,
								value: "lazy"
							},
							{
								kind: SimpleTypeKind.STRING_LITERAL,
								value: "auto"
							},
							{ kind: SimpleTypeKind.STRING_LITERAL, value: "eager" }
						]
					} as SimpleType)
			)
		});
	}

	const inputElement = result.tags.find(t => t.tagName === "input");
	if (inputElement != null) {
		inputElement.properties.push({
			kind: "property",
			name: "value",
			builtIn: true,
			fromTagName: "input",
			getType: lazy(
				() =>
					({
						kind: SimpleTypeKind.UNION,
						types: [{ kind: SimpleTypeKind.STRING }, { kind: SimpleTypeKind.NULL }]
					} as SimpleType)
			)
		});
	}

	const audioElement = result.tags.find(t => t.tagName === "audio");
	if (audioElement != null) {
		audioElement.attributes = [
			...audioElement.attributes,
			{
				kind: "attribute",
				fromTagName: "audio",
				builtIn: true,
				name: "controlslist",
				getType: lazy(() => ({ kind: SimpleTypeKind.STRING } as SimpleType))
			} as HtmlAttr
		];
	}

	const videoElement = result.tags.find(t => t.tagName === "video");
	if (videoElement != null) {
		videoElement.attributes = [
			...videoElement.attributes,
			{
				kind: "attribute",
				fromTagName: "video",
				builtIn: true,
				name: "controlslist",
				getType: lazy(() => ({ kind: SimpleTypeKind.STRING } as SimpleType))
			} as HtmlAttr,
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

	for (const globalEvent of ALL_HTML5_EVENTS) {
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
			builtIn: true,
			attributes: addMissingAttrTypes(tag.attributes.map(attr => ({ ...attr, builtIn: true })))
		})),
		attrs: addMissingAttrTypes(result.attrs.map(attr => ({ ...attr, builtIn: true }))),
		events: result.events.map(event => ({ ...event, builtIn: true }))
	};
}

function addMissingAttrTypes(attrs: HtmlAttr[]): HtmlAttr[] {
	return attrs.map(attr => {
		if (hasTypeForAttrName(attr.name) || attr.getType().kind === SimpleTypeKind.ANY) {
			const newType = html5TagAttrType(attr.name);
			return {
				...attr,
				getType: lazy(() => newType)
			};
		}

		return attr;
	});
}

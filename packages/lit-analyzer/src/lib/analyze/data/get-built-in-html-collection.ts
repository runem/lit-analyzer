import { SimpleType } from "ts-simple-type";
import { HTMLDataV1 } from "vscode-html-languageservice";
import htmlDataJson from "vscode-web-custom-data/data/browsers.html-data.json";
import { HtmlAttr, HtmlDataCollection } from "../parse/parse-html-data/html-tag.js";
import { parseVscodeHtmlData } from "../parse/parse-html-data/parse-vscode-html-data.js";
import { lazy } from "../util/general-util.js";
import { EXTRA_HTML5_EVENTS, hasTypeForAttrName, html5TagAttrType } from "./extra-html-data.js";

export function getBuiltInHtmlCollection(): HtmlDataCollection {
	const vscodeHtmlData = htmlDataJson as HTMLDataV1;

	const version = vscodeHtmlData.version;
	const globalAttributes = [...(vscodeHtmlData.globalAttributes ?? [])];

	// Modify valueSets
	const valueSets = (vscodeHtmlData.valueSets || []).map(valueSet => {
		// It seems like the autocompletion value map for <select>, <textarea> and <input> needs "on" and "off" values
		if (valueSet.name === "inputautocomplete") {
			return {
				...valueSet,
				values: [{ name: "on" }, { name: "off" }, ...valueSet.values]
			};
		}

		return valueSet;
	});

	// Modify tags
	const tags = (vscodeHtmlData.tags || []).map(tag => {
		switch (tag.name) {
			case "audio":
				return {
					...tag,
					attributes: [
						...tag.attributes,
						{
							name: "controlslist",
							description: ""
						}
					]
				};

			case "video":
				return {
					...tag,
					attributes: [
						...tag.attributes,
						{
							name: "controlslist",
							description: ""
						},
						{
							name: "disablepictureinpicture",
							valueSet: "v" // "v" is the undocumented boolean type
						},
						{
							name: "playsinline",
							description:
								'The playsinline attribute is a boolean attribute. If present, it serves as a hint to the user agent that the video ought to be displayed "inline" in the document by default, constrained to the element\'s playback area, instead of being displayed fullscreen or in an independent resizable window.',
							valueSet: "v" // "v" is the undocumented boolean type
						}
					]
				};
		}

		return tag;
	});

	// Add missing html tags
	tags.push(
		{
			name: "svg",
			attributes: []
		},
		{
			name: "slot",
			description: "",
			attributes: [
				{
					name: "name",
					description: ""
				},
				{
					name: "onslotchange",
					description:
						"The slotchange event is fired on an HTMLSlotElement instance (<slot> element) when the node(s) contained in that slot change.\n\nNote: the slotchange event doesn't fire if the children of a slotted node change — only if you change (e.g. add or delete) the actual nodes themselves."
				}
			]
		}
	);

	// Add missing global attributes
	globalAttributes.push(
		// Combine data with extra html5 events because vscode-html-language-service hasn't included all events yet.
		...EXTRA_HTML5_EVENTS.filter(evt => globalAttributes.some(existingEvt => existingEvt.name === evt.name)),
		{
			name: "tabindex",
			description: ""
		},
		{
			name: "slot",
			description: ""
		},
		{
			name: "part",
			description: `This attribute specifies a "styleable" part on the element in your shadow tree.`
		},
		{
			name: "theme",
			description: `This attribute specifies a global "styleable" part on the element.`
		},
		{
			name: "exportparts",
			description: `This attribute is used to explicitly forward a child’s part to be styleable outside of the parent’s shadow tree.

The value must be a comma-separated list of part mappings:
  - "some-box, some-input"
  - "some-input: foo-input"
`
		}
	);

	// Parse vscode html data
	const result = parseVscodeHtmlData(
		{
			version,
			globalAttributes,
			tags,
			valueSets
		},
		{
			builtIn: true
		}
	);

	// Add missing properties to the result, because they are not included in vscode html data
	for (const tag of result.tags) {
		switch (tag.tagName) {
			case "textarea":
				tag.properties.push({
					kind: "property",
					name: "value",
					builtIn: true,
					fromTagName: "textarea",
					getType: lazy(
						() =>
							({
								kind: "UNION",
								types: [{ kind: "STRING" }, { kind: "NULL" }]
							} as SimpleType)
					)
				});
				break;

			case "img":
				tag.attributes.push({
					kind: "attribute",
					name: "loading",
					builtIn: true,
					fromTagName: "img",
					getType: lazy(
						() =>
							({
								kind: "UNION",
								types: [
									{
										kind: "STRING_LITERAL",
										value: "lazy"
									},
									{
										kind: "STRING_LITERAL",
										value: "auto"
									},
									{ kind: "STRING_LITERAL", value: "eager" }
								]
							} as SimpleType)
					)
				});
				break;

			case "input":
				tag.properties.push({
					kind: "property",
					name: "value",
					builtIn: true,
					fromTagName: "input",
					getType: lazy(
						() =>
							({
								kind: "UNION",
								types: [{ kind: "STRING" }, { kind: "NULL" }]
							} as SimpleType)
					)
				});
				break;
		}
	}

	// Add missing global properties to the result
	result.global.properties = [
		...(result.global.properties || []),
		{
			builtIn: true,
			description: `This attribute specifies a "styleable" part on the element in your shadow tree.`,
			getType: () => ({ kind: "STRING" }),
			kind: "property",
			name: "part"
		}
	];

	return {
		...result,
		tags: result.tags.map(tag => ({
			...tag,
			builtIn: true,
			attributes: addMissingAttrTypes(tag.attributes.map(attr => ({ ...attr, builtIn: true })))
		})),
		global: {
			...result.global,
			attributes: addMissingAttrTypes(result.global.attributes?.map(attr => ({ ...attr, builtIn: true })) || []),
			events: result.global.events?.map(event => ({ ...event, builtIn: true }))
		}
	};
}

function addMissingAttrTypes(attrs: HtmlAttr[]): HtmlAttr[] {
	return attrs.map(attr => {
		if (hasTypeForAttrName(attr.name) || attr.getType().kind === "ANY") {
			const newType = html5TagAttrType(attr.name);
			return {
				...attr,
				getType: lazy(() => newType)
			};
		}

		return attr;
	});
}

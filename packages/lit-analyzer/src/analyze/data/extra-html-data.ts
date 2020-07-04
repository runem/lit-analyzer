import { SimpleType, SimpleTypeStringLiteral } from "ts-simple-type";

const HTML_5_ATTR_TYPES: { [key: string]: string | string[] } = {
	onafterprint: "string",
	onbeforeprint: "string",
	onbeforeunload: "string",
	onhashchange: "string",
	onlanguagechange: "string",
	onmessage: "string",
	onoffline: "string",
	ononline: "string",
	onpagehide: "string",
	onpageshow: "string",
	onpopstate: "string",
	onstorage: "string",
	onunload: "string",
	onslotchange: "string",
	"aria-activedescendant": "",
	"aria-colcount": "",
	"aria-colindex": "",
	"aria-colspan": "",
	"aria-controls": "",
	"aria-describedat": "",
	"aria-describedby": "",
	"aria-errormessage": "",
	"aria-flowto": "",
	"aria-kbdshortcuts": "",
	"aria-label": "",
	"aria-labelledby": "",
	"aria-level": "",
	"aria-owns": "",
	"aria-placeholder": "",
	"aria-posinset": "",
	"aria-roledescription": "",
	"aria-rowcount": "",
	"aria-rowindex": "",
	"aria-rowspan": "",
	"aria-setsize": "",
	"aria-valuemax": "",
	"aria-valuemin": "",
	"aria-valuenow": "",
	"aria-valuetext": "",
	accesskey: "string",
	autocapitalize: ["off", "none", "on", "sentences", "words", "characters"],
	class: "string",
	contextmenu: "string",
	dropzone: ["copy", "move", "link"],
	id: "string",
	itemid: "",
	itemprop: "",
	itemref: "",
	itemtype: "",
	lang: "string",
	style: "string",
	tabindex: "number",
	title: "string",
	manifest: "",
	href: "string",
	target: ["_blank", "_parent", "_self", "_top"],
	rel: "",
	media: "",
	hreflang: "",
	type: "",
	sizes: "",
	name: "string",
	"http-equiv": "",
	content: "",
	charset: "",
	nonce: "",
	cite: "",
	start: "",
	value: "string",
	download: "boolean|string",
	ping: "",
	datetime: "",
	alt: "string",
	src: "string",
	srcset: "",
	usemap: "",
	width: "number|string",
	height: "number|string",
	srcdoc: "",
	data: "",
	form: "string",
	poster: "string",
	mediagroup: "",
	label: "string",
	srclang: "string",
	coords: "string",
	border: ["0", "1"],
	span: "number",
	colspan: "number",
	rowspan: "number",
	headers: "string",
	sorted: "",
	abbr: "string",
	"accept-charset": "string",
	action: "string",
	for: "string",
	accept: "string",
	dirname: "string",
	formaction: "string",
	formtarget: ["_self", "_blank", "_parent", "_top"],
	list: "string",
	max: "number|string",
	maxlength: "number",
	min: "number|string",
	minlength: "number",
	pattern: "string",
	placeholder: "string",
	size: "number",
	step: "number",
	cols: "number",
	rows: "number",
	low: "number",
	high: "number",
	optimum: "number",
	slot: "string",
	part: "string",
	exportparts: "string",
	theme: "string",
	controlslist: "string"
};

export function hasTypeForAttrName(attrName: string): boolean {
	return HTML_5_ATTR_TYPES[attrName] != null && HTML_5_ATTR_TYPES[attrName].length > 0;
}

export function html5TagAttrType(attrName: string): SimpleType {
	return stringToSimpleType(HTML_5_ATTR_TYPES[attrName] || "", attrName);
}

function stringToSimpleType(typeString: string | string[], name?: string): SimpleType {
	if (Array.isArray(typeString)) {
		return {
			kind: "UNION",
			types: typeString.map(value => ({ kind: "STRING_LITERAL", value } as SimpleTypeStringLiteral))
		};
	}

	if (typeString.includes("|")) {
		return {
			kind: "UNION",
			types: typeString.split("|").map(typeStr => stringToSimpleType(typeStr))
		};
	}

	switch (typeString) {
		case "number":
			return { kind: "NUMBER", name };
		case "boolean":
			return { kind: "BOOLEAN", name };
		case "string":
			return { kind: "STRING", name };
		default:
			return { kind: "ANY", name };
	}
}

/**
 * Data from vscode-html-languageservice
 */
export const EXTRA_HTML5_EVENTS = [
	{
		name: "onanimationend",
		description: "A CSS animation has completed."
	},
	{
		name: "onanimationiteration",
		description: "A CSS animation is repeated."
	},
	{
		name: "onanimationstart",
		description: "A CSS animation has started."
	},
	{
		name: "oncopy",
		description: "The text selection has been added to the clipboard."
	},
	{
		name: "oncut",
		description: "The text selection has been removed from the document and added to the clipboard."
	},
	{
		name: "ondragstart",
		description: "The user starts dragging an element or text selection."
	},
	{
		name: "onfocusin",
		description: "An element is about to receive focus (bubbles)."
	},
	{
		name: "onfocusout",
		description: "An element is about to lose focus (bubbles)."
	},
	{
		name: "onfullscreenchange",
		description: "An element was turned to fullscreen mode or back to normal mode."
	},
	{
		name: "onfullscreenerror",
		description: "It was impossible to switch to fullscreen mode for technical reasons or because the permission was denied."
	},
	{
		name: "ongotpointercapture",
		description: "Element receives pointer capture."
	},
	{
		name: "onlostpointercapture",
		description: "Element lost pointer capture."
	},
	{
		name: "onoffline",
		description: "The browser has lost access to the network."
	},
	{
		name: "ononline",
		description: "The browser has gained access to the network (but particular websites might be unreachable)."
	},
	{
		name: "onpaste",
		description: "Data has been transferred from the system clipboard to the document."
	},
	{
		name: "onpointercancel",
		description: "The pointer is unlikely to produce any more events."
	},
	{
		name: "onpointerdown",
		description: "The pointer enters the active buttons state."
	},
	{
		name: "onpointerenter",
		description: "Pointing device is moved inside the hit-testing boundary."
	},
	{
		name: "onpointerleave",
		description: "Pointing device is moved out of the hit-testing boundary."
	},
	{
		name: "onpointerlockchange",
		description: "The pointer was locked or released."
	},
	{
		name: "onpointerlockerror",
		description: "It was impossible to lock the pointer for technical reasons or because the permission was denied."
	},
	{
		name: "onpointermove",
		description: "The pointer changed coordinates."
	},
	{
		name: "onpointerout",
		description: "The pointing device moved out of hit-testing boundary or leaves detectable hover range."
	},
	{
		name: "onpointerover",
		description: "The pointing device is moved into the hit-testing boundary."
	},
	{
		name: "onpointerup",
		description: "The pointer leaves the active buttons state."
	},
	{
		name: "onratechange",
		description: "The playback rate has changed."
	},
	{
		name: "onselectstart",
		description: "A selection just started."
	},
	{
		name: "onselectionchange",
		description: "The selection in the document has been changed."
	},
	{
		name: "ontouchcancel",
		description: "A touch point has been disrupted in an implementation-specific manners (too many touch points for example)."
	},
	{
		name: "ontouchend",
		description: "A touch point is removed from the touch surface."
	},
	{
		name: "ontouchmove",
		description: "A touch point is moved along the touch surface."
	},
	{
		name: "ontouchstart",
		description: "A touch point is placed on the touch surface."
	},
	{
		name: "ontransitionend",
		description: "A CSS transition has completed."
	},
	{
		name: "onwheel",
		description: "A wheel button of a pointing device is rotated in any direction."
	}
];

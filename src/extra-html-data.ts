import { SimpleType, SimpleTypeKind, SimpleTypeStringLiteral } from "ts-simple-type";

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
	width: "number",
	height: "number",
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
	max: "number",
	maxlength: "number",
	min: "number",
	minlength: "number",
	pattern: "string",
	placeholder: "string",
	size: "number",
	step: "number",
	cols: "number",
	rows: "number",
	low: "number",
	high: "number",
	optimum: "number"
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
			kind: SimpleTypeKind.UNION,
			types: typeString.map(value => ({ kind: SimpleTypeKind.STRING_LITERAL, value } as SimpleTypeStringLiteral))
		};
	}

	if (typeString.includes("|")) {
		return {
			kind: SimpleTypeKind.UNION,
			types: typeString.split("|").map(typeStr => stringToSimpleType(typeStr))
		};
	}

	switch (typeString) {
		case "number":
			return { kind: SimpleTypeKind.NUMBER, name };
		case "boolean":
			return { kind: SimpleTypeKind.BOOLEAN, name };
		case "string":
			return { kind: SimpleTypeKind.STRING, name };
		default:
			return { kind: SimpleTypeKind.ANY, name };
	}
}

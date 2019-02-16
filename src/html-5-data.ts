import { SimpleType, SimpleTypeKind, SimpleTypeStringLiteral } from "ts-simple-type";

const HTML_5_ATTR_TYPES: { [key: string]: string | string[] } = {
	onafterprint: "",
	onbeforeprint: "",
	onbeforeunload: "",
	onhashchange: "",
	onlanguagechange: "",
	onmessage: "",
	onoffline: "",
	ononline: "",
	onpagehide: "",
	onpageshow: "",
	onpopstate: "",
	onstorage: "",
	onunload: "",
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
	lang: "",
	style: "string",
	tabindex: "number",
	title: "string",
	manifest: "",
	href: "",
	target: "",
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
	download: "",
	ping: "",
	datetime: "",
	alt: "",
	src: "",
	srcset: "",
	usemap: "",
	width: "",
	height: "",
	srcdoc: "",
	data: "",
	form: "string",
	poster: "",
	mediagroup: "",
	label: "",
	srclang: "",
	coords: "",
	border: "",
	span: "",
	colspan: "",
	rowspan: "",
	headers: "",
	sorted: "",
	abbr: "",
	"accept-charset": "",
	action: "",
	for: "",
	accept: "string",
	dirname: "",
	formaction: "",
	formtarget: ["_self", "_blank", "_parent", "_top"],
	list: "string",
	max: "",
	maxlength: "",
	min: "",
	minlength: "",
	pattern: "",
	placeholder: "",
	size: "",
	step: "",
	cols: "",
	rows: "",
	low: "",
	high: "",
	optimum: ""
};

export function html5TagAttrType(attrName: string, name?: string): SimpleType {
	return stringToSimpleType(HTML_5_ATTR_TYPES[attrName] || "");
}

function stringToSimpleType(typeString: string | string[], name?: string): SimpleType {
	if (Array.isArray(typeString)) {
		return {
			kind: SimpleTypeKind.UNION,
			types: typeString.map(value => ({ kind: SimpleTypeKind.STRING_LITERAL, value } as SimpleTypeStringLiteral))
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

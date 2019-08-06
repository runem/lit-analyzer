export type LitHtmlAttributeModifier = "." | "?" | "@";

export const LIT_HTML_PROP_ATTRIBUTE_MODIFIER = ".";

export const LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER = "?";

export const LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER = "@";

export const LIT_HTML_ATTRIBUTE_MODIFIERS: LitHtmlAttributeModifier[] = [
	LIT_HTML_PROP_ATTRIBUTE_MODIFIER,
	LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER,
	LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER
];

export const DIAGNOSTIC_SOURCE = "lit-plugin";

export const TS_IGNORE_FLAG = "@ts-ignore";

export const VERSION = "<@VERSION@>";

import { isAssignableToSimpleTypeKind, SimpleType, typeToString } from "ts-simple-type";
import { ComponentCssPart, ComponentCssProperty, ComponentDeclaration, ComponentEvent, ComponentMember, ComponentSlot } from "web-component-analyzer";
import {
	LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER,
	LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER,
	LIT_HTML_PROP_ATTRIBUTE_MODIFIER
} from "../../constants.js";
import { iterableDefined } from "../../util/iterable-util.js";

export interface HtmlDataFeatures {
	attributes: HtmlAttr[];
	properties: HtmlProp[];
	events: HtmlEvent[];
	slots: HtmlSlot[];
	cssParts: HtmlCssPart[];
	cssProperties: HtmlCssProperty[];
}

export interface HtmlDataCollection {
	tags: HtmlTag[];
	global: Partial<HtmlDataFeatures>;
}

export interface NamedHtmlDataCollection {
	tags: string[];
	global: Partial<Record<keyof HtmlDataFeatures, string[]>>;
}

export interface HtmlTag extends HtmlDataFeatures {
	tagName: string;
	description?: string;
	builtIn?: boolean;
	global?: boolean;
	declaration?: ComponentDeclaration;
}

export type HtmlTagMemberKind = "attribute" | "property";

export interface HtmlMemberBase {
	kind: HtmlTagMemberKind;
	builtIn?: boolean;
	required?: boolean;
	description?: string;
	declaration?: ComponentMember;
	name?: string;
	fromTagName?: string;
	related?: HtmlMember[];
	getType(): SimpleType;
}

export interface HtmlAttr extends HtmlMemberBase {
	kind: "attribute";
	name: string;
	related?: HtmlMember[];
}

export interface HtmlProp extends HtmlMemberBase {
	kind: "property";
	name: string;
	related?: HtmlMember[];
}

export type HtmlMember = HtmlAttr | HtmlProp;

export interface HtmlEvent {
	name: string;
	description?: string;
	declaration?: ComponentEvent;
	builtIn?: boolean;
	global?: boolean;
	fromTagName?: string;
	related?: HtmlEvent[];
	getType(): SimpleType;
}

export interface HtmlSlot {
	name: string;
	fromTagName?: string;
	description?: string;
	declaration?: ComponentSlot;
	related?: HtmlCssPart[];
}

export interface HtmlCssPart {
	name: string;
	fromTagName?: string;
	description?: string;
	declaration?: ComponentCssPart;
	related?: HtmlCssPart[];
}

export interface HtmlCssProperty {
	name: string;
	fromTagName?: string;
	description?: string;
	typeHint?: string;
	declaration?: ComponentCssProperty;
	related?: HtmlCssProperty[];
}

export type HtmlAttrTarget = HtmlEvent | HtmlMember;

export function isHtmlMember(target: HtmlAttrTarget): target is HtmlMember {
	return "kind" in target;
}

export function isHtmlAttr(target: HtmlAttrTarget): target is HtmlAttr {
	return isHtmlMember(target) && target.kind === "attribute";
}

export function isHtmlProp(target: HtmlAttrTarget): target is HtmlProp {
	return isHtmlMember(target) && target.kind === "property";
}

export function isHtmlEvent(target: HtmlAttrTarget): target is HtmlEvent {
	return !isHtmlMember(target);
}

export function litAttributeModifierForTarget(target: HtmlAttrTarget): string {
	if (isHtmlAttr(target)) {
		if (isAssignableToSimpleTypeKind(target.getType(), "BOOLEAN")) {
			return LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER;
		}
		return "";
	} else if (isHtmlProp(target)) {
		return LIT_HTML_PROP_ATTRIBUTE_MODIFIER;
	} else {
		return LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER;
	}
}

export interface DescriptionOptions {
	markdown?: boolean;
}

function descriptionHeader(title: string, titleLevel = 0, { markdown }: DescriptionOptions) {
	return markdown ? (titleLevel === 0 ? `**${title.trim()}**` : `${"#".repeat(titleLevel)} ${title}`) : title;
}

function descriptionListItem(item: string, { markdown }: DescriptionOptions) {
	return markdown ? ` * ${item.replace("\n", " ")}` : ` * ${item}`;
}

function descriptionList<T>(title: string, items: T[], toString: (item: T) => string, options: DescriptionOptions) {
	const itemsDesc = items.map(item => descriptionListItem(toString(item), options)).join("\n");
	return `${descriptionHeader(`${title}:`, 0, options)}\n${itemsDesc}`;
}

export function documentationForCssPart(cssPart: HtmlCssPart, options: DescriptionOptions = {}): string | undefined {
	const relatedText = (() => {
		if ((cssPart.related?.length || 0) > 0) {
			return `From multiple elements: ${cssPart.related!.map(p => `<${p.fromTagName}>`).join(", ")}`;
		} else if (cssPart.fromTagName != null) {
			return `From: <${cssPart.fromTagName}>`;
		}

		return undefined;
	})();

	return iterableDefined([cssPart.description, relatedText]).join("\n\n");
}

export function documentationForCssProperty(cssProperty: HtmlCssProperty, options: DescriptionOptions = {}): string | undefined {
	const relatedText = (() => {
		if ((cssProperty.related?.length || 0) > 0) {
			return `From multiple elements: ${cssProperty.related!.map(p => `<${p.fromTagName}>`).join(", ")}`;
		} else if (cssProperty.fromTagName != null) {
			return `From: <${cssProperty.fromTagName}>`;
		}

		return undefined;
	})();

	return iterableDefined([cssProperty.description, cssProperty.typeHint, relatedText]).join("\n\n");
}

export function documentationForHtmlTag(htmlTag: HtmlTag, options: DescriptionOptions = {}): string | undefined {
	let desc = htmlTag.description || "";

	if (htmlTag.slots.length > 0) {
		const items = htmlTag.slots.sort((a, b) => a.name.localeCompare(b.name));
		desc += `\n\n${descriptionList(
			"Slots",
			items,
			slot => `${descriptionHeader(`@slot ${slot.name}`, 0, options)}${slot.description ? ` - ${slot.description}` : ""}`,
			options
		)}`;
	}

	if (htmlTag.events.length > 0) {
		const items = htmlTag.events.sort((a, b) => a.name.localeCompare(b.name));
		desc += `\n\n${descriptionList(
			"Events",
			items,
			event => `${descriptionHeader(`@fires ${event.name}`, 0, options)}${event.description ? ` - ${event.description}` : ""}`,
			options
		)}`;
	}

	return desc || undefined;
}

export function documentationForTarget(target: HtmlAttrTarget, options: DescriptionOptions & { modifier?: string } = {}): string | undefined {
	const typeText = targetKindAndTypeText(target, options);
	const documentation = descriptionForTarget(target, options);

	return `${typeText}${documentation != null ? ` \n\n${documentation}` : ""}`;
}

export function descriptionForTarget(target: HtmlAttrTarget, options: DescriptionOptions = {}): string | undefined {
	if (target.related != null && target.related.length > 1) {
		const subDocumentation = (target.related as HtmlAttrTarget[])
			.map(t => `${t.fromTagName ? `<${t.fromTagName}>: ` : "(global): "}${t.description || "[no documentation]"}`)
			.map((doc, i) => `${i + 1}. ${doc}`);
		return `${descriptionHeader("Multiple declarations (best match first):", 0, options)}\n${subDocumentation.join("\n")}`;
	}

	return target.description;
}

export function targetKindAndTypeText(target: HtmlAttrTarget, options: DescriptionOptions & { modifier?: string } = {}): string {
	const prefix = `(${targetKindText(target)}) ${options.modifier || ""}${target.name}`;

	if (isAssignableToSimpleTypeKind(target.getType(), "ANY")) {
		if(target.declaration?.typeHint){
			return `${prefix}: ${target.declaration.typeHint}`
		}
		return `${prefix}`;
	}

	return `${prefix}: ${typeToString(target.getType())}`;
}

export function targetKindText(target: HtmlAttrTarget): string {
	if (isHtmlMember(target)) {
		return target.kind === "property" ? "property" : "attribute";
	} else if (isHtmlEvent(target)) {
		return "event";
	}

	return "unknown";
}

function mergeFirstUnique<T, U>(items: T[], uniqueOn: (item: T) => U): T[] {
	const unique = new Set<U>();
	return items.filter(item => {
		const identity = uniqueOn(item);
		if (!unique.has(identity)) {
			unique.add(identity);
			return true;
		}

		return false;
	});
}

export function mergeHtmlAttrs(attrs: HtmlAttr[]): HtmlAttr[] {
	return mergeFirstUnique(attrs, attr => attr.name);
}

export function mergeHtmlProps(props: HtmlProp[]): HtmlProp[] {
	return mergeFirstUnique(props, prop => prop.name);
}

export function mergeHtmlEvents(events: HtmlEvent[]): HtmlEvent[] {
	return mergeFirstUnique(events, event => event.name);
}

export function mergeHtmlSlots(slots: HtmlSlot[]): HtmlSlot[] {
	return mergeFirstUnique(slots, event => event.name);
}

export function mergeCssParts(cssParts: HtmlCssPart[]): HtmlCssPart[] {
	return mergeFirstUnique(cssParts, cssPart => cssPart.name);
}

export function mergeCssProperties(cssProperties: HtmlCssProperty[]): HtmlCssProperty[] {
	return mergeFirstUnique(cssProperties, cssProp => cssProp.name);
}

export function mergeHtmlTags(tags: HtmlTag[]): HtmlTag[] {
	const mergedTags = new Map<string, HtmlTag>();
	for (const tag of tags) {
		const existingTag = mergedTags.get(tag.tagName);
		if (existingTag != null) {
			mergedTags.set(tag.tagName, {
				...tag,
				builtIn: tag.builtIn || existingTag.builtIn,
				global: tag.global || existingTag.global,
				declaration: tag.declaration || existingTag.declaration,
				description: tag.description || existingTag.description,
				attributes: mergeHtmlAttrs([...tag.attributes, ...existingTag.attributes]),
				properties: mergeHtmlProps([...tag.properties, ...existingTag.properties]),
				events: mergeHtmlEvents([...tag.events, ...existingTag.events]),
				slots: mergeHtmlSlots([...tag.slots, ...existingTag.slots])
			});
		} else {
			mergedTags.set(tag.tagName, tag);
		}
	}
	return Array.from(mergedTags.values());
}

import { isAssignableToSimpleTypeKind, SimpleType, SimpleTypeKind, toTypeString } from "ts-simple-type";
import { ComponentDeclaration, ComponentMember, ComponentSlot, EventDeclaration } from "web-component-analyzer";
import { LIT_HTML_BOOLEAN_ATTRIBUTE_MODIFIER, LIT_HTML_EVENT_LISTENER_ATTRIBUTE_MODIFIER, LIT_HTML_PROP_ATTRIBUTE_MODIFIER } from "../../constants";

export type HtmlDataCollection = {
	tags: HtmlTag[];
	attrs: HtmlAttr[];
	events: HtmlEvent[];
};

export interface HtmlTag {
	tagName: string;
	description?: string;
	builtIn?: boolean;
	global?: boolean;
	declaration?: ComponentDeclaration;
	attributes: HtmlAttr[];
	properties: HtmlProp[];
	events: HtmlEvent[];
	slots: HtmlSlot[];
}

export type HtmlTagMemberKind = "attribute" | "property";

export interface HtmlMemberBase {
	kind?: HtmlTagMemberKind;
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
	declaration?: EventDeclaration;
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
		if (isAssignableToSimpleTypeKind(target.getType(), SimpleTypeKind.BOOLEAN)) {
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

	if (isAssignableToSimpleTypeKind(target.getType(), SimpleTypeKind.ANY)) {
		return `${prefix}`;
	}

	return `${prefix}: ${toTypeString(target.getType())}`;
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

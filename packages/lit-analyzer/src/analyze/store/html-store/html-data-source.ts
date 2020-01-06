import { HtmlAttr, HtmlDataCollection, HtmlEvent, HtmlProp, HtmlSlot, HtmlTag, NamedHtmlDataCollection } from "../../parse/parse-html-data/html-tag";

export class HtmlDataSource {
	private _globalTags = new Map<string, HtmlTag>();
	get globalTags(): ReadonlyMap<string, HtmlTag> {
		return this._globalTags;
	}

	private _globalAttributes = new Map<string, HtmlAttr>();
	get globalAttributes(): ReadonlyMap<string, HtmlAttr> {
		return this._globalAttributes;
	}

	private _globalEvents = new Map<string, HtmlEvent>();
	get globalEvents(): ReadonlyMap<string, HtmlEvent> {
		return this._globalEvents;
	}

	private _globalProperties = new Map<string, HtmlProp>();
	get globalProperties(): ReadonlyMap<string, HtmlProp> {
		return this._globalProperties;
	}

	private _globalSlots = new Map<string, HtmlSlot>();
	get globalSlots(): ReadonlyMap<string, HtmlSlot> {
		return this._globalSlots;
	}

	absorbCollection(collection: Partial<HtmlDataCollection>) {
		if (collection.tags != null) {
			// For now, lowercase all names because "parse5" doesn't distinguish when parsing
			collection.tags.forEach(tag => this._globalTags.set(tag.tagName.toLowerCase(), tag));
		}

		if (collection.global?.attributes != null) {
			// For now, lowercase all names because "parse5" doesn't distinguish when parsing
			collection.global.attributes.forEach(attr => this._globalAttributes.set(attr.name.toLowerCase(), attr));
		}

		if (collection.global?.events != null) {
			// For now, lowercase all names because "parse5" doesn't distinguish when parsing
			collection.global.events.forEach(evt => this._globalEvents.set(evt.name.toLowerCase(), evt));
		}

		if (collection.global?.properties != null) {
			// For now, lowercase all names because "parse5" doesn't distinguish when parsing
			collection.global.properties.forEach(prop => this._globalProperties.set(prop.name.toLowerCase(), prop));
		}

		if (collection.global?.slots != null) {
			// For now, lowercase all names because "parse5" doesn't distinguish when parsing
			collection.global.slots.forEach(slot => this._globalSlots.set(slot.name.toLowerCase(), slot));
		}
	}

	forgetCollection({ tags, global: { events, attributes, slots, properties } }: NamedHtmlDataCollection) {
		if (tags != null) tags.forEach(tagName => this._globalTags.delete(tagName));
		if (events != null) events.forEach(eventName => this._globalEvents.delete(eventName));
		if (attributes != null) attributes.forEach(attrName => this._globalAttributes.delete(attrName));
		if (properties != null) properties.forEach(propName => this._globalProperties.delete(propName));
		if (slots != null) slots.forEach(slotName => this._globalSlots.delete(slotName));
	}

	getGlobalTag(tagName: string): HtmlTag | undefined {
		return this._globalTags.get(tagName);
	}

	getGlobalAttribute(attrName: string): HtmlAttr | undefined {
		return this._globalAttributes.get(attrName);
	}

	getGlobalEvent(eventName: string): HtmlEvent | undefined {
		return this._globalEvents.get(eventName);
	}

	getGlobalProperty(propName: string): HtmlProp | undefined {
		return this._globalProperties.get(propName);
	}

	getGlobalSlot(slotName: string): HtmlSlot | undefined {
		return this._globalSlots.get(slotName);
	}
}

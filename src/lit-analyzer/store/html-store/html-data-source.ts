import { HtmlAttr, HtmlDataCollection, HtmlEvent, HtmlTag } from "../../parse/parse-html-data/html-tag";

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

	absorbCollection(collection: Partial<HtmlDataCollection>) {
		if (collection.tags != null) {
			// For now, lowercase all names because "parse5" doesn't distinguish when parsing
			collection.tags.forEach(tag => this._globalTags.set(tag.tagName.toLowerCase(), tag));
		}

		if (collection.attrs != null) {
			// For now, lowercase all names because "parse5" doesn't distinguish when parsing
			collection.attrs.forEach(attr => this._globalAttributes.set(attr.name.toLowerCase(), attr));
		}

		if (collection.events != null) {
			// For now, lowercase all names because "parse5" doesn't distinguish when parsing
			collection.events.forEach(evt => this._globalEvents.set(evt.name.toLowerCase(), evt));
		}
	}

	forgetCollection({ tags, events, attrs }: Partial<Record<keyof HtmlDataCollection, string[]>>) {
		if (tags != null) tags.forEach(tagName => this._globalTags.delete(tagName));
		if (events != null) events.forEach(tagName => this._globalEvents.delete(tagName));
		if (attrs != null) attrs.forEach(tagName => this._globalAttributes.delete(tagName));
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
}

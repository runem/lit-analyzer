import {
	HtmlAttr,
	HtmlAttrTarget,
	HtmlDataCollection,
	HtmlEvent,
	HtmlMember,
	HtmlProp,
	HtmlSlot,
	HtmlTag
} from "../../parse/parse-html-data/html-tag";
import {
	HtmlNodeAttr,
	HtmlNodeAttrKind,
	IHtmlNodeAttr,
	IHtmlNodeAttrEventListener,
	IHtmlNodeAttrProp,
	IHtmlNodeBooleanAttribute
} from "../../types/html-node/html-node-attr-types";
import { HtmlNode } from "../../types/html-node/html-node-types";
import { AnalyzerHtmlStore } from "../analyzer-html-store";
import { HtmlDataSourceKind, HtmlDataSourceMerged } from "./html-data-source-merged";

export class DefaultAnalyzerHtmlStore implements AnalyzerHtmlStore {
	private dataSource = new HtmlDataSourceMerged();

	absorbSubclassExtension(name: string, extension: HtmlTag) {
		this.dataSource.absorbSubclassExtension(name, extension);
	}

	absorbCollection(collection: HtmlDataCollection, register: HtmlDataSourceKind) {
		this.dataSource.absorbCollection(collection, register);
	}

	forgetCollection(collection: Partial<Record<keyof HtmlDataCollection, string[]>>, register: HtmlDataSourceKind) {
		this.dataSource.forgetCollection(collection, register);
	}

	getHtmlTag(htmlNode: HtmlNode | string): HtmlTag | undefined {
		return this.dataSource.getHtmlTag(typeof htmlNode === "string" ? htmlNode : htmlNode.tagName);
	}

	getGlobalTags(): Iterable<HtmlTag> {
		return this.dataSource.globalTags.values();
	}

	getAllAttributesForTag(htmlNode: HtmlNode | string): Iterable<HtmlAttr> {
		return this.dataSource.getAllAttributesForTag(typeof htmlNode === "string" ? htmlNode : htmlNode.tagName).values();
	}

	getAllPropertiesForTag(htmlNode: HtmlNode | string): Iterable<HtmlProp> {
		return this.dataSource.getAllPropertiesForTag(typeof htmlNode === "string" ? htmlNode : htmlNode.tagName).values();
	}

	getAllEventsForTag(htmlNode: HtmlNode | string): Iterable<HtmlEvent> {
		return this.dataSource.getAllEventsForTag(typeof htmlNode === "string" ? htmlNode : htmlNode.tagName).values();
	}

	getAllSlotsForTag(htmlNode: HtmlNode | string): Iterable<HtmlSlot> {
		return this.dataSource.getAllSlotForTag(typeof htmlNode === "string" ? htmlNode : htmlNode.tagName).values();
	}

	getHtmlAttrTarget(htmlNodeAttr: IHtmlNodeAttrProp): HtmlProp | undefined;
	getHtmlAttrTarget(htmlNodeAttr: IHtmlNodeAttr | IHtmlNodeBooleanAttribute): HtmlAttr | undefined;
	getHtmlAttrTarget(htmlNodeAttr: IHtmlNodeAttr | IHtmlNodeBooleanAttribute | IHtmlNodeAttrProp): HtmlMember | undefined;
	getHtmlAttrTarget(htmlNodeAttr: IHtmlNodeAttrEventListener): HtmlEvent | undefined;
	getHtmlAttrTarget(htmlNodeAttr: HtmlNodeAttr): HtmlAttrTarget | undefined;
	getHtmlAttrTarget(htmlNodeAttr: HtmlNodeAttr): HtmlAttrTarget | undefined {
		const name = htmlNodeAttr.name.toLowerCase();

		switch (htmlNodeAttr.kind) {
			case HtmlNodeAttrKind.EVENT_LISTENER:
				return this.dataSource.getAllEventsForTag(htmlNodeAttr.htmlNode.tagName).get(name);

			case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
			case HtmlNodeAttrKind.ATTRIBUTE:
				return this.dataSource.getAllAttributesForTag(htmlNodeAttr.htmlNode.tagName).get(name);

			case HtmlNodeAttrKind.PROPERTY:
				return this.dataSource.getAllPropertiesForTag(htmlNodeAttr.htmlNode.tagName).get(name);
		}
	}
}

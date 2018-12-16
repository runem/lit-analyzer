import { readFileSync } from "fs";
import { resolve } from "path";
import { TypeKind } from "ts-is-assignable";

const cache = new Map<string, any>();

export type BuiltInAttributeType = TypeKind | string[];

/**
 * Reads and caches a json file.
 * @param filePath
 */
function getCachedJsonFile<T>(filePath: string): T {
	const absoluteFilePath = resolve(__dirname, filePath);

	if (!cache.has(absoluteFilePath)) {
		cache.set(absoluteFilePath, JSON.parse(readFileSync(absoluteFilePath, "utf8")));
	}
	return cache.get(absoluteFilePath);
}

const getBuiltInAttrType = () => getCachedJsonFile<Record<string, string | string[]>>("../../html-documentation/attribute-types.json");

const getAttrDescriptions = () => getCachedJsonFile<Record<string, string>>("../../html-documentation/attribute-descriptions.json");
const getTagDescriptions = () => getCachedJsonFile<Record<string, string>>("../../html-documentation/tag-descriptions.json");

const browserCompatDataHtml = () => getCachedJsonFile<Record<string, { attributes: Record<string, {}> }>>("../../html-documentation/browser-compat-data-html.json");

/**
 * Tests if a tag name is built in.
 * @param tagName
 */
export function isBuiltInTag(tagName: string): boolean {
	return browserCompatDataHtml()[tagName] != null;
}

/**
 * Tests if an attribute name on a tag name is built in.
 * @param tagName
 * @param attrName
 */
export function isBuiltInAttrForTag(tagName: string, attrName: string): boolean {
	return getBuiltInAttrsForTag(tagName).includes(attrName);
}

/**
 * Returns all built in tags.
 */
export function getBuiltInTags(): string[] {
	return Object.keys(browserCompatDataHtml()).filter(tagName => tagName !== "*");
}

/**
 * Returns the type of a built in attribute.
 * @param attrName
 */
export function getBuiltInAttributeType(attrName: string): BuiltInAttributeType {
	const type = getBuiltInAttrType()[attrName] || "";

	switch (type) {
		case "":
		case "any":
			return TypeKind.ANY;
		case "number":
			return TypeKind.NUMBER;
		case "boolean":
			return TypeKind.BOOLEAN;
		case "string":
			return TypeKind.STRING;
		default:
			if (Array.isArray(type)) {
				return type;
			}

			throw new Error(`Error reading html documentation attr type: ${type}`);
	}
}

/**
 * Returns all possible built in attributes for a given tag name.
 * @param tagName
 */
export function getBuiltInAttrsForTag(tagName: string): string[] {
	const tagData = browserCompatDataHtml()[tagName];
	return [...(tagData != null ? Object.keys(tagData.attributes) : []), ...Object.keys(browserCompatDataHtml()["*"].attributes)];
}

/**
 * Returns description for a built in tag name.
 * @param tagName
 */
export function getDescriptionForBuiltInTag(tagName: string): string | null {
	return getTagDescriptions()[tagName] || null;
}

/**
 * Returns description for a built in attribute.
 * @param attrName
 */
export function getDescriptionForBuiltInAttr(attrName: string): string | null {
	return getAttrDescriptions()[attrName] || null;
}

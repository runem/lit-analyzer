import { SourceFile } from "typescript";
import { IHtmlTemplate } from "../parse-html-nodes/types/html-node-types";
import { TsHtmlPluginStore } from "../state/store";
import { findParent, getNodeAtPosition } from "./ast-util";

export interface IHtmlPositionContext {
	htmlTemplate: IHtmlTemplate;
	html: string;
	positionInHtml: number;
	position: number;
	word: string;
	leftWord: string;
	rightWord: string;
	beforeWord: string;
	afterWord: string;
}

/**
 * Returns information about the position in a possible intersecting html template.
 * @param sourceFile
 * @param position
 * @param store
 */
function getIntersectingHtmlTemplate(sourceFile: SourceFile, position: number, store: TsHtmlPluginStore): Pick<IHtmlPositionContext, "positionInHtml" | "html" | "htmlTemplate"> | undefined {
	const htmlTemplates = store.getHtmlTemplatesForFile(sourceFile.fileName);

	const token = getNodeAtPosition(sourceFile, position);
	const node = findParent(token, store.ts.isTaggedTemplateExpression);

	if (node != null) {
		const html = node.getText();
		const start = node.getStart();
		const htmlTemplate = htmlTemplates.find(template => template.location.start === start);

		if (htmlTemplate) {
			const positionInHtml = position - start;

			return { positionInHtml, html, htmlTemplate };
		}
	}
}

/**
 * Returns information about the position in a html template.
 * @param sourceFile
 * @param position
 * @param store
 */
export function getHtmlPositionInSourceFile(sourceFile: SourceFile, position: number, store: TsHtmlPluginStore): IHtmlPositionContext | undefined {
	const res = getIntersectingHtmlTemplate(sourceFile, position, store);

	if (res != null) {
		const { html, positionInHtml } = res;

		const leftWord = grabWordInDirection({
			stopChar: /[\/=<>\s"${}]/,
			direction: "left",
			text: html,
			startPosition: positionInHtml
		});

		const rightWord = grabWordInDirection({
			stopChar: /[\/=<>\s"${}]/,
			direction: "right",
			text: html,
			startPosition: positionInHtml
		});

		const word = leftWord + rightWord;

		const beforeWord = html[Math.max(0, positionInHtml - leftWord.length - 1)];
		const afterWord = html[Math.min(html.length, positionInHtml - leftWord.length)];

		return {
			...res,
			position,
			word,
			leftWord,
			rightWord,
			beforeWord,
			afterWord
		};
	}
}

/**
 * Reads a word in a specific direction.
 * Stops if "stopChar" is encountered.
 * @param startPosition
 * @param stopChar
 * @param direction
 * @param text
 */
function grabWordInDirection({ startPosition, stopChar, direction, text }: { stopChar: RegExp; direction: "left" | "right"; text: string; startPosition: number }): string {
	const dir = direction === "left" ? -1 : 1;
	let curPosition = startPosition - (dir < 0 ? 1 : 0);
	while (curPosition > 0 && curPosition < text.length) {
		if (text[curPosition].match(stopChar)) break;
		curPosition += dir;
		if (curPosition > text.length || curPosition < 0) return "";
	}

	const a = curPosition;
	const b = startPosition;
	return text.substring(Math.min(a, b) + (dir < 0 ? 1 : 0), Math.max(a, b));
}

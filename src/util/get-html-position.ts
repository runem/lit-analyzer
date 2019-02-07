import { HTMLDocument } from "../html-document/html-document";

export interface IHtmlPositionContext {
	htmlDocument: HTMLDocument;
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
 * Returns information about the position in a html document.
 * @param htmlDocument
 * @param position
 */
export function getHtmlPositionInHtmlDocument(htmlDocument: HTMLDocument, position: number): IHtmlPositionContext {
	const html = htmlDocument.astNode.getText();
	const start = htmlDocument.astNode.getStart();
	const positionInHtml = position - start;

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
		positionInHtml,
		html,
		htmlDocument,
		position,
		word,
		leftWord,
		rightWord,
		beforeWord,
		afterWord
	};
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

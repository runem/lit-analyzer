import { TextDocument } from "../parse/document/text-document/text-document";
import { DocumentOffset } from "../types/range";

export interface DocumentPositionContext {
	text: string;
	offset: DocumentOffset;
	word: string;
	leftWord: string;
	rightWord: string;
	beforeWord: string;
	afterWord: string;
}

/**
 * Returns information about the position in a document.
 * @param document
 * @param offset
 */
export function getPositionContextInDocument(document: TextDocument, offset: DocumentOffset): DocumentPositionContext {
	const text = document.virtualDocument.text;

	const stopChar = /[/=<>\s"${}():]/;

	const leftWord = grabWordInDirection({
		direction: "left",
		startOffset: offset,
		stopChar,
		text
	});

	const rightWord = grabWordInDirection({
		direction: "right",
		startOffset: offset,
		stopChar,
		text
	});

	const word = leftWord + rightWord;

	const beforeWord = text[Math.max(0, offset - leftWord.length - 1)];
	const afterWord = text[Math.min(text.length - 1, offset + rightWord.length)];

	return {
		offset,
		text,
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
export function grabWordInDirection({
	startOffset,
	stopChar,
	direction,
	text
}: {
	stopChar: RegExp;
	direction: "left" | "right";
	text: string;
	startOffset: DocumentOffset;
}): string {
	const dir = direction === "left" ? -1 : 1;
	let curPosition = startOffset - (dir < 0 ? 1 : 0);
	while (curPosition > 0 && curPosition < text.length) {
		if (text[curPosition].match(stopChar)) break;
		curPosition += dir;
		if (curPosition > text.length || curPosition < 0) return "";
	}

	const a = curPosition;
	const b = startOffset;
	return text.substring(Math.min(a, b) + (dir < 0 ? 1 : 0), Math.max(a, b));
}

import { Expression, Node, TaggedTemplateExpression } from "typescript";
import { tsModule } from "../../../ts-module.js";
import { DocumentOffset, DocumentRange, Range, SourceFilePosition, SourceFileRange } from "../../../types/range.js";
import { intersects, makeSourceFileRange } from "../../../util/range-util.js";
import { VirtualDocument } from "./virtual-document.js";

function getPartLength(part: Node): number {
	const end = part.parent && tsModule.ts.isTemplateSpan(part.parent) ? part.parent.literal.getStart() : part.getEnd();
	return end - part.getFullStart();
}

export class VirtualAstDocument implements VirtualDocument {
	readonly fileName: string;
	readonly location: SourceFileRange;
	private readonly parts: (Expression | string)[];

	private _text?: string;

	get text(): string {
		if (this._text == null) {
			let str = "";

			let prevPart = "";
			this.parts.forEach((part, i) => {
				const isLastPart = i >= this.parts.length - 1;

				if (typeof part === "string") {
					str += part.substring(i === 0 ? 0 : 1, part.length - (isLastPart ? 0 : 2));
					prevPart = part;
				} else {
					const length = getPartLength(part) + 3;
					const expressionIndex = (i - 1) / 2;
					const substitution = this.substituteExpression(length, part, prevPart, this.parts[i + 1] as string, expressionIndex);
					str += substitution;
				}
			});

			this._text = str;
		}

		return this._text;
	}

	getPartsAtDocumentRange(range: DocumentRange): (Expression | string)[] {
		if (range == null) {
			return this.parts;
		}

		const resultParts: (Expression | string)[] = [];

		let offset = 0;
		this.parts.forEach((part, i) => {
			const isLastPart = i >= this.parts.length - 1;
			const startOffset = offset;

			if (typeof part === "string") {
				const startPadding = i === 0 ? 0 : 1;
				const endPadding = isLastPart ? 0 : 2;

				offset += part.length;

				const literalPartRange: Range = {
					start: startOffset + startPadding,
					end: offset - endPadding
				};

				if (
					(range.start < literalPartRange.start && range.end > literalPartRange.end) ||
					intersects(range.start + 1, literalPartRange) ||
					intersects(range.end - 1, literalPartRange)
				) {
					const strStart = Math.max(literalPartRange.start, range.start);
					const strEnd = Math.min(literalPartRange.end, range.end);

					const substr = this.text.substring(strStart, strEnd);
					resultParts.push(substr);
				}
			} else {
				offset += getPartLength(part);

				const expressionPartRange: Range = {
					start: startOffset,
					end: offset
				};

				if (intersects(expressionPartRange, range)) {
					resultParts.push(part);
				}
			}
		});

		return resultParts;
	}

	sfPositionToDocumentOffset(position: SourceFilePosition): DocumentOffset {
		return position - this.location.start;
	}

	documentOffsetToSFPosition(offset: DocumentOffset): SourceFilePosition {
		return this.location.start + offset;
	}

	constructor(parts: (Expression | string)[], location: SourceFileRange, fileName: string);
	constructor(astNode: TaggedTemplateExpression);
	constructor(astNodeOrParts: TaggedTemplateExpression | (Expression | string)[], location?: SourceFileRange, fileName?: string) {
		if (Array.isArray(astNodeOrParts)) {
			this.parts = astNodeOrParts.map((p, i) =>
				typeof p === "string" ? `${i !== 0 ? "}" : ""}${p}${i !== astNodeOrParts.length - 1 ? "${" : ""}` : p
			);
			this.location = location!;
			this.fileName = fileName!;
		} else {
			const { expressionParts, literalParts } = getPartsFromTaggedTemplate(astNodeOrParts);

			// Text contains both the ` of the template string and ${  +  }.
			// Strip these chars and make it possible to substitute even ${ and }!
			this.parts = [];
			literalParts.forEach((p, i) => {
				const expressionPart = expressionParts[i];
				this.parts.push(p.getText().slice(i === 0 ? 1 : 0, expressionPart == null ? -1 : undefined));
				if (expressionPart != null) this.parts.push(expressionPart);
			});

			this.location = makeSourceFileRange({
				start: astNodeOrParts.template.getStart() + 1,
				end: astNodeOrParts.template.getEnd() - 1
			});

			this.fileName = this.fileName = astNodeOrParts.getSourceFile().fileName;
		}
	}

	protected substituteExpression(length: number, expression: Expression, prev: string, next: string | undefined, index: number): string {
		if (length < 4) {
			throw new Error("Unexpected expression length: " + length);
		}
		const indexString = index + "";
		if (indexString.length > length - 2) {
			throw new Error("Too many expressions in this template: " + indexString);
		}
		return "_".repeat(length - indexString.length - 1) + indexString + "_";
	}
}

function getPartsFromTaggedTemplate(astNode: TaggedTemplateExpression): { expressionParts: Expression[]; literalParts: Node[] } {
	const expressionParts: Expression[] = [];
	const literalParts: Node[] = [];

	const template = astNode.template;
	if (tsModule.ts.isTemplateExpression(template)) {
		literalParts.push(template.head);

		for (const templateSpan of template.templateSpans) {
			const expression = templateSpan.expression;
			expressionParts.push(expression);
			literalParts.push(templateSpan.literal);
		}
	} else if (tsModule.ts.isNoSubstitutionTemplateLiteral(template)) {
		literalParts.push(template);
	}

	return { expressionParts, literalParts };
}

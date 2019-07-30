import { Expression, Node, TaggedTemplateExpression } from "typescript";
import { tsModule } from "../../../ts-module";
import { Range } from "../../../types/range";
import { intersects } from "../../../util/general-util";
import { VirtualDocument } from "./virtual-document";

function getPartLength(part: Node): number {
	const end = part.parent && tsModule.ts.isTemplateSpan(part.parent) ? part.parent.literal.getStart() : part.getEnd();
	return end - part.getFullStart();
}

export class VirtualAstDocument implements VirtualDocument {
	readonly fileName: string;
	readonly location: Range;
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
					const substitution = this.substituteExpression(length, part, prevPart, this.parts[i + 1] as string);
					str += substitution;
				}
			});

			this._text = str;
		}

		return this._text;
	}

	getPartsAtOffsetRange(range: Range): (Expression | string)[] {
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
					(intersects(range.start + 1, literalPartRange) || intersects(range.end - 1, literalPartRange))
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

	scPositionToOffset(position: number): number {
		return position - this.location.start;
	}

	offsetToSCPosition(offset: number): number {
		return this.location.start + offset;
	}

	constructor(parts: (Expression | string)[], location: Range, fileName: string);
	constructor(astNode: TaggedTemplateExpression);
	constructor(astNodeOrParts: TaggedTemplateExpression | (Expression | string)[], location?: Range, fileName?: string) {
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

			this.location = {
				start: astNodeOrParts.template.getStart() + 1,
				end: astNodeOrParts.template.getEnd() - 1
			};

			this.fileName = this.fileName = astNodeOrParts.getSourceFile().fileName;
		}
	}

	protected substituteExpression(length: number, expression: Expression, prev: string, next: string | undefined): string {
		return "_".repeat(length);
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

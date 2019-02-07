import { Expression, Node, TaggedTemplateExpression } from "typescript";
import { intersects } from "../util/util";

export class VirtualDocument {
	static get placeholderMark() {
		return "expression-placeholder";
	}

	get rawText() {
		return this.astNode.getText();
	}

	private _text?: string;

	get text() {
		if (this._text == null) {
			let str = "";

			this.literalParts.forEach((literalPart, i) => {
				const nextExpressionPart = this.expressionParts[i];
				str += literalPart.getText() + (nextExpressionPart != null ? this.getSubstituionId(nextExpressionPart) : "");
			});

			this._text = str;
		}

		return this._text;
	}

	constructor(public astNode: TaggedTemplateExpression, public literalParts: Node[], public expressionParts: Expression[], public parent: VirtualDocument | undefined = undefined) {}

	static getSubstitutionIdsInText(text: string): { ids: string[]; isMixed: boolean } {
		const ids: string[] = [];
		const regex = /\$\{(\d+_expression-placeholder)\}/gm;

		let match = regex.exec(text);
		while (match != null) {
			ids.push(match[1]);
			match = regex.exec(text);
		}

		// checks if the text is "${...}" or "abc${}abc"
		const isMixed = ids.length > 0 && text.match(/^\$.*_expression-placeholder}$/) == null;

		return { ids, isMixed };
	}

	getSubstitutionWithId(id: string): Expression | undefined {
		return this.expressionParts.find(expression => this.getSubstituionId(expression) === id);
	}

	offsetAtSourceCodePosition(position: number): number {
		let offset = 0;

		for (let i = 0; i < this.literalParts.length; i++) {
			const literalPart = this.literalParts[i];
			const nextExpressionPart = this.expressionParts[i];

			if (intersects(position, { start: literalPart.pos, end: literalPart.end })) {
				offset += position - literalPart.getFullStart();
				break;
			}

			if (nextExpressionPart != null) {
				if (intersects(position, { start: nextExpressionPart.pos, end: nextExpressionPart.end })) {
					offset += position - literalPart.getFullStart();
					break;
				}
			}

			offset += literalPart.getText().length;

			if (nextExpressionPart != null) {
				offset += this.getSubstituionId(nextExpressionPart).length;
			}
		}

		return offset;
	}

	sourceCodePositionAtOffset(offset: number): number {
		for (let i = 0; i < this.literalParts.length; i++) {
			const literalPart = this.literalParts[i];
			const nextExpressionPart = this.expressionParts[i];

			const text = literalPart.getText();
			if (offset - text.length < 0) {
				return literalPart.getStart() + offset;
			} else {
				offset -= text.length;
			}

			if (nextExpressionPart != null) {
				offset -= this.getSubstituionId(nextExpressionPart).length;
			}
		}

		return offset;
	}

	private getSubstituionId(expression: Expression): string {
		return `${expression.getStart().toString()}_${VirtualDocument.placeholderMark}`;
	}
}

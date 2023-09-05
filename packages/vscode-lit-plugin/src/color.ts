import * as vscode from "vscode";

/**
 * Rounds the provided float `number` to the provided `decimalPoints`
 * @param number
 * @param decimalPoints
 * @returns
 */
function roundFloat(number: number, decimalPoints: number): number {
	const decimal = Math.pow(10, decimalPoints);
	return Math.round(number * decimal) / decimal;
}

/**
 * Converts the hex string into our RGBA representation
 * @param rgba
 * @returns
 */
export function parseHex(hex: string): RGBA | undefined {
	// Parses "#ffffff" and "#ffffffff"
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
	if (result != null) {
		const r = parseInt(result[1], 16);
		const g = parseInt(result[2], 16);
		const b = parseInt(result[3], 16);
		const a = result[4] == null ? undefined : parseInt(result[4], 16) / 255;
		return new RGBA(r, g, b, a);
	}

	// Parses "#fff" and "#ffff"
	const shorthandResult = /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i.exec(hex);
	if (shorthandResult != null) {
		const r = parseInt(shorthandResult[1] + shorthandResult[1], 16);
		const g = parseInt(shorthandResult[2] + shorthandResult[2], 16);
		const b = parseInt(shorthandResult[3] + shorthandResult[3], 16);
		const a = shorthandResult[4] == null ? undefined : parseInt(shorthandResult[4] + shorthandResult[4], 16) / 255;
		return new RGBA(r, g, b, a);
	}

	return undefined;
}

/**
 * Adapted from: https://github.com/microsoft/vscode/blob/2ab25fade7ef55492a654389f626f613c835ad5e/src/vs/base/common/color.ts#L13
 *
 * Copyright (c) 2015 - present Microsoft Corporation
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
export class RGBA {
	/**
	 * Red: integer in [0-255]
	 */
	readonly r: number;

	/**
	 * Green: integer in [0-255]
	 */
	readonly g: number;

	/**
	 * Blue: integer in [0-255]
	 */
	readonly b: number;

	/**
	 * Alpha: float in [0-1]
	 */
	readonly a: number;

	constructor(r: number, g: number, b: number, a = 1) {
		this.r = Math.min(255, Math.max(0, r)) | 0;
		this.g = Math.min(255, Math.max(0, g)) | 0;
		this.b = Math.min(255, Math.max(0, b)) | 0;
		this.a = roundFloat(Math.max(Math.min(1, a), 0), 3);
	}

	static equals(a: RGBA, b: RGBA): boolean {
		return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
	}

	/**
	 * Converts the hex string into our RGBA representation
	 * @param rgba
	 * @returns
	 */
	static fromHex(hex: string): RGBA | undefined {
		return parseHex(hex);
	}

	/**
	 * Converts the `vscode.Color` into our RGBA representation
	 * @param rgba
	 * @returns
	 */
	static fromVSCodeColor(color: vscode.Color): RGBA {
		const r = Math.floor(color.red * 255);
		const g = Math.floor(color.green * 255);
		const b = Math.floor(color.blue * 255);
		const a = color.alpha;
		return new RGBA(r, g, b, a);
	}

	/**
	 * Converts the RGBA into the `vscode.Color` representation
	 * @param rgba
	 * @returns
	 */
	static toVSCodeColor(rgba: RGBA): vscode.Color {
		return new vscode.Color(rgba.r / 255, rgba.g / 255, rgba.b / 255, rgba.a);
	}

	/**
	 * Converts the RGBA into the `vscode.Color` representation
	 * @param rgba
	 * @returns
	 */
	toVSCodeColor(): vscode.Color {
		return RGBA.toVSCodeColor(this);
	}

	/**
	 * Returns a CSS formatted `rgba(...)` string
	 * @returns
	 */
	formatCSS(): string {
		if (this.a >= 1.0) {
			return `rgb(${this.r}, ${this.g}, ${this.b})`;
		} else {
			return `rgba(${this.r}, ${this.g}, ${this.b}, ${+this.a.toFixed(2)})`;
		}
	}

	/**
	 * Returns a CSS formatted hex string (ex: `#fff`)
	 * @returns
	 */
	formatHex(): string {
		const red = this.r.toString(16).padStart(2, "0");
		const green = this.g.toString(16).padStart(2, "0");
		const blue = this.b.toString(16).padStart(2, "0");
		const alpha = Math.floor(this.a * 255)
			.toString(16)
			.padStart(2, "0");

		return `#${red}${green}${blue}${alpha === "ff" ? "" : alpha}`;
	}
}

/**
 * Adapted from: https://github.com/microsoft/vscode/blob/2ab25fade7ef55492a654389f626f613c835ad5e/src/vs/base/common/color.ts#L48
 *
 * Copyright (c) 2015 - present Microsoft Corporation
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
export class HSLA {
	/**
	 * Hue: integer in [0, 360]
	 */
	readonly h: number;

	/**
	 * Saturation: float in [0, 1]
	 */
	readonly s: number;

	/**
	 * Luminosity: float in [0, 1]
	 */
	readonly l: number;

	/**
	 * Alpha: float in [0, 1]
	 */
	readonly a: number;

	constructor(h: number, s: number, l: number, a: number) {
		this.h = Math.max(Math.min(360, h), 0) | 0;
		this.s = roundFloat(Math.max(Math.min(1, s), 0), 3);
		this.l = roundFloat(Math.max(Math.min(1, l), 0), 3);
		this.a = roundFloat(Math.max(Math.min(1, a), 0), 3);
	}

	static equals(a: HSLA, b: HSLA): boolean {
		return a.h === b.h && a.s === b.s && a.l === b.l && a.a === b.a;
	}

	/**
	 * Converts an RGB color value to HSL. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes r, g, and b are contained in the set [0, 255] and
	 * returns h in the set [0, 360], s, and l in the set [0, 1].
	 */
	static fromRGBA(rgba: RGBA): HSLA {
		const r = rgba.r / 255;
		const g = rgba.g / 255;
		const b = rgba.b / 255;
		const a = rgba.a;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		let h = 0;
		let s = 0;
		const l = (min + max) / 2;
		const chroma = max - min;

		if (chroma > 0) {
			s = Math.min(l <= 0.5 ? chroma / (2 * l) : chroma / (2 - 2 * l), 1);

			switch (max) {
				case r:
					h = (g - b) / chroma + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / chroma + 2;
					break;
				case b:
					h = (r - g) / chroma + 4;
					break;
			}

			h *= 60;
			h = Math.round(h);
		}
		return new HSLA(h, s, l, a);
	}

	private static _hue2rgb(p: number, q: number, t: number): number {
		if (t < 0) {
			t += 1;
		}
		if (t > 1) {
			t -= 1;
		}
		if (t < 1 / 6) {
			return p + (q - p) * 6 * t;
		}
		if (t < 1 / 2) {
			return q;
		}
		if (t < 2 / 3) {
			return p + (q - p) * (2 / 3 - t) * 6;
		}
		return p;
	}

	/**
	 * Converts an HSL color value to RGB. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes h in the set [0, 360] s, and l are contained in the set [0, 1] and
	 * returns r, g, and b in the set [0, 255].
	 */
	static toRGBA(hsla: HSLA): RGBA {
		const h = hsla.h / 360;
		const { s, l, a } = hsla;
		let r: number, g: number, b: number;

		if (s === 0) {
			r = g = b = l; // achromatic
		} else {
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			r = HSLA._hue2rgb(p, q, h + 1 / 3);
			g = HSLA._hue2rgb(p, q, h);
			b = HSLA._hue2rgb(p, q, h - 1 / 3);
		}

		return new RGBA(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a);
	}

	/**
	 * Converts an HSL color value to RGB. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes h in the set [0, 360] s, and l are contained in the set [0, 1] and
	 * returns r, g, and b in the set [0, 255].
	 */
	toRGBA(): RGBA {
		return HSLA.toRGBA(this);
	}

	/**
	 * Returns a CSS formatted `hsla(...)` string
	 * @returns
	 */
	formatCSS(): string {
		// From: https://stackoverflow.com/a/19623253/4852536
		// Fails with numbers large enough or small enough to warrant scientific notation (ex: 1.23e+45)
		const toFixedTruncateZero = (x: number, fractionDigits = 2) => parseFloat(x.toFixed(fractionDigits)).toString();

		if (this.a >= 1.0) {
			return `hsl(${this.h}, ${toFixedTruncateZero(this.s * 100)}%, ${toFixedTruncateZero(this.l * 100)}%)`;
		} else {
			return `hsla(${this.h}, ${toFixedTruncateZero(this.s * 100)}%, ${toFixedTruncateZero(this.l * 100)}%, ${toFixedTruncateZero(this.a)})`;
		}
	}
}

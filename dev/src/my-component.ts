import { html, customElement, LitElement, property } from "lit-element";
import "./my-button";

/**
 * Hejsa
 */
@customElement("my-test1")
export class MyTest extends LitElement {
	/**
	 * Hejsa
	 */
	@property({ type: String }) foo: string = "hejsa";

	@property({ type: Number }) bar!: number;
}

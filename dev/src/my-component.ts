import { html, customElement, LitElement, property } from "lit-element";
import "./my-button";

/**
 * Hejsa
 */
@customElement("my-component")
export class MyTest extends LitElement {
	/**
	 * Hello, this is some documentation
	 * @attr myProp1
	 */
	myProp1: string = "foo";

	myProp2: string = "bar";

	@property({ type: Number }) bar!: number;

	static get observedAttributes() {
		return ["myProp"];
	}
}

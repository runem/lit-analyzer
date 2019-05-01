import { customElement, html, LitElement, property } from "lit-element";
import "./my-button";

export type AtSnapPosition = "top" | "bottom" | "center" | "left-top" | "left" | "left-bottom" | "right-top" | "right" | "right-bottom";

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

	@property({ type: Number }) bar!: number | { foo: string };

	//@property({ type: Object }) bar2!: string;

	//@property({ type: Object }) foo!: { hello: string };

	@property() snapPosition: AtSnapPosition = "top";

	static get properties() {
		return {
			/**
			 * Heheh
			 * @type {red|green}
			 */
			hello: { type: String }
		};
	}

	static get observedAttributes() {
		return ["myProp"];
	}
}

html`
	<button disabled="10"></button>
	<button ?disabled="${true}"></button>
`;

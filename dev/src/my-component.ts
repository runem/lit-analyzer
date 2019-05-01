import { customElement, html, LitElement, property } from "lit-element";
import "./my-button";

export type Position = 1 | 2 | 3;

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

	@property({ type: Number }) snapPosition: Position = 1;

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
	<button disabled="" @keypress="${(() => {}).bind({})}" aria-expanded="${true as boolean}"></button>

	<video width="100%"></video>

	<my-component snapPosition="2"></my-component>
`;

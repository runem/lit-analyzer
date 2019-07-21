import { LitElement, property, html } from "lit-element";
import "./my-button";

/**
 * @customElement just-testing
 * @slot hello - This is an awesome slot!
 * @slot myslot - This is a great slot!
 * @slot - This is an empty slot
 * @event my-change-event
 * @event change - Another change event
 * @attr {Number} c - An attribute from jsdoc
 */
class MyElement extends LitElement {
	set minSetter(value) {}

	static get observedAttributes() {
		return ["a", "b"];
	}

	static get properties() {
		return {
			/**
			 * This is prop1. Very exciting!
			 */
			prop1: { type: String, attribute: "title" },

			/**
			 * This is prop2, even more exciting!
			 */
			prop2: { type: Number, attribute: false },
			prop3: { type: Boolean },
			prop4: { type: Array },
			prop5: { type: Object }
		};
	}

	@property({ attribute: "my-attr-hehehe", type: String }) hehehe;

	constructor() {
		super();
		this.prop1 = "Hello World";
		this.prop2 = 5;
		this.prop3 = true;
		this.prop4 = [1, 2, 3];
		this.prop5 = { stuff: "hi", otherStuff: "wow" };
	}

	render() {
		return html`
			<style></style>
			${html`
				<my-button></my-button>
			`}
			<my-button size="large" @click="${console.log}"></my-button>

			<my-element></my-element>

			<my-test-hehe></my-test-hehe>
			<my-test-hehe></my-test-hehe>
			<just-testing></just-testing>
		`;
	}
}

window.customElements.define("my-element", MyElement);
window.customElements.define("my-test-hehe", MyElement);

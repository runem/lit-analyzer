import { customElement, property, html, LitElement, css, unsafeCSS } from "lit-element";
import "@material/mwc-button";

/**
 * This is my button
 * @event submit - This is a nice event!
 * @event change - This is a super nice event!
 */
@customElement("my-button")
export class MyButton extends LitElement {
	/**
	 * This is my size!
	 */
	@property({ type: String }) size: "small" | "medium" | "large" = "medium";

	@property({ type: Number }) text!: string;

	@property({ type: Boolean }) disabled: boolean = false;

	static get properties() {
		return {
			myProprop: {
				type: Boolean
			}
		};
	}

	static get observedAttributes() {
		return ["this-is-an-attr"];
	}

	static get styles() {
		return [
			css`
				button {
					color: red;
				}

				div {
					${unsafeCSS("color: red")};
				}
			`
		];
	}

	onClick() {
		/**
		 * Hello
		 */
		this.dispatchEvent(new CustomEvent("this-is-a-custom-event"));
	}

	render() {
		return html`
			<button @click="${this.onClick}">${this.text}</button>
			<mwc-button dense></mwc-button>

			<my-button .myProprop="${true}"></my-button>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"my-button": MyButton;
	}
}

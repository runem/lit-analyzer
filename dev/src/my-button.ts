import { customElement, property, html, LitElement, css, unsafeCSS } from "lit-element";
import "@material/mwc-button";

/**
 * This is my button
 */
@customElement("my-button")
export class MyButton extends LitElement {
	@property({ type: String }) size: "small" | "medium" | "large" = "medium";
	@property({ type: Number }) text: string = "";
	@property({ type: Boolean }) disabled: boolean = false;

	static styles = css`
		div {
			${unsafeCSS("color: red")};
		}

		my-button {
			color: red;
		}
	`;

	onClick() {}

	render() {
		return html`
			<button @click="${this.onClick}">${this.text}</button>
			<mwc-button dense></mwc-button>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"my-button": MyButton;
	}
}

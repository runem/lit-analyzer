import { customElement, property, html, LitElement } from "lit-element";

@customElement("my-button")
export class MyButton extends LitElement {
	@property({ type: String }) size!: "small" | "medium" | "large";
	@property({ type: Number }) text: string = "";
	@property({ type: Boolean }) disabled: boolean = false;

	render() {
		return html`
			<button>${this.text}</button>
		`;
	}
}

/*declare global {
    interface HTMLElementTagNameMap {
        "my-button": MyButton;
    }
}*/

import { customElement, property, html, LitElement } from "lit-element";
import { classMap } from "lit-html/directives/class-map";

@customElement("my-button")
export class MyButton extends LitElement {
	@property({ type: String }) color: "red" | "purple" | undefined;
	@property({ type: String }) text: string = "";
	@property({ type: String }) disabled: boolean = false;
	@property({ type: String }) maxlength: number | undefined;

	render() {
		return html`
			<button class="${classMap({ foo: true })}">${this.text}</button>
		`;
	}
}

/*declare global {
	interface HTMLElementTagNameMap {
		"my-button": MyButton;
	}
}*/

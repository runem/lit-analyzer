import { customElement, property, html, LitElement } from "@polymer/lit-element";
import { classMap } from "lit-html/directives/class-map";

@customElement("my-button" as any)
export class MyButton extends LitElement {
	@property({ type: String }) color: "red" | "purple" | undefined;
	@property({ type: String }) text: string = "";
	@property({ type: String }) disabled: boolean = false;

	render() {
		return html`
			<button class="${classMap({ foo: true })}">${this.text}</button>
		`;
	}
}

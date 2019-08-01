import { LitElement, html } from "lit-element";

export class MyElement extends LitElement {
	render() {
		return html`
			<my-tsconfig-element size="large"></my-tsconfig-element>
			<unknown-element globalattribute></unknown-element>
		`;
	}
}

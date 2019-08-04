import { LitElement, html, customElement } from "lit-element";
import "./my-element-2";

@customElement("my-element")
export class MyElement extends LitElement {
	render() {
		return html`
			<my-tsconfig-element size="large"></my-tsconfig-element>
			<unknown-element @heheheh="${() => {}}" globalattribute></unknown-element>
			<heheheh></heheheh>
			<input @hehehehe="${() => {}}" />
			<my-element></my-element>
			<my-element></my-element>
			<my-element></my-element>
			<my-element2 .foo="${"bar"}"></my-element2>
		`;
	}
}

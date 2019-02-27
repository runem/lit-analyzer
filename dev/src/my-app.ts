import { html, render } from "lit-html";
import "./my-button";
import "./my-element";

const myApp = (text: string, disabled: boolean) => html`
	<style>
		my-button {
			color: ${"green"};
		}
	</style>

	<div role="heading">
		<my-button disabled size="large" text="Hello"></my-button>
	</div>

	<my-element></my-element>

	<input type="email" maxlength="1" tabindex="${true ? "-1" : "0"}" />
`;

render(myApp("Hello", false), document.body);

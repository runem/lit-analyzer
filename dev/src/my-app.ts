import { html, render } from "lit-html";
import "./my-button";

const myApp = (text: string, disabled: boolean) => html`
	<style>
		my-button {
			color: ${"green"};
		}
	</style>

	<div role="heading">
		<my-button disabled size="medium" text="Hello"></my-button>
	</div>

	<input type="email" maxlength="1" tabindex="${true ? "-1" : "0"}" />
`;

render(myApp("Hello", false), document.body);

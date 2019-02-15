import { html, render } from "lit-html";
import "./my-button";

const css = css`
	#hello {
		.lol {
		}
	}

	id {
	}

	.lol {
		sldkjf {
		}

		.lol {
		}
	}
`;

const myApp = (text: string, disabled: boolean) => html`
	<style>
		.page {
			display: none;
		}

		.page[active] {
			display: block;
		}
	</style>

	<input type="sldkfjsldkjf" alt="" disabled="" accept="asdlfkjsdflkj" aria-selected="true" />

	<my-button class="" disabled="sdflksjdf"></my-button>
	<my-button size="xlarge" text="${text}" ?disabled="${disabled}"></my-button>
`;

render(myApp("Hello", false), document.body);

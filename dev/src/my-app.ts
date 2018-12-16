import { html, render } from "lit-html";
import "./my-button";

const myApp = (text: string, myNumber: number) => html`
	<my-button color="purple" @click="${console.log}" disabled text="${text}"></my-button>
`;

render(myApp("Hello", 1), document.body);

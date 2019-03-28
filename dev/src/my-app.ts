import { html, render } from "lit-html";
import "./my-element";
import "@material/mwc-button/mwc-button";
import "./my-button";

(async () => {
	await import("./my-card");
})();

const myApp = (text: string, disabled: boolean) => html`
	<style>
		my-button {
			color: ${"green"};
		}
	</style>

	<my-component bar @slo></my-component>

	<my-test1 .myProp1></my-test1>

	<video playsinline muted preload="metadata" aria-pressed aria-readonly></video>

	<input disabled .data-sdflskdjf="${12323}" type="email" .maxLength="123" .type="" role="status" .id="hejsa" .onmouseover="${() => console.log}" value="" />

	<mwc-button dense></mwc-button>

	<div role="heading" .scrollTop="${123}">
		<my-button this-is-an-attr size="${"small"}" text="123"></my-button>
	</div>

	<my-card></my-card>
	<my-element></my-element>

	<mwc-button></mwc-button>

	<my-external-tag></my-external-tag>

	<mwc-button label="" dense role="math" aria-checked="true" .accessKey="${"hejsa"}" onsubmit="" .dlfkjsdlfkjsdlfkj="${"test"}" @my-event=""></mwc-button>

	<div @change="${() => {}}" @hello="${console.log}" @test-event="${() => {}}" @loadstart="${() => {}}" @hello="${() => {}}">
		<my-element data-looolz="" onmy-event="" a b c .minSetter="${""}" .prop1="${"hello"}" my-attr-hehehe="" @change="${() => {}}" @test-event="${() => true}">
			<div slot=""></div>
			<div slot="hello"></div>
		</my-element>
	</div>

	<input .disabled="${true}" type="email" maxlength="1" tabindex="${1 === 1 ? "-1" : "0"}" />
`;

render(myApp("Hello", false), document.body);

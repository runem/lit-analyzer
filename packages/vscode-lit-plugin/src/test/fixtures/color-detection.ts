// Pretending this is the Lit html function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const css: any;

css`
	.hex {
		color: #f00; // index 0
		color: #f00f; // index 1
		color: #ff0000; // index 2
		color: #ff0000ff; // index 3
	}

	.rgb {
		color: red;
		color: rgb(0, 255, 0); // index 4
		color: rgba(0, -1, 0);
		color: rgba(0, 256, 0);
		color: rgba(0, 255, 0, 0); // index 5
		color: rgba(0, 255, 0, 0.5); // index 6
		color: rgba(0, 255, 0, 1); // index 7
		color: rgba(0, 255, 0, 1); // index 8
		color: rgba(0, 255, 0, 1); // index 9
	}

	.hsl {
		color: red;
		color: hsl(230, 100%, 50%); // index 10
		color: hsl(-1, 100%, 50%);
		color: hsl(361, 100%, 50%);
		color: hsla(230, 99.2%, 50%, 0); // index 11
		color: hsla(230, 99.9%, 50%, 0.5); // index 12
		color: hsla(230, 100%, 50%, 1); // index 13
		color: hsla(230, 100%, 50%, 1); // index 14
		color: hsl(230, 100%, 50%); // index 15
		color: hsl(230, 100.01%, 50%);
	}
`;

import test from "ava";
import { convertDenoCompilerOptions } from "../../lib/cli/compile.js";

test("drops Deno-only libs and keeps the rest", t => {
	const options = convertDenoCompilerOptions({ compilerOptions: { lib: ["deno.window", "deno.ns", "dom", "es2022"] } }, ".");
	t.deepEqual(options.lib, ["lib.dom.d.ts", "lib.es2022.d.ts"]);
});

test("falls back to dom+esnext when only Deno libs were declared", t => {
	const options = convertDenoCompilerOptions({ compilerOptions: { lib: ["deno.window", "deno.ns"] } }, ".");
	t.deepEqual(options.lib, ["lib.esnext.d.ts", "lib.dom.d.ts"]);
});

test("falls back to dom+esnext when no lib is declared", t => {
	const options = convertDenoCompilerOptions({ compilerOptions: { strict: true } }, ".");
	t.deepEqual(options.lib, ["lib.esnext.d.ts", "lib.dom.d.ts"]);
});

test("passes non-lib compiler options through", t => {
	const options = convertDenoCompilerOptions({ compilerOptions: { strict: true, experimentalDecorators: true } }, ".");
	t.is(options.strict, true);
	t.is(options.experimentalDecorators, true);
});

test("handles a missing compilerOptions field", t => {
	const options = convertDenoCompilerOptions({}, ".");
	t.deepEqual(options.lib, ["lib.esnext.d.ts", "lib.dom.d.ts"]);
});

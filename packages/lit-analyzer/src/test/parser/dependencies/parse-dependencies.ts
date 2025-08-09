import { parseAllIndirectImports } from "../../../lib/analyze/parse/parse-dependencies/parse-dependencies.js";
import { isFacadeModule } from "../../../lib/analyze/parse/parse-dependencies/visit-dependencies.js";
import { prepareAnalyzer } from "../../helpers/analyze.js";
import { tsTest } from "../../helpers/ts-test.js";

tsTest("Correctly finds all imports in a file", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "file1.ts", text: `` },
		{ fileName: "file2.ts", text: `` },
		{ fileName: "file3.ts", text: `` },
		{ fileName: "file4.ts", text: `` },
		{
			fileName: "file5.ts",
			text: `
				import "file1";
				import * as f2 from "file2";
				import { } from "file3";

				(async () => {
					await import("file4");
				})();
		`,
			entry: true
		}
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context);

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["file1.ts", "file2.ts", "file3.ts", "file4.ts", "file5.ts"]);
});

tsTest("Correctly follows all project-internal imports with (default) maxInternalDepth=Infinity", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "file1.ts", text: ` ` },
		{ fileName: "file2.ts", text: `import * from "file1"` },
		{ fileName: "file3.ts", text: `import * from "file2"` },
		{ fileName: "file4.ts", text: `import * from "file3"` },
		{ fileName: "file5.ts", text: `import * from "file4"`, entry: true }
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context);

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["file1.ts", "file2.ts", "file3.ts", "file4.ts", "file5.ts"]);
});

tsTest("Correctly follows project-internal imports with maxInternalDepth=1", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "file1.ts", text: `export class MyClass { }` },
		{ fileName: "file2.ts", text: `import * from "file1";export class MyClass { }` },
		{ fileName: "file3.ts", text: `import * from "file2";export class MyClass { }`, entry: true }
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context, { maxInternalDepth: 1 });

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["file2.ts", "file3.ts"]);
});

tsTest("Correctly follows project-internal imports with maxInternalDepth=5", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "file1.ts", text: `export class MyClass { }` },
		{ fileName: "file2.ts", text: `import * from "file1";export class MyClass { }` },
		{ fileName: "file3.ts", text: `import * from "file2";export class MyClass { }` },
		{ fileName: "file4.ts", text: `import * from "file3";export class MyClass { }` },
		{ fileName: "file5.ts", text: `import * from "file4";export class MyClass { }` },
		{ fileName: "file6.ts", text: `import * from "file5";export class MyClass { }` },
		{ fileName: "file7.ts", text: `import * from "file6";export class MyClass { }`, entry: true }
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context, { maxInternalDepth: 5 });

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["file2.ts", "file3.ts", "file4.ts", "file5.ts", "file6.ts", "file7.ts"]);
});

tsTest("Correctly follows project-external imports with maxExternalDepth=1", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "node_modules/file1.ts", text: `export class MyClass { }` },
		{ fileName: "node_modules/file2.ts", text: `import * from "./file1";export class MyClass { }` },
		{ fileName: "node_modules/file3.ts", text: `import * from "./file2";export class MyClass { }`, entry: true }
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context, { maxExternalDepth: 1 });

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["node_modules/file2.ts", "node_modules/file3.ts"]);
});

tsTest("Correctly follows project-external imports with maxExternalDepth=5", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "node_modules/file1.ts", text: `export class MyClass { }` },
		{ fileName: "node_modules/file2.ts", text: `import * from "./file1";export class MyClass { }` },
		{ fileName: "node_modules/file3.ts", text: `import * from "./file2";export class MyClass { }` },
		{ fileName: "node_modules/file4.ts", text: `import * from "./file3";export class MyClass { }` },
		{ fileName: "node_modules/file5.ts", text: `import * from "./file4";export class MyClass { }` },
		{ fileName: "node_modules/file6.ts", text: `import * from "./file5";export class MyClass { }` },
		{ fileName: "node_modules/file7.ts", text: `import * from "./file6";export class MyClass { }`, entry: true }
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context, { maxExternalDepth: 5 });

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, [
		"node_modules/file2.ts",
		"node_modules/file3.ts",
		"node_modules/file4.ts",
		"node_modules/file5.ts",
		"node_modules/file6.ts",
		"node_modules/file7.ts"
	]);
});

tsTest("Correctly resets depth when going from internal to external module with maxInternalDepth=1", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "node_modules/file1.ts", text: `export class MyClass { }` },
		{ fileName: "node_modules/file2.ts", text: `import * from "./file1";export class MyClass { }` },
		{ fileName: "file3.ts", text: `import * from "./node_modules/file2";export class MyClass { }`, entry: true }
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context, { maxInternalDepth: 1 });

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();
	t.deepEqual(sortedFileNames, ["file3.ts", "node_modules/file2.ts"]);
});

tsTest("Correctly resets depth when going from internal to external module with maxInternalDepth=2", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "node_modules/file1.ts", text: `export class MyClass { }` },
		{ fileName: "node_modules/file2.ts", text: `import * from "./file1";export class MyClass { }` },
		{ fileName: "file3.ts", text: `import * from "./node_modules/file2";export class MyClass { }` },
		{ fileName: "file4.ts", text: `import * from "./file3";export class MyClass { }`, entry: true }
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context, { maxInternalDepth: 2 });

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["file3.ts", "file4.ts", "node_modules/file2.ts"]);
});

tsTest("Correctly resets depth when going from internal to external module when first external module is a facade module", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "node_modules/file1.ts", text: `export class MyClass { }` },
		{ fileName: "node_modules/file2.ts", text: `import * from "./file1";export class MyClass { }` },
		{ fileName: "node_modules/file3.ts", text: `import * from "./file2"` },
		{ fileName: "file4.ts", text: `import * from "./node_modules/file3";export class MyClass { }`, entry: true }
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context, { maxInternalDepth: 1 });

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["file4.ts", "node_modules/file2.ts", "node_modules/file3.ts"]);
});

tsTest("Correctly follows modules when going from internal to external module when second external module is a facade module", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "node_modules/file1.ts", text: `export class MyClass { }` },
		{ fileName: "node_modules/file2.ts", text: `import * from "./file1";export class MyClass { }` },
		{ fileName: "node_modules/file3.ts", text: `import * from "./file2"` },
		{ fileName: "node_modules/file4.ts", text: `import * from "./file3";export class MyClass { }` },
		{ fileName: "file5.ts", text: `import * from "./node_modules/file4";export class MyClass { }`, entry: true }
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context, { maxInternalDepth: 1, maxExternalDepth: 2 });

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["file5.ts", "node_modules/file2.ts", "node_modules/file3.ts", "node_modules/file4.ts"]);
});

tsTest("Correctly handles recursive imports", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "file1.ts", text: `import * from "file3"` },
		{ fileName: "file2.ts", text: `import * from "file1"` },
		{ fileName: "file3.ts", text: `import * from "file2"`, entry: true }
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context);

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["file1.ts", "file2.ts", "file3.ts"]);
});

tsTest("Correctly follows both exports and imports", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "file1.ts", text: `` },
		{ fileName: "file2.ts", text: `export * from "file1"` },
		{ fileName: "file3.ts", text: `import * from "file2"`, entry: true }
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context);

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["file1.ts", "file2.ts", "file3.ts"]);
});

tsTest("Correctly identifies facade modules", t => {
	const { program, context } = prepareAnalyzer([
		{ fileName: "file1.ts", text: `export class MyClass { }` },
		{ fileName: "file2.ts", text: `export * from "file1";` },
		{ fileName: "file3.ts", text: `import * from "file1";` },
		{ fileName: "file4.ts", text: `import * from "file1"; export * from "file2";` },
		{ fileName: "file5.ts", text: `import * from "file2"; export class MyClass { }"` }
	]);

	t.is(isFacadeModule(program.getSourceFile("file1.ts")!, context.ts), false);
	t.is(isFacadeModule(program.getSourceFile("file2.ts")!, context.ts), true);
	t.is(isFacadeModule(program.getSourceFile("file3.ts")!, context.ts), true);
	t.is(isFacadeModule(program.getSourceFile("file4.ts")!, context.ts), true);
	t.is(isFacadeModule(program.getSourceFile("file5.ts")!, context.ts), false);
});

tsTest("Correctly follows facade modules one level", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "file1.ts", text: `export class MyClass { }` },
		{ fileName: "file2.ts", text: `import * from "file1"; export class MyClass { }` },
		{ fileName: "file3.ts", text: `import * from "file2";` },
		{ fileName: "file4.ts", text: `import * from "file3"; export class MyClass { }"`, entry: true }
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context, { maxInternalDepth: 1 });

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["file2.ts", "file3.ts", "file4.ts"]);
});

tsTest("Correctly follows facade modules multiple levels", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "file0.ts", text: `export class MyClass { }` },
		{ fileName: "file1.ts", text: `export * from "file0"; export class MyClass { }` },
		{ fileName: "file2.ts", text: `export * from "file1";` },
		{ fileName: "file3.ts", text: `import * from "file2";` },
		{ fileName: "file4.ts", text: `import * from "file3"; export class MyClass { }"`, entry: true }
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context, { maxInternalDepth: 1 });

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["file1.ts", "file2.ts", "file3.ts", "file4.ts"]);
});

tsTest("Ignores type-only imports in a file", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "file1.ts", text: `` },
		{
			fileName: "file2.ts",
			text: `
				import type { MyElement } from "./file1";
			`,
			entry: true
		}
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context);

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["file2.ts"]);
});
tsTest("Ignores imports with type-only bindings in a file", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "file1.ts", text: `` },
		{
			fileName: "file2.ts",
			text: `
				import { type MyElement } from "./file1";
			`,
			entry: true
		}
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context);

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["file2.ts"]);
});

tsTest("Ignores type-only exports in a file", t => {
	const { sourceFile, context } = prepareAnalyzer([
		{ fileName: "file1.ts", text: `` },
		{
			fileName: "file2.ts",
			text: `
				export type { MyElement } from "./file1";
			`,
			entry: true
		}
	]);

	const dependencies = parseAllIndirectImports(sourceFile, context);

	const sortedFileNames = Array.from(dependencies)
		.map(file => file.fileName)
		.sort();

	t.deepEqual(sortedFileNames, ["file2.ts"]);
});

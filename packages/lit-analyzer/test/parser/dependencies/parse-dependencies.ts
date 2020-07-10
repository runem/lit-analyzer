import { parseAllIndirectImports } from "../../../src/analyze/parse/parse-dependencies/parse-dependencies";
import { isFacadeModule } from "../../../src/analyze/parse/parse-dependencies/visit-dependencies";
import { prepareAnalyzer } from "../../helpers/analyze";
import { tsTest } from "../../helpers/ts-test";

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

tsTest("Correctly follows all project-internal imports", t => {
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

import { parseAllIndirectImports } from "../../../src/analyze/parse/parse-dependencies/parse-dependencies";
import { prepareAnalyzer } from "../../helpers/analyze";
import { tsTest } from "../../helpers/ts-test";

tsTest("Correctly finds all indirect imports in a file", t => {
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

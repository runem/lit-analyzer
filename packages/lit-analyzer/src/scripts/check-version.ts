import * as fs from "fs";
import * as path from "path";

const pkg = require("../package.json");
const { version } = pkg;

const constantsPath = path.resolve("src/lib/analyze/constants.ts");
const constantsSource = fs.readFileSync(constantsPath, "utf-8");

if (!constantsSource.includes(`"${version}"`)) {
	// eslint-disable-next-line no-console
	console.log(`\nExpected src/lib/analyze/constants.ts to contain the current version "${version}"`);
	process.exit(1);
}

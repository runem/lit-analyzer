import { LitAnalyzerRuleName, LitAnalyzerRules } from "../analyze/lit-analyzer-config";
import { analyzeCommand } from "./analyze-command";
import { LitAnalyzerCliConfig } from "./lit-analyzer-cli-config";
import { parseCliArguments } from "./parse-cli-arguments";
import { camelToDashCase } from "./util";

const DEFAULT_GLOB = "src/**/*.{js,jsx,ts,tsx}";

const DEFAULT_CONFIG: LitAnalyzerCliConfig = {
	noColor: false,
	quiet: false,
	maxWarnings: 0,
	debug: false,
	help: false,
	failFast: false,
	format: "code",
	strict: false,
	rules: {}
};

/**
 * The main function of the cli.
 */
export async function cli() {
	const { _: args, ...rest } = parseCliArguments(process.argv.slice(2));
	const globs = args.length > 0 ? args : [DEFAULT_GLOB];

	const config: LitAnalyzerCliConfig = { ...DEFAULT_CONFIG, ...rest };

	if (config.debug) {
		// eslint-disable-next-line no-console
		console.log("CLI Config", config);
	}

	// Always convert "rules" to "dash case" because "rules" expects it.
	config.rules = Object.entries(config.rules || {}).reduce(
		(acc, [k, v]) => {
			acc[camelToDashCase(k) as LitAnalyzerRuleName] = v;
			return acc;
		},
		{} as LitAnalyzerRules
	);

	if (config.help) {
		// eslint-disable-next-line no-console
		console.log(`

  Usage
    lit-analyzer [<file|directory|glob>]
    
  Options
    --help                Print this message.
    --format FORMAT       Specify output format. The possible options are:
                            o code                Highlight problems in the code (default)
                            o list                Short and precise list of problems
                            o markdown            Markdown format
    --noColor             Print results without color
    --outFile FILE        Emit all output to a single file
    --maxWarnings NUMBER  Fail only when the number of warnings is larger than this number
    --quiet               Report only errors and not warnings
    --failFast            Exit the process right after the first problem has been found
    --strict              Enable strict mode. This change the default ruleset.
    --rules.___ SEVERITY  Enable or disable a rule (example: --rules.no-unknown-tag-name off). 
                          Severity can be: "off" | "warn" | "error". The possible rules are:
                          o  no-unknown-tag-name
                          o  no-missing-import
                          o  no-unclosed-tag
                          o  no-unknown-attribute
                          o  no-unknown-property
                          o  no-unknown-event
                          o  no-unknown-slot
                          o  no-invalid-boolean-binding
                          o  no-expressionless-property-binding
                          o  no-noncallable-event-binding
                          o  no-boolean-in-attribute-binding
                          o  no-complex-attribute-binding
                          o  no-nullable-attribute-binding
                          o  no-incompatible-type-binding
                          o  no-invalid-directive-binding
                          o  no-incompatible-property-type
                          o  no-unknown-property-converter
                          o  no-invalid-attribute-name
                          o  no-invalid-tag-name
                          o  no-invalid-css
    
  Examples
    lit-analyzer src
    lit-analyzer "src/**/*.{js,ts}"
    lit-analyzer my-element.js
		`);
		return;
	}

	const success = await analyzeCommand(globs, config);
	process.exit(success ? 0 : 1);
}

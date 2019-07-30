## Configuring the CLI

You can configure the CLI with arguments:

```bash
lit-analyzer --strict --rules.no-unknown-tag-name off --format markdown
```

**Note:** You can also configure the CLI using a `tsconfig.json` file (see [ts-lit-plugin](link-coming-soon)).

### Available arguments

| Option | Description | Type | Default |
| :----- | ----------- | ---- | ------- |
| `--help` | Print help message | `boolean` | |
| `--rules.rule-name` | Enable or disable rules (example: --rules.no-unknown-tag-name off). Severity can be "off" \| "warn" \| "error". See a list of rules [here](link-coming-soon). | `{"rule-name": "off" \| "warn" \| "error"}` |  |
| `--strict` | Enable strict mode. This changes the default ruleset | `boolean` | |
| `--format` | Change the format of how diagnostics are reported | `code` \| `list` \| `markdown` | code |
| `--maxWarnings` | Fail only when the number of warnings is larger than this number | `number` | 0 |
| `--outFile` | Emit all output to a single file  | `filePath` |  |
| `--quiet` | Report only errors and not warnings | `boolean` |  |
| `--failFast` | Exit the process right after the first problem has been found | `boolean` | |
| `--debug` | Enable CLI debug mode | `boolean` |  |

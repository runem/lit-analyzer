/**
 * Highlights some text
 * @param text
 */
export function markdownHighlight(text: string): string {
	return `\`${text}\``;
}

/**
 * Returns a markdown header with a specific level
 * @param level
 * @param title
 */
export function markdownHeader(level: number, title: string): string {
	return `${"#".repeat(level)} ${title}`;
}

export interface MarkdownTableOptions {
	removeEmptyColumns: boolean;
	minCellWidth: number;
	maxCellWidth: number;
	cellPadding: number;
}

const DEFAULT_MARKDOWN_TABLE_OPTIONS: MarkdownTableOptions = {
	removeEmptyColumns: true,
	minCellWidth: 3,
	maxCellWidth: 50,
	cellPadding: 1
};

/**
 * Returns a markdown table representation of the rows.
 * Strips unused columns.
 * @param rows
 * @param options
 */
export function markdownTable(rows: string[][], options: Partial<MarkdownTableOptions> = {}): string {
	// Constants for pretty printing the markdown tables
	const MIN_CELL_WIDTH = options.minCellWidth || DEFAULT_MARKDOWN_TABLE_OPTIONS.minCellWidth;
	const MAX_CELL_WIDTH = options.maxCellWidth || DEFAULT_MARKDOWN_TABLE_OPTIONS.maxCellWidth;
	const CELL_PADDING = options.cellPadding || DEFAULT_MARKDOWN_TABLE_OPTIONS.cellPadding;

	// Count the number of columns
	let columnCount = Math.max(...rows.map(r => r.length));

	if (options.removeEmptyColumns) {
		// Create a boolean array where each entry tells if a column is used or not (excluding the header)
		const emptyColumns = Array(columnCount)
			.fill(false)
			.map((b, i) => i !== 0 && rows.slice(1).find(r => r[i] != null && r[i].length > 0) == null);

		// Remove unused columns if necessary
		if (emptyColumns.includes(true)) {
			// Filter out the unused columns in each row
			rows = rows.map(row => row.filter((column, i) => !emptyColumns[i]));

			// Adjust the column count
			columnCount = Math.max(...rows.map(r => r.length));
		}
	}

	// Escape all cells in the markdown output
	rows = rows.map(r => r.map(markdownEscapeTableCell));

	// Create a boolean array where each entry corresponds to the preferred column width.
	// This is done by taking the largest width of all cells in each column.
	const columnWidths = Array(columnCount)
		.fill(0)
		.map((c, i) => Math.min(MAX_CELL_WIDTH, Math.max(MIN_CELL_WIDTH, ...rows.map(r => (r[i] || "").length)) + CELL_PADDING * 2));

	// Build up the table
	return `
|${rows[0].map((r, i) => fillWidth(r, columnWidths[i], CELL_PADDING)).join("|")}|
|${columnWidths.map(c => "-".repeat(c)).join("|")}|
${rows
	.slice(1)
	.map(r => `|${r.map((r, i) => fillWidth(r, columnWidths[i], CELL_PADDING)).join("|")}|`)
	.join("\n")}
`;
}

/**
 * Escape a text so it can be used in a markdown table
 * @param text
 */
function markdownEscapeTableCell(text: string): string {
	return text.replace(/\n/g, "<br />").replace(/\|/g, "\\|");
}

/**
 * Creates padding around some text with a target width.
 * @param text
 * @param width
 * @param paddingStart
 */
function fillWidth(text: string, width: number, paddingStart: number): string {
	return " ".repeat(paddingStart) + text + " ".repeat(Math.max(1, width - text.length - paddingStart));
}

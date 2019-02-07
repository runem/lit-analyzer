import { SourceFile } from "typescript";

/**
 * Yields source files that have changed since last time this function was called.
 */
export function changedSourceFileIterator() {
	const sourceFileCache = new WeakSet<SourceFile>();

	return function*(sourceFiles: ReadonlyArray<SourceFile>): Iterable<SourceFile> {
		for (const sourceFile of sourceFiles) {
			if (!sourceFileCache.has(sourceFile)) {
				sourceFileCache.add(sourceFile);
				yield sourceFile;
			}
		}
	};
}

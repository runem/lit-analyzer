export interface Range {
	start: number;
	end: number;
}

// Offsets and positions
export type DocumentOffset = number;

export type SourceFilePosition = number;

/*export type DocumentOffset = number & { _documentOffset: void };

export type SourceFilePosition = number & { _sourceFilePosition: void };*/

/*export function makeDocumentOffset(offset: number): DocumentOffset {
	return offset as DocumentOffset;
}

export function makeDocumentPosition(position: number): SourceFilePosition {
	return position as SourceFilePosition;
}*/

// Ranges
export type DocumentRange = { start: DocumentOffset; end: DocumentOffset } & { _brand?: "document" };

export type SourceFileRange = { start: SourceFilePosition; end: SourceFilePosition } & { _brand?: "sourcefile" };

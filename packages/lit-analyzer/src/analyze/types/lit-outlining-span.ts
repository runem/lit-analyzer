import { SourceFileRange } from "./range";

export enum LitOutliningSpanKind {
	Comment = "comment",
	Region = "region",
	Code = "code",
	Imports = "imports"
}

export interface LitOutliningSpan {
	location: SourceFileRange;
	bannerText: string;
	autoCollapse?: boolean;
	kind: LitOutliningSpanKind;
}

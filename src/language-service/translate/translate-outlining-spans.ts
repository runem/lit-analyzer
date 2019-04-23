import { LitOutliningSpan } from "../../lit-analyzer/types/lit-outlining-span";
import { translateRange } from "./translate-range";

export function translateOutliningSpans(outliningSpans: LitOutliningSpan[]): ts.OutliningSpan[] {
	return outliningSpans.map(outliningSpan => translateOutliningSpan(outliningSpan));
}

function translateOutliningSpan(outliningSpan: LitOutliningSpan): ts.OutliningSpan {
	const span = translateRange(outliningSpan.location);

	return {
		autoCollapse: outliningSpan.autoCollapse || false,
		textSpan: span,
		hintSpan: span,
		kind: (outliningSpan.kind as unknown) as ts.OutliningSpanKind,
		bannerText: outliningSpan.bannerText
	};
}
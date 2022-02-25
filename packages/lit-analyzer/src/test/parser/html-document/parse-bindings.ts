import {
	HtmlNodeAttrAssignmentKind,
	IHtmlNodeAttrAssignmentMixed,
	IHtmlNodeAttrAssignmentString
} from "../../../lib/analyze/types/html-node/html-node-attr-assignment-types.js";
import { parseHtml } from "../../helpers/parse-html.js";
import { tsTest } from "../../helpers/ts-test.js";

// https://github.com/runem/lit-analyzer/issues/44
tsTest("Correctly parses binding without a missing start quote", t => {
	const res = parseHtml('<button @tap=${console.log}"></button>');
	const attr = res.findAttr(attr => attr.name === "tap")!;
	const assignment = attr.assignment!;

	t.is(assignment.kind, HtmlNodeAttrAssignmentKind.MIXED);
	t.is(typeof (assignment as IHtmlNodeAttrAssignmentMixed).values[0], "object");
	t.is((assignment as IHtmlNodeAttrAssignmentMixed).values[1], '"');
});

tsTest("Parses element binding", t => {
	const res = parseHtml("<input ${ref(testRef)} />");
	const attr = res.findAttr(attr => attr.name.startsWith("_"))!;
	t.is(attr.assignment!.kind, HtmlNodeAttrAssignmentKind.ELEMENT_EXPRESSION);
});

tsTest("Parses multiple element bindings", t => {
	const res = parseHtml("<input ${x} ${y}/>");
	const input = res.rootNodes[0];
	// Make sure we have two attributes even though the expression
	// length is the same
	t.is(input.attributes.length, 2);
});

tsTest("Parses more than 10 element bindings", t => {
	const res = parseHtml("<input ${a} ${b} ${c} ${d} ${e} ${f} ${g} ${h} ${i} ${j} ${k}/>");
	const input = res.rootNodes[0];
	t.is(input.attributes.length, 11);
	t.is(input.attributes[10].assignment!.kind, HtmlNodeAttrAssignmentKind.ELEMENT_EXPRESSION);
});

tsTest("Correctly parses binding with no quotes", t => {
	const res = parseHtml('<input value=${"text"} />');
	const attr = res.findAttr(attr => attr.name === "value")!;
	t.is(attr.assignment!.kind, HtmlNodeAttrAssignmentKind.EXPRESSION);
});

tsTest("Correctly parses binding with no expression and no quotes", t => {
	const res = parseHtml("<input value=text />");
	const attr = res.findAttr(attr => attr.name === "value")!;
	t.is(attr.assignment!.kind, HtmlNodeAttrAssignmentKind.STRING);
	t.is((attr.assignment as IHtmlNodeAttrAssignmentString).value, "text");
});

tsTest("Correctly parses binding with single quotes", t => {
	const res = parseHtml("<input value='text' />");
	const attr = res.findAttr(attr => attr.name === "value")!;
	t.is(attr.assignment!.kind, HtmlNodeAttrAssignmentKind.STRING);
});

tsTest("Correctly parses boolean binding", t => {
	const res = parseHtml("<input required />");
	const attr = res.findAttr(attr => attr.name === "required")!;
	t.is(attr.assignment!.kind, HtmlNodeAttrAssignmentKind.BOOLEAN);
});

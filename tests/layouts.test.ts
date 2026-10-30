import test from "node:test";
import assert from "node:assert/strict";
import { fixture } from "./fixture";
import { DESIGNS, documentInk } from "../src/lib/document-designs";
import { brandingSchema } from "../src/lib/validation";
import { draftKey } from "../src/lib/editor-state";
test("all six implemented layouts validate without changing legacy identifiers",()=>{
 for(const design of DESIGNS) assert.equal(brandingSchema.safeParse({...fixture().branding,template:design.id}).success,true);
 assert.equal(brandingSchema.safeParse({...fixture().branding,template:"uploaded-reference"}).success,false);
});
test("saving metadata alone does not mark content dirty; changing layout preserves text",()=>{
 const doc=fixture().document!;const baseline=draftKey(doc);
 assert.equal(draftKey({...doc,id:"other",status:"generated",updated_at:"later"}),baseline);
 const changed={...doc,visual_template:"geometrico" as const};
 assert.notEqual(draftKey(changed),baseline);assert.equal(changed.content,doc.content);
 assert.equal(draftKey({...changed,visual_template:undefined}),draftKey({...doc,visual_template:undefined}));
});
test("very pale colors retain readable document headings on white paper",()=>{
 assert.equal(documentInk("#ffffff"),"#303c36");assert.equal(documentInk("#f8e9de"),"#303c36");assert.equal(documentInk("#6a2d42"),"#6a2d42");
});

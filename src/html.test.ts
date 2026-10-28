import { test } from "node:test";
import assert from "node:assert/strict";
import { html } from "./html.js";

test("normaler Text bleibt gleich", () => {
    assert.equal(html("Abgabe Übungsblatt 2"), "Abgabe Übungsblatt 2");
});

test("Script aus einer Mail wird unschädlich gemacht (XSS)", () => {
    assert.equal(
        html('<script>alert("hack")</script>'),
        "&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;"
    );
});

test("& wird nur einmal ersetzt", () => {
    assert.equal(html("Signale & Systeme <1>"), "Signale &amp; Systeme &lt;1&gt;");
});

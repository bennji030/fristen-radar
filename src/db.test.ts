import { test } from "node:test";
import assert from "node:assert/strict";
import { datenbankOeffnen, kommendeFristen } from "./db.js";

// Jeder Test bekommt eine frische Datenbank im Arbeitsspeicher (die echte fristen.db wird nicht angefasst)
function testDatenbank() {
    return datenbankOeffnen(":memory:");
}

const einfuegen = `INSERT OR IGNORE INTO fristen (titel, datum, kurs, quelle) VALUES (?, ?, ?, ?)`;

test("vergangene Fristen werden nicht angezeigt", () => {
    const db = testDatenbank();
    db.prepare(einfuegen).run("Alte Abgabe", "2000-01-01", "SuS", "test.txt");
    db.prepare(einfuegen).run("Neue Abgabe", "2999-01-01", "SuS", "test.txt");

    const fristen = kommendeFristen(db);

    assert.equal(fristen.length, 1);
    assert.equal(fristen[0]?.titel, "Neue Abgabe");
});

test("Fristen sind nach Datum sortiert, nicht nach Reihenfolge beim Einfügen", () => {
    const db = testDatenbank();
    db.prepare(einfuegen).run("Später", "2999-12-01", "SuS", "test.txt");
    db.prepare(einfuegen).run("Früher", "2999-02-01", "SuS", "test.txt");

    const titel = kommendeFristen(db).map((f) => f.titel);

    assert.deepEqual(titel, ["Früher", "Später"]);
});

test("Datum kommt im deutschen Format zurück", () => {
    const db = testDatenbank();
    db.prepare(einfuegen).run("Klausur", "2999-02-15", "SuS", "test.txt");

    assert.equal(kommendeFristen(db)[0]?.datum_de, "15.02.2999");
});

test("gleiche Frist wird nur einmal gespeichert (UNIQUE)", () => {
    const db = testDatenbank();
    db.prepare(einfuegen).run("Klausur", "2999-02-15", "SuS", "mail1.txt");
    db.prepare(einfuegen).run("Klausur", "2999-02-15", "SuS", "mail2.txt");

    assert.equal(kommendeFristen(db).length, 1);
});

test("eine Mail kann nur einmal als verarbeitet gemerkt werden", () => {
    const db = testDatenbank();
    const merken = db.prepare(`INSERT INTO verarbeitet (datei) VALUES (?)`);
    merken.run("mail1.txt");

    assert.throws(() => merken.run("mail1.txt"));
});

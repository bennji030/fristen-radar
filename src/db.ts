import { DatabaseSync } from "node:sqlite";

export const db = new DatabaseSync("fristen.db");


// .exec führt sql befehl aus -> öffne fristen falls exisitert sonst erstell ein neue datei mit diesen Vorgaben für die Tabelle
db.exec(`
    CREATE TABLE IF NOT EXISTS fristen (
        id INTEGER PRIMARY KEY,
        titel TEXT NOT NULL,
        datum TEXT NOT NULL,
        kurs TEXT NOT NULL,
        quelle TEXT NOT NULL,
        UNIQUE (titel, datum, kurs)
    )
`);

// Merkt sich welche Mails schon bei Claude waren (Dateiname reicht, darf nur einmal vorkommen)
db.exec(`
    CREATE TABLE IF NOT EXISTS verarbeitet (
        datei TEXT PRIMARY KEY
    )
`);
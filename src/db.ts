import { DatabaseSync } from "node:sqlite";

// Öffnet die Datenbank und legt die Tabellen an (Pfad als Parameter, damit Tests eine eigene Datenbank im Arbeitsspeicher nehmen können)
export function datenbankOeffnen(pfad: string): DatabaseSync {
    const db = new DatabaseSync(pfad);

    // exec führt den SQL Befehl aus (IF NOT EXISTS: Tabelle wird nur angelegt, wenn es sie noch nicht gibt)
    // UNIQUE verhindert, dass dieselbe Frist aus mehreren Mails doppelt drin steht
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

    return db;
}


export type FristZeile = {
    datum_de: string;
    kurs: string;
    titel: string;
};

// Alle Fristen ab heute, nach Datum sortiert (Datum gleich in deutschem Format)
export function kommendeFristen(db: DatabaseSync): FristZeile[] {
    return db.prepare(`
        SELECT strftime('%d.%m.%Y', datum) AS datum_de, kurs, titel
        FROM fristen
        WHERE datum >= date('now')
        ORDER BY datum
    `).all() as FristZeile[];
}

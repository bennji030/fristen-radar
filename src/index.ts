// aus db.ts: Datenbank öffnen und kommende Fristen abfragen
import { datenbankOeffnen, kommendeFristen } from "./db.js";
// .js obwohl die Datei .ts heißt, weil daraus nach dem Kompilieren eine .js wird (sonst findet Node sie nicht)
import { mailsLesen } from "./mails.js";
// Anthropic SDK für die Verbindung zu Claude
import Anthropic from "@anthropic-ai/sdk";
// Zod prüft, ob Claudes Antwort die richtige Form hat
import { z } from "zod";
// macht aus dem Zod Schema das Format, das die API versteht
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

// So sieht eine Frist im Programm aus (in der Datenbank ist das Datum nur Text)
type Frist = {
    titel: string;
    datum: Date;
    kurs: string;
};

// Schema, in dem Claude antworten muss (describe sagt ihm zusätzlich, wie das Datum aussehen soll)
const FristSchema = z.object({
    titel: z.string(),
    datum: z.string().describe("Datum in Format JJJJ-MM-TT"),
    kurs: z.string()
});

// Claude antwortet mit einem Objekt, darin steckt die Liste mit allen Fristen
const AntwortSchema = z.object({
    fristen: z.array(FristSchema)
});

// Öffnet die Datenbank (beim ersten Start wird die Datei neu angelegt)
const db = datenbankOeffnen("fristen.db");

// Verbindung zu Claude (den API Key holt sich das SDK selbst aus der .env)
const client = new Anthropic();


// Liest alle Mails aus dem Ordner (zum Testen "beispiel-mails", sonst "mails")
const mails = await mailsLesen("mails");


// Prepared Statement: die ? werden erst später sicher eingesetzt, dadurch keine SQL Injection
// INSERT OR IGNORE überspringt Fristen, die es schon gibt (wegen UNIQUE in der Tabelle)
const einfuegen = db.prepare(`
    INSERT OR IGNORE INTO fristen (titel, datum, kurs, quelle)
    VALUES (?, ?, ?, ?)
`);

// Schaut nach ob die Mail schon verarbeitet wurde bzw. merkt sie sich danach (damit Claude jede Mail nur einmal bekommt)
const schonVerarbeitet = db.prepare(`SELECT datei FROM verarbeitet WHERE datei = ?`);
const alsVerarbeitetMerken = db.prepare(`INSERT INTO verarbeitet (datei) VALUES (?)`);

// Jede Mail wird einzeln an Claude geschickt (ein Aufruf pro Mail)
for (const mail of mails) {
    // Schon verarbeitete Mails überspringen (spart Geld und verhindert doppelte Fristen)
    if (schonVerarbeitet.get(mail.datei)) {
        console.log(`${mail.datei} schon verarbeitet, wird übersprungen`);
        continue;                                                                                               // springt direkt zur nächsten Mail
    }

    console.log(`\n--- ${mail.datei} ---`);                                                                    // \n für Leerzeile, damit man die Mails besser auseinanderhält

    // Schickt die Mail an Claude, die Antwort kommt direkt im Format vom AntwortSchema zurück (parse prüft das mit Zod)
    // Mit einem kleineren Modell (z.B. Haiku) wäre es günstiger, Opus ist aber genauer
    const antwort = await client.messages.parse({
        model: "claude-opus-5-5",
        max_tokens: 16000,
        messages: [
            { role: "user", content: `Finde alle Fristen in dieser Mail. Relative Angaben wie "morgen" rechnest du vom Datum der Mail aus.\n${mail.text}` }     // Hinweis wegen "morgen" (Claude kennt sonst das Datum nicht)
        ],
        output_config: {
            format: zodOutputFormat(AntwortSchema)
        }
    });


    if (!antwort.parsed_output) {                                                                               // Falls die Antwort nicht zum Schema passt
        console.log("Claude hat keine gültige Antwort geliefert");
    } else {                                                                                                    // map macht aus jeder Frist der Antwort ein Frist Objekt
        const fristen: Frist[] = antwort.parsed_output.fristen.map((f) => ({
            titel: f.titel,
            datum: new Date(f.datum),                                                                           // new Date macht aus dem Text (JJJJ-MM-TT) ein richtiges Datum
            kurs: f.kurs
        }));

        // Gibt jede Frist in der Konsole aus, das Datum im deutschen Format statt ISO
        for (const frist of fristen) {
            console.log(`${frist.kurs}: ${frist.titel} bis ${frist.datum.toLocaleDateString("de-DE")}`);
        }

        // Speichert jede Frist in der Datenbank (Datum als ISO Text, Dateiname als Quelle)
        for (const f of antwort.parsed_output.fristen) {
            einfuegen.run(f.titel, f.datum, f.kurs, mail.datei);
        }

        // Erst hier merken (nur wenn Claude eine gültige Antwort hatte, sonst nächstes Mal neuer Versuch)
        alsVerarbeitetMerken.run(mail.datei);
    }
}

// Alle kommenden Fristen sortiert aus der Datenbank holen (Abfrage steht jetzt in db.ts)
const kommende = kommendeFristen(db);

console.log("\n=== Kommende Fristen ===");
for (const f of kommende) {
    console.log(`${f.datum_de}  ${f.kurs}: ${f.titel}`);
}

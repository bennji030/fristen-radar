// importiert Anthropic API
import Anthropic from "@anthropic-ai/sdk";
// Importiert Zod für die Verabeitung der Claude Antowort in die richtige Form
import { z } from "zod";
// Übersetzt Zod Schema in die Antwort die Api versteht
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
type Pruefungsform = "schriftlich" | "mündlich" | "portfolio";

type Frist = {
    titel: string;
    datum: Date;
    kurs: string;
    pruefungsform?: Pruefungsform
};

// Vorgegebens Schema für Claude durch Zod
const FristSchema = z.object({
    titel: z.string(),
    datum: z.string().describe("Datum in Format JJJJ-MM-TT"),
    kurs: z.string()
});

// Claude antwortet mit einem Objekt, darin eine Liste mit Fristen
const AntwortSchema = z.object({
    fristen: z.array(FristSchema)
});

const beispiel: Frist = {
    titel: "Prüfungsanmeldung",
    datum: new Date("2026-11-22"),
    kurs: "SWTPP",
    pruefungsform: "portfolio"    
};

let formText = "";
if (beispiel.pruefungsform) {
    formText = ` (${beispiel.pruefungsform})`;
}

console.log(`${beispiel.kurs}${formText}: ${beispiel.titel} bis ${beispiel.datum.toLocaleDateString("de-DE")}`);



// Erstellt durch einen Client die Verbindung zu Claude
const client = new Anthropic();


// Beispiel Email
const mailText = `
Liebe Studierende,
die Anmeldung zur Klausur "Signale und Systeme" ist vom 02.11. bis 16.11.2026 in MOSES möglich.
Die Abgabe des 2. Übungsblatts ist am 09.11.2026 um 23:59 Uhr.
Viele Grüße, Ihr SuS-Team
`;

// Schickt die Anfrage mit Spezifikationen (Kann man auch auf ein billigers Modell stellen, z.b HAIKU was etwas 40mal billiger ist als OPUS)
// Schickt die Mail an Claude, Antwort kommt direkt im Format vom AntwortSchema zurück (parse prüft das mit Zod)
const antwort = await client.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    messages: [
        { role: "user", content: `Finde alle Fristen in dieser Mail:\n${mailText}` }
    ],
    output_config: {
        format: zodOutputFormat(AntwortSchema)
    }
});


if (!antwort.parsed_output) {                                                                                   // Falls Antwort nciht dem Schema entspricht
    console.log("Claude hat keine gültige Antwort geliefert");
} else {                                                                                                        // Die Liste aus Fristen wird durch Map in viele einzelne Listen geteilt in dem vorgegeben Stil
const fristen: Frist[] = antwort.parsed_output.fristen.map((f) => ({                                            
        titel: f.titel,
        datum: new Date(f.datum),                                                                               // new Date macht aus dem eigentlichen String ein richtiges Datum. Wandelt JSON in Date Datentyp um
        kurs: f.kurs
    }));

    // For schleife gibt jede Frist korrekt aus und ändert die Art das Datum anzugeben von ISO auf Deutsche Norm
    for (const frist of fristen) {
        console.log(`${frist.kurs}: ${frist.titel} bis ${frist.datum.toLocaleDateString("de-DE")}`);
    }
}
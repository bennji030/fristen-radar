// js trotz ts datei weil nach dem kompellieren die datei zu js wird
import { mailsLesen } from "./mails.js";
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


// Liest alle Mails aus dem Ordner (erst Beispiel Mails, später "mails")
const mails = await mailsLesen("beispiel-mails");

// Jede Mail wird einzeln an Claude geschickt (ein Aufruf pro Mail)
for (const mail of mails) {
    console.log(`\n--- ${mail.datei} ---`);                                                                    // \n für Leerzeile, damit man die Mails besser auseinanderhält

    // Schickt die Anfrage mit Spezifikationen (Kann man auch auf ein billigers Modell stellen, z.b HAIKU was etwas 40mal billiger ist als OPUS)
    // Schickt die Mail an Claude, Antwort kommt direkt im Format vom AntwortSchema zurück (parse prüft das mit Zod)
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


    if (!antwort.parsed_output) {                                                                               // Falls Antwort nciht dem Schema entspricht
        console.log("Claude hat keine gültige Antwort geliefert");
    } else {                                                                                                    // Die Liste aus Fristen wird durch Map in viele einzelne Listen geteilt in dem vorgegeben Stil
        const fristen: Frist[] = antwort.parsed_output.fristen.map((f) => ({
            titel: f.titel,
            datum: new Date(f.datum),                                                                           // new Date macht aus dem eigentlichen String ein richtiges Datum. Wandelt JSON in Date Datentyp um
            kurs: f.kurs
        }));

        // For schleife gibt jede Frist korrekt aus und ändert die Art das Datum anzugeben von ISO auf Deutsche Norm
        for (const frist of fristen) {
            console.log(`${frist.kurs}: ${frist.titel} bis ${frist.datum.toLocaleDateString("de-DE")}`);
        }
    }
}
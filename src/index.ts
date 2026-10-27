// importiert Anthropic API
import Anthropic from "@anthropic-ai/sdk";

type Pruefungsform = "schriftlich" | "mündlich" | "portfolio";

type Frist = {
    titel: string;
    datum: Date;
    kurs: string;
    pruefungsform?: Pruefungsform
};


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
const antwort = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    messages: [
        { role: "user", content: `Welche Fristen stehen in dieser Mail?\n${mailText}` }
    ]
});
// Da die Antwort von Claude aus Blöcken besteht und man nicht weiß wie viele Blöcke es genau sind gehen wir alle durch bis wir den Text Block finden
for (const block of antwort.content) {
    if (block.type === "text") {
        console.log(block.text);
    }
}
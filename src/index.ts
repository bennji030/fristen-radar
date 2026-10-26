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


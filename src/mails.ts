import { readdir, readFile } from "node:fs/promises";


// export, damit der Typ auch in anderen Dateien benutzt werden kann
export type Mail = {
    datei: string;
    text: string;
};

// async, weil Dateien lesen dauert: die Funktion gibt ein Promise zurück (der Wert kommt erst später)
// Liest jede Datei im Ordner als Text ein
export async function mailsLesen(ordner: string): Promise<Mail[]> {
    const dateien = await readdir(ordner);
    const mails: Mail[] = [];

    for (const datei of dateien) {
        const text = await readFile(`${ordner}/${datei}`, "utf-8");
        mails.push({ datei, text });
    }

    return mails;
}
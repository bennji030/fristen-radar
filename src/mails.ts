import { readdir, readFile } from "node:fs/promises";


// export damit due funktion im gesammten ordner nutzbar ist
export type Mail = {
    datei: string;
    text: string;
};

// async weil wir eine promis haben. funktion arbeitet weiter und gibt dann den "versprochenen" Wert weiter
export async function mailsLesen(ordner: string): Promise<Mail[]> {
    const dateien = await readdir(ordner);
    const mails: Mail[] = [];

    for (const datei of dateien) {
        const text = await readFile(`${ordner}/${datei}`, "utf-8");
        mails.push({ datei, text });
    }

    return mails;
}
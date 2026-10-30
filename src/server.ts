import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
// holt die kommenden Fristen aus der Datenbank (gleiche Funktion wie in index.ts)
import { datenbankOeffnen, kommendeFristen } from "./db.js";
import { html } from "./html.js";

const db = datenbankOeffnen("fristen.db");

// Port änderbar über PORT=... (Standard 3000)
const port = Number(process.env.PORT ?? 3000);

// Wird bei jeder Anfrage vom Browser aufgerufen (req = Anfrage, res = Antwort)
const server = createServer(async (req, res) => {
    // CSS Datei ausliefern (Browser fragt sie wegen dem <link> extra an)
    if (req.url === "/style.css") {
        const css = await readFile("public/style.css", "utf-8");
        res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
        res.end(css);
        return;                                                                                                 // fertig, sonst würde noch die Fristen Seite hinterher geschickt
    }

    // Alles außer der Startseite gibt es nicht (404 = nicht gefunden)
    if (req.url !== "/") {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Seite nicht gefunden");
        return;
    }

    const fristen = kommendeFristen(db);                                                                        // bei jedem Neuladen frisch aus der Datenbank

    // Jede Frist wird eine Tabellenzeile, join klebt alles zu einem Text zusammen (ohne join kämen Kommas dazwischen)
    const zeilen = fristen.map((f) =>
        `<tr><td>${f.datum_de}</td><td>${html(f.kurs)}</td><td>${html(f.titel)}</td></tr>`
    ).join("");

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });                                         // 200 = alles ok, utf-8 für Umlaute
    // Ganzes HTML Dokument, Aussehen kommt aus public/style.css (viewport damit es auch aufm Handy gut aussieht)
    res.end(`<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Fristen-Radar</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600&family=Outfit:wght@600;700&display=swap">
    <link rel="stylesheet" href="/style.css">
    <script>
        // Gespeicherten Modus sofort setzen (im head, damit die Seite nicht kurz in der falschen Farbe aufblitzt)
        try {
            const gespeichert = localStorage.getItem("modus");
            if (gespeichert) document.documentElement.dataset.theme = gespeichert;
        } catch (e) {}
    </script>
</head>
<body>
    <button class="modus" id="modus" aria-label="Zwischen hell und dunkel wechseln">🌙</button>
    <h1>Fristen-Radar</h1>
    <p class="untertitel">Nie wieder eine Frist verpassen.</p>
    <span class="anzahl">${fristen.length} kommende Fristen</span>
    <!-- Suche und Filter sind erstmal nur Optik, die Funktion kommt später -->
    <input class="suche" type="search" placeholder="Fristen durchsuchen …">
    <div class="filter">
        <button class="chip aktiv">Alle</button>
        <button class="chip">Uni</button>
        <button class="chip">Privat</button>
        <button class="chip">Sport</button>
    </div>
    <table>
        <tr><th>Datum</th><th>Kurs</th><th>Was</th></tr>
        ${zeilen}
    </table>
    <script>
        // Knopf: zwischen hell und dunkel wechseln und die Wahl im Browser merken (localStorage)
        const knopf = document.getElementById("modus");
        const wurzel = document.documentElement;

        function istDunkel() {
            if (wurzel.dataset.theme) return wurzel.dataset.theme === "dunkel";
            return matchMedia("(prefers-color-scheme: dark)").matches;   // sonst gilt die Systemeinstellung
        }

        function symbolSetzen() {
            knopf.textContent = istDunkel() ? "☀️" : "🌙";   // zeigt, wohin man wechselt
        }

        knopf.addEventListener("click", () => {
            const neu = istDunkel() ? "hell" : "dunkel";
            wurzel.dataset.theme = neu;
            try { localStorage.setItem("modus", neu); } catch (e) {}
            symbolSetzen();
        });

        symbolSetzen();
    </script>
</body>
</html>`);
});

// Startet den Server (läuft bis Strg+C)
server.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});

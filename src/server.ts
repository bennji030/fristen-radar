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
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <h1>Fristen-Radar</h1>
    <p>${fristen.length} kommende Fristen</p>
    <table>
        <tr><th>Datum</th><th>Kurs</th><th>Was</th></tr>
        ${zeilen}
    </table>
</body>
</html>`);
});

// Startet den Server (läuft bis Strg+C)
server.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});

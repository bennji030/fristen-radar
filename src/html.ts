// Macht Text sicher für HTML (sonst könnte eine Mail eigenen Code in die Seite schmuggeln, XSS)
export function html(text: string): string {
    return text
        .replaceAll("&", "&amp;")                                                                               // & zuerst, sonst wird aus &lt; später &amp;lt;
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

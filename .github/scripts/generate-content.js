#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Verzeichnisse ausschließen, z. B. .git, node_modules etc.
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', '.github', '.gitignore', 'website', 'src']);

// Einstiegspunkt (Root des Repos), von wo aus rekursiv gesucht werden soll
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Durchläuft rekursiv das Verzeichnis und generiert pro Verzeichnis
 *   1. content.html mit einer HTML-Liste aller Dateien (und Ordner)
 *   2. Falls noch nicht vorhanden, README.md, in der auf content.html verlinkt wird
 */
function main() {
  walkDir(ROOT_DIR);
}

/**
 * Rekursive Funktion, die durch alle Unterordner geht
 */
function walkDir(currentDir) {
  const dirEntries = fs.readdirSync(currentDir, { withFileTypes: true });

  // Filter aus, was wir nicht beachten wollen
  if (shouldExclude(currentDir)) {
    return;
  }

  // content.html bauen
  let contentHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Inhalt von ${path.basename(currentDir)}</title>
</head>
<body>
  <h1>Inhalt von ${path.basename(currentDir)}</h1>
  <ul>
`;

  for (const entry of dirEntries) {
    // Auslassen, falls Verzeichnisse wie .git oder node_modules
    if (EXCLUDED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(currentDir, entry.name);
    const relPath = path.relative(ROOT_DIR, fullPath);

    // Verzeichnis
    if (entry.isDirectory()) {
      // Rekursiver Aufruf
      walkDir(fullPath);

      // Link zum Unterordner (falls du eine eigene content.html im Unterordner verlinken möchtest)
      contentHtml += `    <li><a href="${relPath}/content.html">${entry.name}/</a></li>\n`;
    } 
    // Datei
    else if (entry.isFile()) {
      // Link auf die Datei selbst (z. B. raw file)
      // Oder auf eine Seite, die die Datei rendert
      // Hier nur ein simpler Link auf das Repo selbst (raw oder normal):
      contentHtml += `    <li><a href="../${relPath}" target="_blank">${entry.name}</a></li>\n`;
    }
  }

  contentHtml += `
  </ul>
</body>
</html>`;

  // content.html schreiben
  fs.writeFileSync(path.join(currentDir, 'content.html'), contentHtml, 'utf-8');

  // README updaten oder anlegen
  updateReadme(currentDir);

}

/**
 * Legt einen einfachen Link zur `content.html` in die README, wenn noch nicht vorhanden.
 */
function updateReadme(dir) {
  const readmePath = path.join(dir, 'README.md');
  const relContentHtml = 'content.html';

  let readmeContent = '';

  // Schau, ob es die README schon gibt
  if (fs.existsSync(readmePath)) {
    readmeContent = fs.readFileSync(readmePath, 'utf-8');

    // Falls noch kein Link drinsteht, ergänzen wir ihn
    if (!readmeContent.includes(relContentHtml)) {
      readmeContent += `\n\n[Zeige Inhaltsübersicht](${relContentHtml})\n`;
      fs.writeFileSync(readmePath, readmeContent, 'utf-8');
    }
  } else {
    // Neue README erstellen
    readmeContent = `# ${path.basename(dir)}

[Zeige Inhaltsübersicht](${relContentHtml})
`;
    fs.writeFileSync(readmePath, readmeContent, 'utf-8');
  }
}

/**
 * Prüft, ob wir dieses Verzeichnis ignorieren wollen.
 */
function shouldExclude(dir) {
  // Bspw. Root_dir/.git, Root_dir/node_modules usw.
  const base = path.basename(dir);
  return EXCLUDED_DIRS.has(base);
}

// Start
main();

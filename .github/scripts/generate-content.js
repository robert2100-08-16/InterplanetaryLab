#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Verzeichnisse ausschließen, z. B. .git, node_modules etc.
const EXCLUDED_DIRS = new Set(['content.html', '.git', 'node_modules', '.github', '.gitignore', 'website', 'src', 'CNAME']);

// Einstiegspunkt (Root des Repos), von wo aus rekursiv gesucht werden soll
const ROOT_DIR = path.resolve(__dirname, '..', '..');

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
  // Filter aus, was wir nicht beachten wollen
  if (shouldExclude(currentDir)) {
    return;
  }

  const dirEntries = fs.readdirSync(currentDir, { withFileTypes: true });

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
    const fullPath = path.join(currentDir, entry.name);
    if (shouldExclude(fullPath)) {
      continue;
    }

    const relPath = path.relative(currentDir, fullPath);

    if (entry.isDirectory()) {
      contentHtml += `<li><a href="${relPath}/content.html">${entry.name}/</a></li>`;
      walkDir(fullPath); // Rekursiv in das Unterverzeichnis gehen
    } else if (entry.name == 'README.md') {
      // README.md wird angezeigt, wenn auf das zugehörige directory verlinkt wird 
      const modifiedRelPath = relPath.replace('README.md', '');
      contentHtml += `<li><a href="${modifiedRelPath}">${entry.name}</a></li>`;
    } else {
      contentHtml += `<li><a href="${relPath}">${entry.name}</a></li>`;
    }
  }

  contentHtml += `
  </ul>
</body>
</html>
`;

  fs.writeFileSync(path.join(currentDir, 'content.html'), contentHtml);

  updateReadme(currentDir);
}

/**
 * Legt einen einfachen Link zur `content.html` in die README, wenn noch nicht vorhanden.
 */
function updateReadme(dir) {
  const readmePath = path.join(dir, 'README.md');
  const relContentHtml = 'content.html';
  const absolutePath = path.resolve(dir);

  let readmeContent = '';

  // Check if README.md exists
  if (fs.existsSync(readmePath)) {
    readmeContent = fs.readFileSync(readmePath, 'utf-8');

    // Split content by language sections
    const sections = readmeContent.split(/(?=## [^#])/);
    const updatedSections = sections.map(section => {
      if (section.includes('**Deutsch**')) {
        if (!section.includes(relContentHtml)) {
          return section.trim() + `\n\n[Zeige Inhaltsübersicht](${relContentHtml})\n\n---\n`;
        }
      } else if (section.includes('**English**')) {
        if (!section.includes(relContentHtml)) {
          return section.trim() + `\n\n[Show content overview](${relContentHtml})\n\n---\n`;
        }
      }
      return section;
    });

    readmeContent = updatedSections.join('\n');
    fs.writeFileSync(readmePath, readmeContent, 'utf-8');
  } else {
    // Create new README.md with both German and English sections
    readmeContent = `# Dokumentation & Konzepte

**Deutsch** | [English](#documentation--concepts)

In diesem Ordner (${absolutePath}) sammeln wir alle **offen lizenzierten** Essays, Konzepte und Analysen sowie Grafiken und Videos, 
die sich mit interplanetarer Raumfahrt, modularem Habitat-Design, Antriebsarten und anderen Zukunftstechnologien 
zum Thema **${absolutePath}** beschäftigen.

## Lizenz

Alle Inhalte in diesem Verzeichnis stehen unter der  
[Creative Commons Attribution 4.0 International (CC BY 4.0)](../LICENSE-CC-BY-4.0.md).

Bitte stelle sicher, dass du bei Weiterverwendung auf uns verlinkst und den entsprechenden Lizenzvermerk beilegst.  
Die Urheberschaft liegt bei [Projektname / Teamname / Dein Name].

[Zeige Inhaltsübersicht](${relContentHtml})

---

# Documentation & Concepts

[Deutsch](#dokumentation--konzepte) | **English**

In this folder (${absolutePath}), we collect all **openly licensed** essays, concepts, and analyses as well as graphics and videos 
related to interplanetary space travel, modular habitat design, propulsion systems, and other future space technologies 
about **${absolutePath}**.

## License

All content in this directory is provided under the  
[Creative Commons Attribution 4.0 International (CC BY 4.0)](../LICENSE-CC-BY-4.0.md).

[Show content overview](${relContentHtml})

---
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

#!/usr/bin/env node

/**
 * generate-readme.js
 *
 * - Rekursives Durchlaufen des Repos ab ROOT_DIR
 * - Erzeugt/aktualisiert in jedem Ordner eine README.md mit deutschen und englischen Abschnitten.
 * - Fügt zwei TOC-Blöcke ein:
 *    <!-- AUTO-GENERATED-TOC-DE:START --> ... <!-- AUTO-GENERATED-TOC-DE:END -->
 *    <!-- AUTO-GENERATED-TOC-EN:START --> ... <!-- AUTO-GENERATED-TOC-EN:END -->
 *
 * Usage:
 *   node generate-readme.js
 */

const fs = require('fs');
const path = require('path');

// Verzeichnisse ausschließen, z. B. .git, node_modules etc.
const EXCLUDED_DIRS = new Set([
	'.git',
	'node_modules',
	'.github',
	'.gitignore',
	'website',
	'src',
	'CNAME',
	'InterplanetaryLab/README.md',
]);

// Platzhalter für die auto-generierten Blöcke (Deutsch / Englisch)
const TOC_START_DE = '<!-- AUTO-GENERATED-TOC-DE:START -->';
const TOC_END_DE = '<!-- AUTO-GENERATED-TOC-DE:END -->';

const TOC_START_EN = '<!-- AUTO-GENERATED-TOC-EN:START -->';
const TOC_END_EN = '<!-- AUTO-GENERATED-TOC-EN:END -->';

// Wurzelverzeichnis des Repos
const ROOT_DIR = path.resolve(__dirname, '..', '..');

/**
 * Hauptfunktion: startet den rekursiven Walk ab ROOT_DIR.
 */
function main() {
	walkDir(ROOT_DIR);
}

/**
 * Rekursive Funktion, die das Verzeichnis currentDir durchläuft.
 */
function walkDir(currentDir) {

	if (shouldExclude(currentDir)) {
		return;
	}

	const base = path.basename(currentDir);

	const dirEntries = fs.readdirSync(currentDir, { withFileTypes: true });
	const lines = [];

	for (const entry of dirEntries) {
		const fullPath = path.join(currentDir, entry.name);

		if (shouldExclude(fullPath)) {
			continue;
		}

		// relativer Link für README
		const relPath = `./${encodeURIComponent(entry.name)}`;

		if (entry.isDirectory()) {
			lines.push(`- [${entry.name}/](${relPath}/)`);
			// Rekursion
			walkDir(fullPath);
		} else {
			lines.push(`- [${entry.name}](${relPath})`);
		}
	}

	// Wir bauen die beiden TOC-Blöcke
	const tocDe = buildTocBlockDe(base, lines);
	const tocEn = buildTocBlockEn(base, lines);

	// README aktualisieren oder neu anlegen
	updateReadmeWithDualToc(currentDir, tocDe, tocEn);
}

/**
 * Baut den deutschen TOC-Block.
 */
function buildTocBlockDe(base, lines) {
	return [
		TOC_START_DE,
		'', // Leerzeile
		`## Inhaltsverzeichnis für „${base}“`,
		'',
		...lines,
		'',
		TOC_END_DE,
	].join('\n');
}

/**
 * Baut den englischen TOC-Block.
 */
function buildTocBlockEn(base, lines) {
	return [
		TOC_START_EN,
		'', // Leerzeile
		`## Table of Contents for "${base}"`,
		'',
		...lines,
		'',
		TOC_END_EN,
	].join('\n');
}

/**
 * Schreibt den dualen TOC (Deutsch & Englisch) in die README.md.
 * Falls keine README existiert, wird sie neu erstellt (mit dem gewünschten Grundgerüst).
 */
function updateReadmeWithDualToc(dir, tocDe, tocEn) {
	const readmePath = path.join(dir, 'README.md');
	let oldContent = '';
	let newContent = '';

	if (fs.existsSync(readmePath)) {
		// README existiert bereits
		oldContent = fs.readFileSync(readmePath, 'utf-8');
		newContent = replaceOrAppendBlock(oldContent, TOC_START_DE, TOC_END_DE, tocDe);
		newContent = replaceOrAppendBlock(newContent, TOC_START_EN, TOC_END_EN, tocEn);
	} else {
		// README fehlt => Grundgerüst erstellen
		const absolutePath = path.resolve(dir);
		// Deine gewünschte Vorlage für README.md:
		let readmeContent = `# Dokumentation & Konzepte

**Deutsch** | [English](#documentation--concepts)

In diesem Ordner (${absolutePath}) sammeln wir alle **offen lizenzierten** Essays, Konzepte und Analysen sowie Grafiken und Videos, 
die sich mit interplanetarer Raumfahrt, modularem Habitat-Design, Antriebsarten und anderen Zukunftstechnologien 
zum Thema **${absolutePath}** beschäftigen.

## Lizenz

Alle Inhalte in diesem Verzeichnis stehen unter der  
[Creative Commons Attribution 4.0 International (CC BY 4.0)](../LICENSE-CC-BY-4.0.md).

Bitte stelle sicher, dass du bei Weiterverwendung auf uns verlinkst und den entsprechenden Lizenzvermerk beilegst.  
Die Urheberschaft liegt bei [Projektname / Teamname / Dein Name].

${TOC_START_DE}
${TOC_END_DE}



---

# Documentation & Concepts

[Deutsch](#dokumentation--konzepte) | **English**

In this folder (${absolutePath}), we collect all **openly licensed** essays, concepts, and analyses as well as graphics and videos 
related to interplanetary space travel, modular habitat design, propulsion systems, and other future space technologies 
about **${absolutePath}**.

## License

All content in this directory is provided under the  
[Creative Commons Attribution 4.0 International (CC BY 4.0)](../LICENSE-CC-BY-4.0.md).

Please ensure that proper attribution is provided and that the corresponding license notice is included when 
redistributing or reusing this content. Authorship is attributed to [Project Name / Team Name / Your Name].

${TOC_START_EN}
${TOC_END_EN}

---
`;

		// Nun die auto-generierten TOCs mit Inhalt füllen
		readmeContent = replaceOrAppendBlock(readmeContent, TOC_START_DE, TOC_END_DE, tocDe);
		readmeContent = replaceOrAppendBlock(readmeContent, TOC_START_EN, TOC_END_EN, tocEn);

		newContent = readmeContent;
	}

	fs.writeFileSync(readmePath, newContent, 'utf-8');
}

/**
 * Ersetzt in 'content' den Block zwischen startMarker und endMarker
 * durch 'replacement'. Falls nicht vorhanden, wird 'replacement' ans Ende gehängt.
 */
function replaceOrAppendBlock(content, startMarker, endMarker, replacement) {
	if (!content) {
		return replacement + '\n';
	}

	if (content.includes(startMarker) && content.includes(endMarker)) {
		// Block existiert => per Regex ersetzen
		const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'gm');
		return content.replace(regex, replacement);
	} else {
		// Noch kein Block => am Ende anhängen
		return content.trimEnd() + '\n\n' + replacement + '\n';
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


// Skript starten
main();

# AniXML

> Browser-based anime list cleaner and XML exporter for AniList imports.

<p align="center">
  <img src="https://img.shields.io/github/license/Parthivkoli/AniXML?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/github/stars/Parthivkoli/AniXML?style=for-the-badge" alt="Stars">
  <img src="https://img.shields.io/github/forks/Parthivkoli/AniXML?style=for-the-badge" alt="Forks">
  <img src="https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=for-the-badge&logo=javascript" alt="JavaScript">
  <img src="https://img.shields.io/badge/GitHub%20Pages-ready-222?style=for-the-badge&logo=github" alt="GitHub Pages">
</p>

AniXML takes plain-text anime lists and turns them into clean, importable XML in the browser. It is built for GitHub Pages, works without a backend, and keeps your data local.

## What it does

- Cleans pasted or imported lists by removing numbering, bullets, emoji, and duplicates
- Matches titles against AniList first, then falls back to free Jikan-backed lookups
- Exports MAL-style XML, XML.GZ, JSON, CSV, and unmatched TXT
- Supports paste, TXT import, drag and drop, and manual correction
- Uses a responsive UI that stays usable on mobile browsers

## Quick Start

```bash
git clone https://github.com/Parthivkoli/AniXML.git
cd AniXML
```

Open the app in your browser or publish the repository with GitHub Pages from the `main` branch.

## Usage

1. Paste one title per line, or import a TXT file.
2. Click Search to match titles automatically.
3. Review any misses or manual matches.
4. Export XML, XML.GZ, JSON, or CSV.
5. Upload the XML to AniList if needed.

## Matching Notes

AniXML tries multiple cleaned title variants for each entry. It prefers AniList results, then uses Jikan as a free fallback for titles AniList misses or rejects.

## Features

- Modern mobile-friendly interface
- Dark mode
- LocalStorage save and restore
- Progress indicator for bulk lists
- Manual re-search and clear-match controls
- Keyboard shortcuts for common actions

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript ES modules
- AniList GraphQL API
- Jikan API fallback
- pako
- LocalStorage

## License

MIT. See [LICENSE](LICENSE).

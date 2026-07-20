<h1 align="center">🎌 AniXML</h1>

<p align="center">
Convert plain text anime lists into <b>MyAnimeList XML</b> ready for importing into <b>AniList</b>.
</p>

<p align="center">

![License](https://img.shields.io/github/license/Parthivkoli/AniXML?style=for-the-badge)
![Stars](https://img.shields.io/github/stars/Parthivkoli/AniXML?style=for-the-badge)
![Forks](https://img.shields.io/github/forks/Parthivkoli/AniXML?style=for-the-badge)
![Issues](https://img.shields.io/github/issues/Parthivkoli/AniXML?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=for-the-badge&logo=javascript)
![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-222?style=for-the-badge&logo=github)

</p>

<p align="center">

🌸 Browser Only • ⚡ Fast • 🎌 AniList API • 📄 MAL XML Export • 🌙 Dark Mode

</p>

---

# ✨ Overview

AniXML is a lightweight browser application that converts plain text anime title lists into **MyAnimeList XML**, allowing effortless bulk imports into **AniList**.

No account required.

No backend.

No installation.

No build tools.

Everything runs entirely in your browser.

---

# 🎯 Why AniXML?

Many anime recommendations come as simple text lists from:

- Reddit
- Discord
- YouTube
- Blogs
- Friends
- AI chatbots

AniXML automatically:

- finds every anime on AniList
- resolves titles
- removes duplicates
- generates valid MAL XML
- lets you import everything in minutes instead of hours.

---

# 🗺 Workflow

```text
Anime Titles
(one per line)

        │
        ▼

     AniXML

        │
        ▼

 AniList GraphQL API

        │
        ▼

 Automatic Matching

        │
        ▼

 Manual Fixes (optional)

        │
        ▼

MyAnimeList XML Export

        │
        ▼

 Import into AniList
```

---

# 🌸 Features

## 🎌 Smart Anime Matching

Automatically searches the AniList GraphQL API and finds the correct anime.

---

## ⚡ Fast Bulk Processing

Search hundreds or even thousands of titles with configurable concurrent requests.

---

## 🧠 Intelligent Title Cleanup

Automatically retries searches by removing:

- punctuation
- season suffixes
- OVA
- Movie
- Part 2
- Final Season

---

## ✍ Manual Search

Incorrect match?

Search again and select another anime instantly.

---

## 📦 Multiple Export Formats

- XML
- XML.GZ
- JSON
- CSV
- TXT (unmatched)

---

## 📂 Import Options

- Paste
- TXT File
- Drag & Drop

---

## ♿ Accessibility

- Keyboard navigation
- ARIA labels
- High contrast
- Responsive layout

---

# 🎴 Supported Platforms

| Platform | Status |
|----------|--------|
| <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/anilist.svg" width="18"> AniList | ✅ Import |
| <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/myanimelist.svg" width="18"> MyAnimeList | ✅ XML Export Format |

---

# 🚀 Quick Start

## GitHub Pages

```bash
git clone https://github.com/Parthivkoli/AniXML.git

cd AniXML
```

Go to

Settings → Pages

Select

```
main
```

Save.

Open

```
https://YOUR_USERNAME.github.io/AniXML
```

---

# 🍜 Usage

## Step 1

Paste

```text
Frieren
Steins;Gate
Death Note
Vinland Saga
Bocchi the Rock!
```

or

Import a TXT file.

---

## Step 2

Click

```
Search AniList
```

AniXML automatically

- removes duplicates
- searches AniList
- retries failed matches
- shows progress

---

## Step 3

Review matches.

Use manual search if necessary.

---

## Step 4

Export

- XML
- XML.GZ
- JSON
- CSV

---

## Step 5

Import XML into AniList.

---

# ✨ Example

## Input

```text
Frieren
Death Note
Steins;Gate
```

↓

## Output

```xml
<anime>
    <series_title>Frieren: Beyond Journey's End</series_title>
</anime>

<anime>
    <series_title>Death Note</series_title>
</anime>

<anime>
    <series_title>Steins;Gate</series_title>
</anime>
```

---

# ⚙ Settings

Configure:

- Concurrent Requests
- Retry Failed Searches
- Auto Save
- Theme
- Default Status
- Export Preferences

---

# 🔎 Matching Logic

AniXML attempts searches in this order.

1. Exact title

↓

2. Remove punctuation

↓

3. Remove season suffixes

↓

4. Retry

↓

5. Manual search

---

# 📄 XML Format

Generated XML follows the standard MyAnimeList export format.

```xml
<?xml version="1.0" encoding="UTF-8"?>

<myanimelist>

    <myinfo>

        <user_name></user_name>

        <user_export_type>1</user_export_type>

    </myinfo>

    <anime>

        <series_animedb_id>52991</series_animedb_id>

        <series_title>Frieren</series_title>

        <my_status>Plan to Watch</my_status>

        <my_score>0</my_score>

        <my_watched_episodes>0</my_watched_episodes>

    </anime>

</myanimelist>
```

---

# 📥 Import into AniList

1. Open AniList

2. Settings

3. Import

4. MyAnimeList XML

5. Upload

6. Done 🎉

---

# 💾 Local Storage

AniXML automatically stores

- pasted titles
- search results
- settings
- dark mode
- export preferences

No information is uploaded anywhere except AniList searches.

---

# ⌨ Keyboard Shortcuts

| Shortcut | Action |
|-----------|--------|
| Ctrl + Enter | Search |
| Ctrl + O | Import TXT |
| Ctrl + S | Export XML |
| Esc | Close Dialog |
| Ctrl + R | Reset Session |

---

# 🧩 Project Structure

```text
AniXML

├── index.html
├── style.css
├── main.js
├── api.js
├── search.js
├── ui.js
├── storage.js
├── xml.js
├── utils.js
├── assets/
│
├── docs/
│   ├── home.png
│   ├── matching.png
│   ├── export.png
│   ├── dark.png
│   └── demo.gif
│
├── LICENSE
└── README.md
```

---

# ⚡ Performance

| Titles | Time |
|---------|------|
| 10 | Instant |
| 100 | ~15 sec |
| 500 | ~60 sec |
| 1000 | ~2 min |

---

# 🛠 Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES Modules)
- AniList GraphQL API
- pako
- LocalStorage

No frameworks.

No backend.

No build tools.

---

# 🗺 Roadmap

## v1.0

- [x] TXT Import
- [x] Drag & Drop
- [x] AniList Search
- [x] Manual Matching
- [x] XML Export
- [x] JSON Export
- [x] CSV Export
- [x] Dark Mode
- [x] Local Storage

## v1.1

- [ ] Anime Posters
- [ ] Batch Editing
- [ ] Progress Resume
- [ ] Offline Cache
- [ ] Better Duplicate Detection

## v2.0

- [ ] PWA Support
- [ ] MAL Username Import
- [ ] Kitsu Support
- [ ] AnimePlanet Support
- [ ] Custom Export Profiles

---

# ❓ FAQ

### Why wasn't my anime found?

Try:

- manual search
- English title
- Romaji title
- Japanese title

---

### Does AniXML upload my list anywhere?

No.

Everything happens locally in your browser.

Only search requests are sent to the public AniList API.

---

### Does it work offline?

Searching requires internet.

Everything else works locally.

---

### Can I edit XML?

Yes.

It is standard XML.

---

### Can I import thousands of anime?

Yes.

The UI is designed for large lists.

---

# 🤝 Contributing

Pull Requests are welcome.

Please

- keep dependencies minimal
- use vanilla JavaScript
- maintain accessibility
- write clear commit messages

---

# 📜 License

MIT License

See LICENSE for details.

---

# 🙏 Credits

- <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/anilist.svg" width="18"> AniList GraphQL API
- <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/myanimelist.svg" width="18"> MyAnimeList XML Specification
- pako
- Fuse.js

---

<p align="center">

### 🌸 Made for anime fans.

⭐ If AniXML saved you time, consider starring the repository.

</p>

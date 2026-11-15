# BCK Digital Library

A free, mobile-friendly school digital library for GitHub Pages.

## What it is

A single-page app for Bishop Cipriano Kihangire Senior Secondary School (Day Section)
that brings **13,164 approved study resources** into one focused, searchable space —
past papers, lesson notes and holiday packages for Senior 1 to Senior 6.

Students can browse by class, subject, resource type and exam term; open a resource in
the built-in reader; bookmark what matters; and ask questions in the Discussions board.

## Features

| Area | What it does |
| --- | --- |
| **Dashboard** | Stats, class map and a guide to every tool |
| **Library** | Filter 13,164 resources by class, subject, type and term; sort and paginate |
| **Discussions** | Posts, questions, announcements and resource picks — with likes and comments |
| **Study Buddy** | An on-device helper that answers from the catalogue (past papers, revision plans, subject counts) |
| **Study Space** | Pick a class and subjects; the library keeps the shelf focused |
| **Bookmarks / Recently viewed** | Personal, saved on-device |
| **Profile & Settings** | Display name, class, subjects, theme, and local-data controls |

Light and dark themes, a mobile drawer navigation, and a PWA manifest for install.

## Privacy

There is **no account and no server**. Display names, posts, comments, likes, bookmarks,
history and preferences all live in the browser's `localStorage` on the student's own
device. Nothing is uploaded anywhere. "Clear all local data" removes everything in one tap.

## Project structure

```text
bck_lib/
├── index.html            # App shell: sidebar, topbar, router view host
├── app.js                # Application logic (router, views, services)
├── styles.css            # Design tokens + component styles
├── manifest.webmanifest  # PWA manifest
├── logo.svg              # School badge
├── school-badge.png
└── data/
    ├── resource_shards.json   # Index of the catalogue shards
    ├── resources-s1.json      # Catalogue shards, one or more per class
    ├── resources-s2.json
    ├── ...
    ├── classes.json           # Class metadata
    ├── subjects.json          # Sorted subject list
    └── class_subjects.json    # Subject -> resource count, per class
```

The catalogue is split into class-scoped shards so the browser can fetch it in parallel
instead of downloading one large script.

## Running locally

```bash
git clone https://github.com/fae-aum-cmyk/bck_lib.git
cd bck_lib
python3 -m http.server 8000
```

Then open <http://localhost:8000>. A static server is required — the app loads its
catalogue with `fetch()`, so opening `index.html` directly from the filesystem will not work.

## Publishing on GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select the `main` branch and the `/ (root)` folder, then save.
4. Wait for GitHub to provide the Pages URL.

## Rebuilding the catalogue

If the catalogue is regenerated from the `Lib_son` archive, rebuild the data layer:

```bash
node build/build-data.js    # catalogue -> data/*.json (full resources.json)
node build/shard-data.js    # resources.json -> per-class shards + index
```

`build-data.js` expects the original `EMBEDDED_CATALOG` blob in `app.js` as its source.

## Important

Only publish files the school created, owns, or has permission to share. Do not place
Google passwords, API keys, student marks, phone numbers, or private student information
in this project.

## Development team

Maintained as a practical digital learning initiative for the BCK community.

- **Ainembabazi Edward Francis** — Chief Developer
- **Mataa Victor** — Assistant Chief Developer

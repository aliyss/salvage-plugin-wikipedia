# Wikipedia for Salvage

A [Salvage](https://github.com/aliyss/salvage-web) plugin that adds a
**Wikipedia** canvas and a Wikipedia panel on any entry that links to an
article. Both are read by the **Salvage Helper** on your own computer: the list
of articles is a title index you downloaded, and the article text is read from
Wikipedia only when a card is opened or an entry asks for it.

## What it adds

- A canvas, with one card per article, in the order the title index keeps them
  or filtered by what a title contains.
- An **Wikipedia** button on an entry whose link is `wikipedia.org`: the
  article's introduction, and the articles that link to it — the connections
  between what is already on the canvas.
- Every card carries its article's lead image, filed on this computer, and the
  colour that image leads with, which is what the colour view sorts by.

## Downloads

Wikipedia's own archives are ZIM or bz2 files that nothing in this runtime can
read, so the plugin does not download those. What a canvas needs is the list of
article titles, and Wikimedia publishes that as one gzipped file per language:

```
https://dumps.wikimedia.org/enwiki/latest/enwiki-latest-all-titles-in-ns0.gz
```

The plugin's own page offers one per language — English is about 330 MB — and
the helper fetches it with a progress bar you can stop and resume. When the
file arrives the helper builds a SQLite index of its titles in the plugin's
folder, and that index is the only thing a canvas reads. Article text is never
part of a download: a page of cards asks Wikipedia for the extracts of the
titles on it, in one batched request.

Files live in `SALVAGE_PLUGIN_DATA/downloads/`: the archive as it arrived, the
index built from it, and the state the panel reads.

## Settings

| Canvas setting | Default | Meaning |
| --- | --- | --- |
| Which Wikipedia | English | The language whose index this canvas reads |
| Titles containing | — | Filter the index; empty reads it from the start |
| How many titles | 30 | Between 5 and 50, paged as the canvas scrolls |

## A note about colours

Article images are read once, when a card is first drawn, and the colour of the
most common coarse colour of the image is kept beside it — the same rule the app
applies to a picture you upload. Only JPEG images are decoded; a PNG or WebP
lead image leaves its card with the colour the canvas paints for an uncoloured
one.

## Development

```sh
bun install
bun run typecheck
bun test
bun run build     # writes dist/plugin.js
```

## Publishing

`.github/workflows/release.yml` typechecks, tests and builds every push to
`master`, then publishes `manifest.json` and `dist/plugin.js` on a release
tagged `v<version>` from the manifest.

## Data

Article text and titles come from Wikipedia and are available under
CC BY-SA 4.0. This plugin is not affiliated with the Wikimedia Foundation.

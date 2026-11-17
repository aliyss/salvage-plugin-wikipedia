/**
 * What Wikipedia says about the few articles a page or an entry names.
 *
 * The title index knows what exists; this knows what each one is. Two calls
 * cover a whole page of cards: the Action API answers extracts and thumbnails
 * for up to fifty titles at once, and a single entry's backlinks are one small
 * query more. Everything is cached by the caller's reading of the same titles,
 * so a page turn asks about new cards only.
 */

import { PluginError } from "./sdk";

const TIMEOUT_MS = 12_000;
const MAX_BYTES = 2_000_000;
const MAX_TITLES = 50;
const MAX_BACKLINKS = 20;
const MAX_BACKLINK_TITLE = 200;
const THUMB_WIDTH = 480;
const USER_AGENT =
  "salvage-plugin-wikipedia/0.1.0 (https://github.com/aliyss/salvage-web)";
/** A normalised title and a redirect are two hops, and a third is slack. */
const MAX_HOPS = 3;
/** The page the canvas is opened on: `en.wikipedia.org/wiki/Foo`. */
const WIKI_PAGE =
  /^https?:\/\/(?:www\.)?([a-z-]{2,16})(?:\.m)?\.wikipedia\.org\/wiki\/([^?#]+)/i;
/** The old form: `?title=Foo`. */
const INDEX_PAGE =
  /^https?:\/\/(?:www\.)?([a-z-]{2,16})(?:\.m)?\.wikipedia\.org\/w\/index\.php\?(?:[^#]*&)?title=([^&#]+)/i;

export type Article = {
  title: string;
  /** The one line under the title, when Wikipedia has one. */
  description: string | null;
  /** The introduction, plain text. */
  extract: string | null;
  /** The article's own lead image, as Wikimedia serves it. */
  thumbnail: string | null;
};

/** One article a link names, or null for a link that is not an article. */
export function articleOf(
  url: string | null | undefined,
): { language: string; title: string } | null {
  if (!url) {
    return null;
  }
  const match = WIKI_PAGE.exec(url.trim()) ?? INDEX_PAGE.exec(url.trim());
  if (!match) {
    return null;
  }
  const language = (match[1] ?? "").toLowerCase();
  const raw = match[2] ?? "";
  let title: string;
  try {
    title = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const readable = title.replace(/_/g, " ").trim();
  if (!language || !readable || readable.length > MAX_BACKLINK_TITLE) {
    return null;
  }
  return { language, title: readable };
}

/** The address of one article, in the form a card links to. */
export function pageUrl(language: string, title: string): string {
  return `https://${language}.wikipedia.org/wiki/${encodeURIComponent(
    title.replace(/ /g, "_"),
  )}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textOf(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function httpsUrl(value: unknown): string | null {
  const text = textOf(value);
  return text && text.startsWith("https://") && text.length <= 2_048
    ? text
    : null;
}

async function readJson(url: URL): Promise<Record<string, unknown> | null> {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null);
  if (!response?.ok) {
    await response?.body?.cancel().catch(() => undefined);
    return null;
  }
  const raw = await new Response(response.body).text();
  if (raw.length > MAX_BYTES) {
    return null;
  }
  try {
    const body: unknown = JSON.parse(raw);
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

function query(language: string, params: Record<string, string>): URL {
  const url = new URL(`https://${language}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

/**
 * The articles a page names, by title. Titles Wikipedia renamed or redirects
 * away from are mapped back, so the card still finds its article.
 */
export async function summaries(
  language: string,
  titles: string[],
): Promise<Map<string, Article>> {
  const asked = [...new Set(titles.filter((title) => title.trim()))].slice(
    0,
    MAX_TITLES,
  );
  const byTitle = new Map<string, Article>();
  if (asked.length === 0) {
    return byTitle;
  }

  const body = await readJson(
    query(language, {
      prop: "pageimages|extracts|description",
      exintro: "1",
      explaintext: "1",
      exlimit: "max",
      piprop: "thumbnail",
      pithumbsize: String(THUMB_WIDTH),
      redirects: "1",
      titles: asked.join("|"),
    }),
  );
  const answer = isRecord(body) ? body.query : null;
  if (!isRecord(answer) || !Array.isArray(answer.pages)) {
    return byTitle;
  }

  // A redirect is answered under its own title, so the name that was asked for
  // is read back from the mapping and given the article it resolved to.
  const resolved = new Map<string, string>();
  for (const key of ["normalized", "redirects"] as const) {
    const list = answer[key];
    if (!Array.isArray(list)) {
      continue;
    }
    for (const row of list) {
      if (isRecord(row) && typeof row.from === "string" && typeof row.to === "string") {
        resolved.set(row.from, row.to);
      }
    }
  }
  const byName = new Map<string, Article>();
  for (const page of answer.pages) {
    if (!isRecord(page) || page.missing === true) {
      continue;
    }
    const title = textOf(page.title);
    if (!title) {
      continue;
    }
    const thumbnail = isRecord(page.thumbnail)
      ? httpsUrl(page.thumbnail.source)
      : null;
    const article: Article = {
      title,
      description: textOf(page.description),
      extract: textOf(page.extract),
      thumbnail,
    };
    byName.set(title, article);
  }

  for (const title of asked) {
    // A name Wikipedia normalised, then redirected, is followed to the article
    // that answered for it; each hop is taken from the name before it, not from
    // the one that was asked for.
    let current = title;
    let found = byName.get(current);
    for (let hop = 0; !found && hop < MAX_HOPS; hop += 1) {
      const next = resolved.get(current);
      if (!next || next === current) {
        break;
      }
      current = next;
      found = byName.get(current);
    }
    if (found) {
      byTitle.set(title, found);
    }
  }
  return byTitle;
}

/** The articles that link to one article, which is what connects them. */
export async function backlinks(
  language: string,
  title: string,
): Promise<string[]> {
  const body = await readJson(
    query(language, {
      list: "backlinks",
      bltitle: title,
      bllimit: String(MAX_BACKLINKS),
      blnamespace: "0",
      blredirect: "1",
    }),
  );
  const answer = isRecord(body) ? body.query : null;
  const rows = isRecord(answer) ? answer.backlinks : null;
  if (!Array.isArray(rows)) {
    return [];
  }

  const titles: string[] = [];
  for (const row of rows) {
    if (!isRecord(row) || typeof row.title !== "string") {
      continue;
    }
    const linked = row.title.trim();
    // A redirect's own backlinks are folded into its target's, so the redirect
    // itself is not something to show.
    if (linked && linked !== title && !titles.includes(linked)) {
      titles.push(linked);
    }
    if (titles.length >= MAX_BACKLINKS) {
      break;
    }
  }
  return titles;
}

/** The article one entry's link names, read in one go. */
export async function readArticle(
  url: string | null | undefined,
): Promise<{ language: string; article: Article; backlinks: string[] }> {
  const found = articleOf(url);
  if (!found) {
    throw new PluginError(
      "bad_subject",
      "This entry does not link to a Wikipedia article.",
    );
  }

  const pages = await summaries(found.language, [found.title]);
  const article = pages.get(found.title);
  if (!article) {
    throw new PluginError("no_data", "Wikipedia has no article by that name.");
  }

  return {
    language: found.language,
    article,
    backlinks: await backlinks(found.language, article.title).catch(() => []),
  };
}

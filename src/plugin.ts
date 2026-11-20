import { createHash } from "node:crypto";

import { articleOf, backlinks, pageUrl, readArticle, summaries } from "./api";
import type { Article } from "./api";
import { archiveOf, readTitles } from "./index";
import { PluginError, serve } from "./sdk";
import { coloursOf, keepStills } from "./stills";

import type { Data, Paging, Subject } from "./sdk";

const DEFAULT_PER_PAGE = 30;
const MIN_PER_PAGE = 5;
/**
 * The widest page a canvas may ask for. A page costs one index read, one
 * Wikipedia call per fifty titles and a picture per card, so the ceiling is the
 * point where a cold page still answers in a couple of seconds.
 */
const MAX_PER_PAGE = 200;
const MAX_OVERVIEW = 600;
const MAX_EXTRACT = 1_200;
/** Rounds one page may read, so a run of redirects cannot stall the canvas. */
const MAX_ROUNDS = 3;

/** One card of the canvas, as the app reads it. */
type Card = {
  id: string;
  title: string;
  overview: string | null;
  cover: string | null;
  color: string | null;
  url: string;
};

/** `enwiki` is English Wikipedia, `simplewiki` is Simple English. */
function languageOf(archive: string): string {
  return archive.replace(/wiki$/, "") || "en";
}

function perPageOf(value: unknown): number {
  const wanted =
    typeof value === "number" ? Math.round(value) : DEFAULT_PER_PAGE;
  return Math.min(MAX_PER_PAGE, Math.max(MIN_PER_PAGE, wanted));
}

/** The page a canvas asked for: where it starts, and how much it holds. */
function pageOf(
  paging: Paging | undefined,
  perPage: number,
): { offset: number; limit: number } {
  const limit = Math.min(
    MAX_PER_PAGE,
    Math.max(MIN_PER_PAGE, Math.round(paging?.limit ?? perPage)),
  );
  return { offset: Math.max(0, Math.round(paging?.offset ?? 0)), limit };
}

/**
 * A page of the canvas: titles from the index this computer downloaded, each
 * card filled from one batched read of Wikipedia and given the colour its lead
 * image leads with.
 */
async function catalogue(
  settings: Record<string, unknown>,
  paging: Paging | undefined,
): Promise<Data> {
  const archive = archiveOf(settings.archive);
  const perPage = perPageOf(settings.perPage);
  const { offset, limit } = pageOf(paging, perPage);
  const language = languageOf(archive);
  const query = typeof settings.query === "string" ? settings.query : "";

  // The list of what exists is on this computer; what each one is, is not.
  const seen = new Set<string>();
  const items: Card[] = [];
  let cursor = offset;
  let hasMore = false;

  // A page is read in rounds. One round can end on a run of redirects that all
  // lead to articles the page already holds, which would hand the canvas a
  // short page and make it ask again at once; a round that leaves room reads
  // on until the page is full or the index ends.
  for (let round = 0; round < MAX_ROUNDS && items.length < limit; round += 1) {
    const page = await readTitles(archive, {
      query,
      offset: cursor,
      limit: limit - items.length,
    });
    if (page.titles.length === 0) {
      hasMore = false;
      break;
    }

    const articles = await summaries(language, page.titles);
    const found = page.titles.map((title) => articles.get(title) ?? null);
    const covers = await keepStills(
      found.map((article) => article?.thumbnail ?? null),
    );
    const colours = await coloursOf(covers);

    for (const [index, title] of page.titles.entries()) {
      const article = found[index] ?? null;
      // Filed under the article it turned out to be, not the title that named
      // it: the index lists redirects beside the articles they lead to, and
      // Wikipedia answers every one of them with the same page. Filed under the
      // asked-for title, "9/11 attacks" and "September 11 attacks" were two
      // cards of one article, each owed its own note.
      const name = article?.title ?? title;
      const id = itemIdOf(name);
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);

      const cover = covers[index] ?? null;
      const extract = article?.extract ?? null;
      items.push({
        id,
        title: name,
        overview: extract
          ? extract.slice(0, MAX_OVERVIEW)
          : (article?.description ?? null),
        cover,
        color: cover ? (colours[cover] ?? null) : null,
        url: pageUrl(language, name),
      });
    }

    cursor += page.titles.length;
    hasMore = page.hasMore;
    if (!hasMore) {
      break;
    }
  }

  return {
    kind: "wikipedia-catalogue",
    // The cursor is the row this page stopped on, not the cards it drew: this
    // catalogue skips redirect rows, so the two are not the same number and
    // only this one can be read on from.
    text: JSON.stringify({ items, known: [], hasMore, cursor }),
  };
}

/**
 * The id a card is filed under. A Salvage item id is letters, digits and
 * `._:-` only, and an article title is none of those things — `!`, `AC/DC`,
 * `Amsterdam Centraal station` — so the title is hashed into one. It stays the
 * same for a title from one release to the next, which is what keeps a note
 * attached to its card.
 */
export function itemIdOf(title: string): string {
  return createHash("sha256").update(title, "utf8").digest("hex");
}

/**
 * Markdown of one article: what it is, and what links to it.
 *
 * The articles that link to one are plain web links, not `[[wiki links]]`: in
 * Salvage a `[[name]]` means a note on this canvas, and a Wikipedia article is
 * not one, so it would be drawn as a link that goes nowhere. The address goes
 * to the article that exists.
 */
function articleText(read: {
  language: string;
  article: Article;
  backlinks: string[];
}): string {
  const { language, article, backlinks: links } = read;
  const lines = [`# ${article.title}`];
  if (article.description) {
    lines.push("", `*${article.description}*`);
  }
  if (article.extract) {
    lines.push("", article.extract.slice(0, MAX_EXTRACT));
  }
  if (links.length > 0) {
    lines.push("", "## Linked from");
    for (const title of links) {
      lines.push(`- [${title}](${pageUrl(language, title)})`);
    }
  }
  lines.push("", `[Read on Wikipedia](${pageUrl(language, article.title)})`);
  return lines.join("\n");
}

/**
 * What one entry's link says: the article's own introduction, and the articles
 * that link to it — which is what connects it to the rest of a canvas.
 */
async function article(subject: Subject | undefined): Promise<Data> {
  const read = await readArticle(subject?.link?.url);
  return {
    kind: "wikipedia-article",
    text: articleText(read),
  };
}

/**
 * The article a note is about: the one its link names, or the one its title
 * names when it has no link. This is the section the note keeps, which the app
 * writes once and leaves alone after the user edits it.
 */
async function noteArticle(
  subject: Subject | undefined,
  settings: Record<string, unknown>,
): Promise<Data> {
  if (subject?.link?.url) {
    return await article(subject);
  }

  const language =
    typeof settings.language === "string" &&
    /^[a-z-]{2,16}$/.test(settings.language)
      ? settings.language
      : "en";
  const title = (subject?.title ?? "").trim();
  if (!title) {
    throw new PluginError(
      "bad_subject",
      "This note has no title to look an article up by.",
    );
  }

  const found = (await summaries(language, [title])).get(title);
  if (!found) {
    throw new PluginError(
      "no_data",
      `Wikipedia has no article called “${title}”.`,
    );
  }

  const links = await backlinks(language, found.title).catch(() => []);
  return {
    kind: "wikipedia-article",
    text: articleText({ language, article: found, backlinks: links }),
  };
}

/**
 * The description and lead picture of the article an entry links to, answered
 * only for the fields a page's own preview lacked. One article is one call.
 */
async function preview(subject: Subject | undefined): Promise<Data> {
  const found = articleOf(subject?.link?.url);
  if (!found) {
    throw new PluginError(
      "bad_subject",
      "This entry does not link to a Wikipedia article.",
    );
  }

  const article = (await summaries(found.language, [found.title])).get(
    found.title,
  );
  if (!article) {
    throw new PluginError("no_data", "Wikipedia has no article by that name.");
  }

  return {
    kind: "link-preview",
    text: JSON.stringify({
      title: article.title,
      description:
        article.description ?? article.extract?.slice(0, MAX_OVERVIEW) ?? null,
      imageUrl: article.thumbnail,
    }),
  };
}

export default () =>
  serve(async ({ command, params }) => {
    if (command === "catalogue") {
      return await catalogue(params.settings ?? {}, params.paging);
    }
    if (command === "article") {
      return await article(params.subject);
    }
    if (command === "note-article") {
      return await noteArticle(params.subject, params.settings ?? {});
    }
    if (command === "preview") {
      return await preview(params.subject);
    }

    throw new PluginError("unsupported", `Unknown command ${command}.`);
  });

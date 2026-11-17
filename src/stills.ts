/**
 * A card's picture is the article's lead image, and its colour is read out of
 * that picture: Wikipedia reports neither, and the colour view sorts by it. Both
 * are kept in the plugin's own folder, the picture as a file the helper serves
 * back and the colour as a small map beside it, so one image is fetched and read
 * once in its life.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { inflateSync } from "node:zlib";

import { decode } from "jpeg-js";

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 1_500_000;
/** Enough of a sha256 to name one picture, and no more. */
const HASH_CHARS = 32;
const CONCURRENCY = 4;
const EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif", "gif"];
/** A decoded pixel is four channels, and the alpha is the last of them. */
const RGBA_CHANNELS = 4;
const ALPHA_INDEX = 3;
const OPAQUE_ALPHA = 255;
const TRANSPARENT_ALPHA = 128;
const SAMPLE_SIZE = 64;
const BUCKET_SHIFT = 4;
const CHANNEL_MAX = 255;
const HEX = /^#[0-9A-F]{6}$/;

/** The eight bytes every PNG opens with, and the least it can be. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PNG_HEAD_BYTES = 8;
/** A chunk is a length, a four-letter type, the body, then a CRC. */
const CHUNK_LENGTH_BYTES = 4;
const CHUNK_TYPE_BYTES = 4;
const CRC_BYTES = 4;
/** Where IHDR keeps its fields: size, then depth, kind and interlacing. */
const IHDR_WIDTH = 0;
const IHDR_HEIGHT = 4;
const IHDR_DEPTH = 8;
const IHDR_KIND = 9;
const IHDR_INTERLACE = 12;
/** A byte is what these decoders read, and eight bits is one of them. */
const BYTE = 0xff;
const BYTE_BITS = 8;
const BIT_SHIFT = 8;
const BIT_OFFSET = 16;
const BIT_LAST = 24;
const BIT_LAST_OFFSET = 32;
/** Eight bits per channel is what a thumbnail ships; anything else is refused. */
const DEPTH_8 = 8;
/** The colour kinds a PNG line can hold, and the channels each takes. */
const PNG_CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const PALETTE_ENTRY = 3;
/** A palette entry is three bytes, and one is at a time. */
const PALETTE_STEP = 3;
/** The four filters a line can name, besides leaving it alone. */
const FILTER_SUB = 1;
const FILTER_UP = 2;
const FILTER_AVERAGE = 3;
const FILTER_PAETH = 4;
/** The pair of filters that average two neighbours, and half of it. */
const HALF = 1;
const AVERAGE_SHIFT = 1;

function mediaDirectory(): string {
  return join(process.env.SALVAGE_PLUGIN_DATA ?? ".", "media");
}

function extensionOf(pathname: string): string | null {
  const last = pathname.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSIONS.includes(last) ? last : null;
}

/** The name one picture is filed under: a hash of its address, then its kind. */
export function stillName(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") {
    return null;
  }
  const extension = extensionOf(parsed.pathname);
  if (!extension) {
    return null;
  }
  const hash = createHash("sha256").update(url).digest("hex");
  return `${hash.slice(0, HASH_CHARS)}.${extension}`;
}

async function filed(name: string): Promise<boolean> {
  return Boolean(await stat(join(mediaDirectory(), name)).catch(() => null));
}

async function keepOne(url: string | null): Promise<string | null> {
  const name = url ? stillName(url) : null;
  if (!url || !name) {
    return null;
  }
  if (await filed(name)) {
    return name;
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "salvage-plugin-wikipedia/0.1.0" },
    });
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      return null;
    }
    if (!(response.headers.get("content-type") ?? "").startsWith("image/")) {
      await response.body?.cancel().catch(() => undefined);
      return null;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) {
      return null;
    }
    await mkdir(mediaDirectory(), { recursive: true });
    const part = join(mediaDirectory(), `${name}.part`);
    await writeFile(part, bytes).catch(() => undefined);
    await rename(part, join(mediaDirectory(), name)).catch(() => undefined);
    return name;
  } catch {
    return null;
  }
}

/** Files a page's pictures, a few at a time, in the same order. */
export async function keepStills(
  urls: (string | null)[],
): Promise<(string | null)[]> {
  const names: (string | null)[] = urls.map(() => null);
  let next = 0;

  const worker = async (): Promise<void> => {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= urls.length) {
        return;
      }
      names[index] = await keepOne(urls[index] ?? null);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker),
  );
  return names;
}

/** True for a colour in the form the canvas stores one, `#RRGGBB`. */
export function isColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

function channelOf(value: number): string {
  return Math.min(CHANNEL_MAX, Math.max(0, Math.round(value)))
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
}

/** A picture as these decoders hand one over: pixels in RGBA. */
type Picture = { width: number; height: number; data: Uint8Array };

function readU32(bytes: Uint8Array, at: number): number {
  return (
    ((bytes[at] ?? 0) << BIT_LAST) +
    ((bytes[at + 1] ?? 0) << BIT_OFFSET) +
    ((bytes[at + 2] ?? 0) << BYTE_BITS) +
    (bytes[at + 3] ?? 0)
  );
}

/** The neighbour a PNG's Paeth filter predicts from the three around it. */
function paeth(left: number, up: number, upLeft: number): number {
  const guess = left + up - upLeft;
  const toLeft = Math.abs(guess - left);
  const toUp = Math.abs(guess - up);
  const toCorner = Math.abs(guess - upLeft);
  if (toLeft <= toUp && toLeft <= toCorner) {
    return left;
  }
  return toUp <= toCorner ? up : upLeft;
}

/** Undoes the per-line filter a PNG applies before compressing. */
function unfiltered(
  raw: Uint8Array,
  width: number,
  height: number,
  channels: number,
): Uint8Array | null {
  const stride = width * channels;
  // One filter byte per line, then the line itself.
  if (raw.length < height * (1 + stride)) {
    return null;
  }

  const out = new Uint8Array(stride * height);
  for (let y = 0; y < height; y += 1) {
    const at = y * (1 + stride);
    const filter = raw[at] ?? 0;
    const line = y * stride;
    const previous = line - stride;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[at + 1 + x] ?? 0;
      const left = x >= channels ? (out[line + x - channels] ?? 0) : 0;
      const up = y > 0 ? (out[previous + x] ?? 0) : 0;
      const upLeft =
        y > 0 && x >= channels ? (out[previous + x - channels] ?? 0) : 0;
      let restored = value;
      if (filter === FILTER_SUB) {
        restored = value + left;
      } else if (filter === FILTER_UP) {
        restored = value + up;
      } else if (filter === FILTER_AVERAGE) {
        restored = value + ((left + up) >> AVERAGE_SHIFT);
      } else if (filter === FILTER_PAETH) {
        restored = value + paeth(left, up, upLeft);
      }
      out[line + x] = restored & BYTE;
    }
  }
  return out;
}

/** The palette entry a paletted PNG pixel names, or null past the palette. */
function paletteOf(
  palette: Uint8Array,
  index: number,
): [number, number, number] | null {
  const at = index * PALETTE_STEP;
  if (at + PALETTE_STEP > palette.length) {
    return null;
  }
  return [palette[at] ?? 0, palette[at + 1] ?? 0, palette[at + 2] ?? 0];
}

/** A PNG's pixels as RGBA, whatever kind of PNG it is. */
function rgbaOfPng(
  pixels: Uint8Array,
  width: number,
  height: number,
  kind: number,
  palette: Uint8Array | null,
  alpha: Uint8Array | null,
): Uint8Array | null {
  const channels = PNG_CHANNELS[kind];
  if (!channels) {
    return null;
  }

  const out = new Uint8Array(width * height * RGBA_CHANNELS);
  for (let i = 0; i < width * height; i += 1) {
    const at = i * channels;
    const to = i * RGBA_CHANNELS;
    let red = 0;
    let green = 0;
    let blue = 0;
    let opacity = OPAQUE_ALPHA;

    if (kind === 0 || kind === 4) {
      red = pixels[at] ?? 0;
      green = red;
      blue = red;
      opacity = kind === 4 ? (pixels[at + 1] ?? OPAQUE_ALPHA) : OPAQUE_ALPHA;
    } else if (kind === 2 || kind === 6) {
      red = pixels[at] ?? 0;
      green = pixels[at + 1] ?? 0;
      blue = pixels[at + 2] ?? 0;
      opacity = kind === 6 ? (pixels[at + 3] ?? OPAQUE_ALPHA) : OPAQUE_ALPHA;
    } else {
      const index = pixels[at] ?? 0;
      const entry = palette ? paletteOf(palette, index) : null;
      if (!entry) {
        return null;
      }
      [red, green, blue] = entry;
      opacity = alpha?.[index] ?? OPAQUE_ALPHA;
    }

    out[to] = red;
    out[to + 1] = green;
    out[to + 2] = blue;
    out[to + 3] = opacity;
  }
  return out;
}

/**
 * A PNG as a picture, or null for one this cannot read: sixteen bits a channel,
 * an interlaced file, or anything malformed. Thumbnails are eight-bit and
 * progressive-free, which is what a lead image almost always is.
 */
function decodePng(bytes: Uint8Array): Picture | null {
  if (bytes.length <= PNG_HEAD_BYTES) {
    return null;
  }
  for (let i = 0; i < PNG_SIGNATURE.length; i += 1) {
    if (bytes[i] !== PNG_SIGNATURE[i]) {
      return null;
    }
  }

  let width = 0;
  let height = 0;
  let kind = 0;
  let palette: Uint8Array | null = null;
  let alpha: Uint8Array | null = null;
  const parts: Uint8Array[] = [];

  let at = PNG_HEAD_BYTES;
  while (at + CHUNK_LENGTH_BYTES + CHUNK_TYPE_BYTES <= bytes.length) {
    const length = readU32(bytes, at);
    const type = String.fromCharCode(
      bytes[at + CHUNK_LENGTH_BYTES] ?? 0,
      bytes[at + CHUNK_LENGTH_BYTES + 1] ?? 0,
      bytes[at + CHUNK_LENGTH_BYTES + 2] ?? 0,
      bytes[at + CHUNK_LENGTH_BYTES + 3] ?? 0,
    );
    const start = at + CHUNK_LENGTH_BYTES + CHUNK_TYPE_BYTES;
    const end = start + length;
    if (end > bytes.length) {
      break;
    }

    if (type === "IHDR") {
      width = readU32(bytes, start + IHDR_WIDTH);
      height = readU32(bytes, start + IHDR_HEIGHT);
      kind = bytes[start + IHDR_KIND] ?? 0;
      const depth = bytes[start + IHDR_DEPTH] ?? 0;
      const interlace = bytes[start + IHDR_INTERLACE] ?? 0;
      if (depth !== DEPTH_8 || interlace !== 0) {
        return null;
      }
    } else if (type === "PLTE") {
      palette = bytes.subarray(start, end);
    } else if (type === "tRNS") {
      alpha = bytes.subarray(start, end);
    } else if (type === "IDAT") {
      parts.push(bytes.subarray(start, end));
    } else if (type === "IEND") {
      break;
    }

    at = end + CRC_BYTES;
  }

  if (width <= 0 || height <= 0 || parts.length === 0) {
    return null;
  }

  let raw: Uint8Array;
  try {
    raw = new Uint8Array(inflateSync(Buffer.concat(parts)));
  } catch {
    return null;
  }

  const channels = PNG_CHANNELS[kind];
  if (!channels) {
    return null;
  }
  const pixels = unfiltered(raw, width, height, channels);
  if (!pixels) {
    return null;
  }
  const data = rgbaOfPng(pixels, width, height, kind, palette, alpha);
  return data ? { width, height, data } : null;
}

/** A JPEG as a picture, or null when it cannot be decoded. */
function decodeJpeg(bytes: Uint8Array): Picture | null {
  if (
    bytes.length < 4 ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8 ||
    bytes[2] !== 0xff
  ) {
    return null;
  }

  try {
    const image = decode(bytes, { useTArray: true, maxMemoryUsageInMB: 96 });
    return image.width > 0 && image.height > 0
      ? { width: image.width, height: image.height, data: image.data }
      : null;
  } catch {
    return null;
  }
}

/**
 * The most common coarse colour of a picture, or null when it cannot be read.
 * A JPEG and a PNG are both read: a lead image is usually a photograph, but a
 * flag, a logo or an illustration is a PNG — and a Wikipedia thumbnail of an
 * SVG is one too — so a canvas had colours on its photographs and none on the
 * rest, in the very view that sorts by colour.
 */
export function leadingColorOf(bytes: Uint8Array): string | null {
  const image = decodeJpeg(bytes) ?? decodePng(bytes);
  if (!image) {
    return null;
  }

  const step = Math.max(
    1,
    Math.ceil(Math.max(image.width, image.height) / SAMPLE_SIZE),
  );
  const buckets = new Map<
    string,
    { count: number; r: number; g: number; b: number }
  >();
  for (let y = 0; y < image.height; y += step) {
    for (let x = 0; x < image.width; x += step) {
      const index = (y * image.width + x) * RGBA_CHANNELS;
      if (
        (image.data[index + ALPHA_INDEX] ?? OPAQUE_ALPHA) < TRANSPARENT_ALPHA
      ) {
        continue;
      }
      const r = image.data[index] ?? 0;
      const g = image.data[index + 1] ?? 0;
      const b = image.data[index + 2] ?? 0;
      const key = `${String(r >> BUCKET_SHIFT)}-${String(g >> BUCKET_SHIFT)}-${String(
        b >> BUCKET_SHIFT,
      )}`;
      const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      buckets.set(key, bucket);
    }
  }

  let best: { count: number; r: number; g: number; b: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) {
      best = bucket;
    }
  }
  return best
    ? `#${channelOf(best.r / best.count)}${channelOf(best.g / best.count)}${channelOf(best.b / best.count)}`
    : null;
}

/** The colour each picture of a page leads with, by the name it is filed under. */
export async function coloursOf(
  names: (string | null)[],
): Promise<Record<string, string>> {
  const colours: Record<string, string> = {};
  for (const name of names) {
    if (!name || colours[name]) {
      continue;
    }
    const bytes = await readFile(join(mediaDirectory(), name)).catch(
      () => null,
    );
    if (!bytes) {
      continue;
    }
    const hex = leadingColorOf(new Uint8Array(bytes));
    if (hex) {
      colours[name] = hex;
    }
  }
  return colours;
}

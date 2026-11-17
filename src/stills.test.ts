import { describe, expect, it } from "bun:test";
import { deflateSync } from "node:zlib";

import { leadingColorOf } from "./stills";

/** The eight bytes a PNG opens with. */
const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const BYTE_BITS = 8;
/** A 32-bit field is four bytes wide, and each of them shifts its neighbour. */
const FIELD_BYTES = 4;
const FIELD_SHIFT_3 = 24;
const FIELD_SHIFT_2 = 16;
const FIELD_SHIFT_1 = 8;
/** Where IHDR keeps a PNG's width, height and depth. */
const IHDR_HEIGHT = 4;
const IHDR_DEPTH = 8;
/** Colour kind 2 is RGB, with no palette and no alpha. */
const KIND_RGB = 2;
/** A chunk's body starts after its length and four-letter type. */
const CHUNK_BODY = 8;

function field(value: number): number[] {
  return [
    (value >> FIELD_SHIFT_3) & 0xff,
    (value >> FIELD_SHIFT_2) & 0xff,
    (value >> FIELD_SHIFT_1) & 0xff,
    value & 0xff,
  ];
}

function chunk(type: string, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(CHUNK_BODY + FIELD_BYTES + body.length);
  out.set(field(body.length), 0);
  for (let i = 0; i < FIELD_BYTES; i += 1) {
    out[FIELD_BYTES + i] = type.charCodeAt(i);
  }
  out.set(body, CHUNK_BODY);
  // The decoder reads the CRC only to skip it, so zeros will do here.
  return out;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

function header(width: number, height: number): Uint8Array {
  const out = new Uint8Array(13);
  out.set(field(width), 0);
  out.set(field(height), IHDR_HEIGHT);
  out[IHDR_DEPTH] = BYTE_BITS;
  out[IHDR_DEPTH + 1] = KIND_RGB;
  return out;
}

function png(width: number, height: number, raw: Uint8Array): Uint8Array {
  return concat([
    new Uint8Array(SIGNATURE),
    chunk("IHDR", header(width, height)),
    chunk("IDAT", new Uint8Array(deflateSync(raw))),
    chunk("IEND", new Uint8Array(0)),
  ]);
}

/** A PNG of one solid colour, eight bits a channel and no filter. */
function solidPng(
  width: number,
  height: number,
  rgb: [number, number, number],
): Uint8Array {
  const stride = width * 3;
  const raw = new Uint8Array(height * (1 + stride));
  for (let y = 0; y < height; y += 1) {
    const line = y * (1 + stride);
    raw[line] = 0;
    for (let x = 0; x < width; x += 1) {
      const at = line + 1 + x * 3;
      raw[at] = rgb[0];
      raw[at + 1] = rgb[1];
      raw[at + 2] = rgb[2];
    }
  }
  return png(width, height, raw);
}

/** A PNG whose one line is Sub filtered, which the reader has to undo. */
function subFilteredPng(rgb: [number, number, number]): Uint8Array {
  const width = 3;
  // Sub keeps the difference from the pixel to the left, so a flat line is the
  // colour once and then zeros.
  const raw = new Uint8Array(1 + width * 3);
  raw[0] = 1;
  raw[1] = rgb[0];
  raw[2] = rgb[1];
  raw[3] = rgb[2];
  return png(width, 1, raw);
}

describe("the colour a picture leads with", () => {
  it("is read out of a PNG, not only a JPEG", () => {
    expect(leadingColorOf(solidPng(4, 4, [18, 90, 200]))).toBe("#125AC8");
  });

  it("undoes the line filters a PNG applies", () => {
    expect(leadingColorOf(subFilteredPng([200, 30, 30]))).toBe("#C81E1E");
  });

  it("is the colour most of the picture is, not the first one seen", () => {
    const width = 4;
    // One pale pixel, then three of the same blue.
    const raw = new Uint8Array(1 + width * 3);
    raw.set([250, 250, 250, 20, 40, 160, 20, 40, 160, 20, 40, 160], 1);
    expect(leadingColorOf(png(width, 1, raw))).toBe("#1428A0");
  });

  it("is nothing at all for bytes that are not an image", () => {
    expect(leadingColorOf(new Uint8Array([1, 2, 3, 4, 5]))).toBeNull();
  });
});

/**
 * GDReplayFormat parser - initial GDR2 implementation.
 *
 * This module deliberately separates binary parsing from playback.
 * The parser currently validates the GDR2 magic and exposes low-level
 * varint helpers; input decoding will be added after validating the
 * complete format against real replay files.
 */

export class GDR2ParseError extends Error {
  constructor(message, offset = null) {
    super(offset === null ? message : `${message} (offset 0x${offset.toString(16)})`);
    this.name = "GDR2ParseError";
    this.offset = offset;
  }
}

export function readVarUint(bytes, state) {
  let value = 0;
  let shift = 0;

  while (state.offset < bytes.length) {
    const byte = bytes[state.offset++];
    value += (byte & 0x7f) * (2 ** shift);

    if ((byte & 0x80) === 0) {
      return value;
    }

    shift += 7;
    if (shift > 49) {
      throw new GDR2ParseError("Varint demasiado grande", state.offset);
    }
  }

  throw new GDR2ParseError("Varint incompleto", state.offset);
}

export function decodeUtf8(bytes) {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function parseGDR2(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);

  if (bytes.length < 4) {
    throw new GDR2ParseError("El archivo es demasiado pequeño");
  }

  // GDR2 files begin with the GDR magic followed by format version 2.
  if (bytes[0] !== 0x47 || bytes[1] !== 0x44 || bytes[2] !== 0x52) {
    throw new GDR2ParseError("No es un archivo GDR");
  }

  if (bytes[3] !== 0x02) {
    throw new GDR2ParseError(`Versión GDR no soportada: ${bytes[3]}`, 3);
  }

  const state = { offset: 4 };

  return {
    format: "gdr2",
    version: 2,
    size: bytes.length,
    state,
    bytes
  };
}

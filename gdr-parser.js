/**
 * GDReplayFormat GDR2 parser.
 *
 * Based on the published GDR2 file structure:
 * Header -> metadata -> deaths -> inputs.
 * Unknown extension blocks are skipped safely.
 */

export class GDR2ParseError extends Error {
  constructor(message, offset = null) {
    super(offset === null ? message : `${message} (offset 0x${offset.toString(16)})`);
    this.name = "GDR2ParseError";
    this.offset = offset;
  }
}

function fail(message, state) {
  throw new GDR2ParseError(message, state.offset);
}

export function readVarUint(bytes, state) {
  let value = 0;
  let shift = 0;

  while (state.offset < bytes.length) {
    const byte = bytes[state.offset++];
    value += (byte & 0x7f) * (2 ** shift);

    if ((byte & 0x80) === 0) return value;

    shift += 7;
    if (shift > 56) fail("Varint demasiado grande", state);
  }

  fail("Varint incompleto", state);
}

function readByte(bytes, state) {
  if (state.offset >= bytes.length) fail("Falta un byte", state);
  return bytes[state.offset++];
}

function readBytes(bytes, state, length) {
  if (!Number.isSafeInteger(length) || length < 0 || state.offset + length > bytes.length) {
    fail("Bloque de datos fuera de los límites", state);
  }

  const result = bytes.subarray(state.offset, state.offset + length);
  state.offset += length;
  return result;
}

export function readCString(bytes, state) {
  const start = state.offset;

  while (state.offset < bytes.length && bytes[state.offset] !== 0) {
    state.offset++;
  }

  if (state.offset >= bytes.length) fail("String sin terminador NUL", state);

  const value = decodeUtf8(bytes.subarray(start, state.offset));
  state.offset++;
  return value;
}

export function decodeUtf8(bytes) {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function readBool(bytes, state) {
  return readByte(bytes, state) !== 0;
}

function parsePackedInput(bytes, state, platformer) {
  const packed = readVarUint(bytes, state);

  // Avoid JavaScript bitwise operators here: they coerce numbers to signed
  // 32-bit integers. GDR2 varints can be larger than 32 bits.
  const down = Math.floor(packed / 2) % 2 === 1;
  let frameDelta;
  let button;

  if (platformer) {
    button = Math.floor(packed / 4) % 4;
    frameDelta = Math.floor(packed / 16);
  } else {
    button = 1;
    frameDelta = Math.floor(packed / 4);
  }

  return { frameDelta, button, down };
}

export function parseGDR2(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);

  if (bytes.length < 4) {
    throw new GDR2ParseError("El archivo es demasiado pequeño");
  }

  if (bytes[0] !== 0x47 || bytes[1] !== 0x44 || bytes[2] !== 0x52) {
    throw new GDR2ParseError("No es un archivo GDR");
  }

  const state = { offset: 3 };
  const version = readVarUint(bytes, state);

  if (version !== 2) {
    throw new GDR2ParseError(`Versión GDR no soportada: ${version}`, 3);
  }

  const inputTag = readCString(bytes, state);

  const replay = {
    format: "gdr2",
    version,
    inputTag,
    author: readCString(bytes, state),
    description: readCString(bytes, state),
    duration: readVarUint(bytes, state),
    gameVersion: readVarUint(bytes, state),
    framerate: readVarUint(bytes, state),
    seed: readVarUint(bytes, state),
    coins: readVarUint(bytes, state),
    ldm: readBool(bytes, state),
    platformer: readBool(bytes, state),
    bot: {
      name: readCString(bytes, state),
      version: readVarUint(bytes, state)
    },
    level: {
      id: readVarUint(bytes, state),
      name: readCString(bytes, state)
    }
  };

  const replayExtensionSize = readVarUint(bytes, state);
  readBytes(bytes, state, replayExtensionSize);

  const deathCount = readVarUint(bytes, state);
  const deaths = [];
  let deathFrame = 0;

  for (let i = 0; i < deathCount; i++) {
    deathFrame += readVarUint(bytes, state);
    deaths.push(deathFrame);
  }

  const inputCount = readVarUint(bytes, state);
  const p1InputCount = readVarUint(bytes, state);

  if (p1InputCount > inputCount) {
    fail("P1 Input Count es mayor que Input Count", state);
  }

  const inputs = [];
  const p1 = [];
  const p2 = [];

  // Each player's input frames are delta-encoded independently.
  for (let i = 0; i < inputCount; i++) {
    const player2 = i >= p1InputCount;
    const parsed = parsePackedInput(bytes, state, replay.platformer);

    const extensionSize = readVarUint(bytes, state);
    readBytes(bytes, state, extensionSize);

    const previous = player2
      ? (p2.length ? p2[p2.length - 1].frame : 0)
      : (p1.length ? p1[p1.length - 1].frame : 0);

    const event = {
      frame: previous + parsed.frameDelta,
      button: parsed.button,
      player2,
      down: parsed.down
    };

    (player2 ? p2 : p1).push(event);
    inputs.push(event);
  }

  // The format stores P1 inputs followed by P2 inputs, but consumers
  // should use chronological order.
  inputs.sort((a, b) => a.frame - b.frame || Number(a.player2) - Number(b.player2));

  return {
    ...replay,
    deaths,
    inputs,
    player1Inputs: p1,
    player2Inputs: p2,
    bytesRead: state.offset,
    trailingBytes: bytes.length - state.offset,
    size: bytes.length
  };
}

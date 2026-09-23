import { parseGDR2, GDR2ParseError } from "./gdr-parser.js";

const fileInput = document.querySelector("#file");
const loadButton = document.querySelector("#load");
const status = document.querySelector("#status");

loadButton.addEventListener("click", async () => {
  const file = fileInput.files?.[0];

  if (!file) {
    status.textContent = "Selecciona un archivo primero.";
    return;
  }

  try {
    const buffer = await file.arrayBuffer();

    if (file.name.toLowerCase().endsWith(".gdr2")) {
      replay = parseGDR2(buffer);

      status.textContent = [
        "✅ GDR2 válido",
        `Archivo: ${file.name}`,
        `Tamaño: ${replay.size.toLocaleString()} bytes`,
        `Versión: ${replay.version}`,
        `Autor: ${replay.author || "(sin autor)"}`,
        `Nivel: ${replay.level.name || "(sin nombre)"} [${replay.level.id}]`,
        `Game version: ${replay.gameVersion}`,
        `FPS: ${replay.framerate}`,
        `Duración: ${replay.duration} frames`,
        `Inputs: ${replay.inputs.length}`,
        `Muertes: ${replay.deaths.length}`,
        `Bytes restantes: ${replay.trailingBytes}`
      ].join("\n");

      return;
    }

    status.textContent =
      "⚠️ Archivo .gdr detectado. El parser GDR1 todavía no está implementado.";
  } catch (error) {
    const message = error instanceof GDR2ParseError
      ? error.message
      : String(error);

    status.textContent = `❌ Error: ${message}`;
  }
});

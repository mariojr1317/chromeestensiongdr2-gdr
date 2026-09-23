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
      const replay = parseGDR2(buffer);
      status.textContent =
        `GDR2 válido\nTamaño: ${replay.size} bytes\nVersión: ${replay.version}\nParser inicializado correctamente.`;
      return;
    }

    status.textContent =
      "Archivo .gdr detectado. El parser GDR1 se implementará después.";
  } catch (error) {
    const message = error instanceof GDR2ParseError
      ? error.message
      : String(error);

    status.textContent = `Error: ${message}`;
  }
});

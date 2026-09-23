import { parseGDR2, GDR2ParseError } from "./gdr-parser.js";

const fileInput=document.querySelector("#file");
const loadButton=document.querySelector("#load");
const stopButton=document.querySelector("#stop");
const status=document.querySelector("#status");

async function getActiveTab(){const tabs=await chrome.tabs.query({active:true,lastFocusedWindow:true});return tabs[0];}

loadButton.addEventListener("click",async()=>{const file=fileInput.files?.[0];if(!file){status.textContent="Selecciona un archivo .gdr2 primero.";return;}if(!file.name.toLowerCase().endsWith(".gdr2")){status.textContent="Por ahora la extensión reproduce .gdr2. GDR1 queda pendiente.";return;}try{const replay=parseGDR2(await file.arrayBuffer());const tab=await getActiveTab();if(!tab?.id){status.textContent="No se encontró la pestaña activa.";return;}await chrome.tabs.sendMessage(tab.id,{type:"GD_START_REPLAY",replay:{framerate:replay.framerate,duration:replay.duration,platformer:replay.platformer,inputs:replay.player1Inputs}});status.textContent="▶ Macro enviado\nInputs P1: "+replay.player1Inputs.length+"\nFPS: "+replay.framerate+"\nDuración: "+replay.duration+" frames";}catch(error){status.textContent="❌ "+(error instanceof GDR2ParseError?error.message:String(error));}});
stopButton.addEventListener("click",async()=>{try{const tab=await getActiveTab();if(tab?.id)await chrome.tabs.sendMessage(tab.id,{type:"GD_STOP_REPLAY"});status.textContent="⏹ Macro detenido.";}catch(error){status.textContent="No se pudo detener el macro en la pestaña activa.";}});
let replayTimer=null;let replayRunning=false;

function stopReplay(){replayRunning=false;if(replayTimer!==null){clearTimeout(replayTimer);replayTimer=null;}}

function getGameTarget(){return document.querySelector("canvas")||document.body;}

function dispatchMouseInput(target,input){const down=Boolean(input.down);const common={bubbles:true,cancelable:true,view:window,button:0,buttons:down?1:0,clientX:Math.floor(window.innerWidth/2),clientY:Math.floor(window.innerHeight/2)};target.dispatchEvent(new PointerEvent(down?"pointerdown":"pointerup",{...common,pointerId:1,pointerType:"mouse",isPrimary:true}));target.dispatchEvent(new MouseEvent(down?"mousedown":"mouseup",common));if(!down)target.dispatchEvent(new MouseEvent("click",common));}

function startReplay(replay){stopReplay();const inputs=[...replay.inputs].filter(input=>!input.player2).sort((a,b)=>a.frame-b.frame);if(!inputs.length)return;const fps=Number(replay.framerate)||60;const startTime=performance.now();let index=0;replayRunning=true;const tick=()=>{if(!replayRunning)return;const elapsedFrames=(performance.now()-startTime)*fps/1000;while(index<inputs.length&&inputs[index].frame<=elapsedFrames){dispatchMouseInput(getGameTarget(),inputs[index]);index++;}if(index>=inputs.length){replayRunning=false;replayTimer=null;return;}const delay=Math.max(0,((inputs[index].frame-elapsedFrames)*1000)/fps);replayTimer=setTimeout(tick,Math.min(delay,4));};tick();}

chrome.runtime.onMessage.addListener(message=>{if(message?.type==="GD_START_REPLAY")startReplay(message.replay);if(message?.type==="GD_STOP_REPLAY")stopReplay();});
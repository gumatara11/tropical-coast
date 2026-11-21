// Sound: a small WebAudio engine — no audio files. An engine hum whose
// pitch follows speed, a two-tone police siren while wanted, and a low
// thud on collisions. Everything is synthesized, everything is guarded:
// no AudioContext exists until the first user gesture, and the mute button
// (or M) silences the master gain. Safe to call before audio is ready.
var audioCtx = null, masterGain = null, engineOsc = null, engineGain = null;
var sirenOsc = null, sirenGain = null, sirenLfo = null, audioMuted = false;
function startAudio() {
  if (audioCtx) { if (audioCtx.state === 'suspended') audioCtx.resume(); return; }
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain(); masterGain.gain.value = audioMuted ? 0 : 0.5;
    masterGain.connect(audioCtx.destination);
    engineOsc = audioCtx.createOscillator(); engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 50;
    var engineFilter = audioCtx.createBiquadFilter(); engineFilter.type = 'lowpass'; engineFilter.frequency.value = 400;
    engineGain = audioCtx.createGain(); engineGain.gain.value = 0;
    engineOsc.connect(engineFilter); engineFilter.connect(engineGain); engineGain.connect(masterGain);
    engineOsc.start();
    sirenOsc = audioCtx.createOscillator(); sirenOsc.type = 'sine'; sirenOsc.frequency.value = 700;
    sirenLfo = audioCtx.createOscillator(); sirenLfo.type = 'square'; sirenLfo.frequency.value = 0.8;
    var sirenLfoGain = audioCtx.createGain(); sirenLfoGain.gain.value = 250;
    sirenLfo.connect(sirenLfoGain); sirenLfoGain.connect(sirenOsc.frequency);
    sirenGain = audioCtx.createGain(); sirenGain.gain.value = 0;
    sirenOsc.connect(sirenGain); sirenGain.connect(masterGain);
    sirenOsc.start(); sirenLfo.start();
  } catch (e) { audioCtx = null; }
}
// Called once per frame from the loop with the current speed and wanted
// level. The hum follows speed, the siren fades in only while wanted.
function updateAudio(kmh, wantedLevel) {
  if (!audioCtx || !engineOsc) return;
  var target = (kmh > 1) ? Math.min(0.12, 0.03 + kmh / 1500) : 0;
  engineGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.1);
  engineOsc.frequency.setTargetAtTime(50 + kmh * 1.2, audioCtx.currentTime, 0.1);
  sirenGain.gain.setTargetAtTime(wantedLevel > 0 ? 0.05 : 0, audioCtx.currentTime, 0.3);
}
function playThud() {
  if (!audioCtx || !masterGain) return;
  try {
    var osc = audioCtx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.15);
    var g = audioCtx.createGain();
    g.gain.setValueAtTime(0.4, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(g); g.connect(masterGain);
    osc.start(); osc.stop(audioCtx.currentTime + 0.22);
  } catch (e) {}
}
function toggleMute() {
  audioMuted = !audioMuted;
  if (masterGain) masterGain.gain.value = audioMuted ? 0 : 0.5;
  var btn = document.getElementById('muteBtn');
  if (btn) btn.textContent = audioMuted ? '🔇' : '🔊';
  return audioMuted;
}
window.addEventListener('keydown', function (e) { if (e.code === 'KeyM') toggleMute(); });
document.getElementById('muteBtn').addEventListener('click', toggleMute);

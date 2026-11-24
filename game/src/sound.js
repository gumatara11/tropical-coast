// Sound: a small WebAudio engine — no audio files. An engine hum whose
// pitch follows speed, a two-tone police siren while wanted, and a low
// thud on collisions. Everything is synthesized, everything is guarded:
// no AudioContext exists until the first user gesture, and the mute button
// (or M) silences the master gain. Safe to call before audio is ready.
var audioCtx = null, masterGain = null, engineOsc = null, engineGain = null;
var sirenOsc = null, sirenGain = null, sirenLfo = null, audioMuted = false;
var ambientOsc = null, ambientOsc2 = null, ambientGain = null;
// Round 26 (item 5): the radio was text only — "RADIO TROPICAL 98.6"
// with no sound source at all. A real island-pop loop now: a 16-step
// C-major melody over a 4-note bass, scheduled a little ahead from the
// frame loop. Deterministic notes, no audio files, no rnd().
var radioGain = null, radioStep = 0, radioNextT = 0;
var RADIO_MEL = [72, 0, 76, 0, 79, 0, 76, 72, 74, 0, 76, 0, 79, 76, 74, 0];
var RADIO_BASS = [48, 45, 43, 48];
function midiF(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function radioNote(midi, when, dur, type, vol) {
  var o = audioCtx.createOscillator(); o.type = type; o.frequency.value = midiF(midi);
  var g = audioCtx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(vol, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, when + dur);
  o.connect(g); g.connect(radioGain);
  o.start(when); o.stop(when + dur + 0.05);
}
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
    // Round 25 (bug #7): a quiet menu ambience — the menu was dead
    // silent even after the first gesture, because the engine hum is 0
    // at standstill and the siren is 0 with no wanted level. Two soft
    // detuned sines, barely there, only off the gameplay screens.
    ambientOsc = audioCtx.createOscillator(); ambientOsc.type = 'sine'; ambientOsc.frequency.value = 220;
    ambientOsc2 = audioCtx.createOscillator(); ambientOsc2.type = 'sine'; ambientOsc2.frequency.value = 277;
    ambientGain = audioCtx.createGain(); ambientGain.gain.value = 0;
    ambientOsc.connect(ambientGain); ambientOsc2.connect(ambientGain); ambientGain.connect(masterGain);
    ambientOsc.start(); ambientOsc2.start();
    // Round 26 (item 5): the radio bus — the melody scheduler in
    // updateAudio feeds this gain; silent on menus, on in game/drive.
    radioGain = audioCtx.createGain(); radioGain.gain.value = 0;
    radioGain.connect(masterGain);
    radioNextT = audioCtx.currentTime + 0.1;
  } catch (e) { audioCtx = null; }
}
// Called once per frame from the loop with the current speed and wanted
// level. The hum follows speed, the siren fades in only while wanted.
function updateAudio(kmh, wantedLevel) {
  if (!audioCtx || !engineOsc) return;
  // Round 26 (item 5): the old hum topped out at 0.12 gain (0.06 after
  // the master) and was dead silent at standstill — at phone volume
  // that reads as no sound at all. Louder now, plus a low idle rumble
  // while seated in a vehicle so the car is never mute.
  var inVeh = (typeof onFoot !== 'undefined' && !onFoot);
  var target = (kmh > 1) ? Math.min(0.18, 0.05 + kmh / 1200) : (inVeh ? 0.035 : 0);
  engineGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.1);
  engineOsc.frequency.setTargetAtTime(50 + kmh * 1.2, audioCtx.currentTime, 0.1);
  sirenGain.gain.setTargetAtTime(wantedLevel > 0 ? 0.10 : 0, audioCtx.currentTime, 0.3);
  // Round 25 (bug #7): ambience only on menu/splash/dialogue — silent
  // in game, where the engine + siren carry the sound.
  if (ambientGain) ambientGain.gain.setTargetAtTime((screen === 'game' || screen === 'drive') ? 0 : 0.035, audioCtx.currentTime, 0.5);
  // Round 26 (item 5): the radio actually plays now — schedule the
  // melody a little ahead of the playhead while in game/drive; the
  // gain fades out on menus so it never fights the ambience. If the
  // scheduler ever falls behind (background tab), re-anchor it instead
  // of firing a burst of catch-up notes.
  if (radioGain) {
    var radioOn = (screen === 'game' || screen === 'drive');
    radioGain.gain.setTargetAtTime(radioOn ? 0.06 : 0, audioCtx.currentTime, 0.3);
    if (radioOn) {
      if (radioNextT < audioCtx.currentTime - 0.5) radioNextT = audioCtx.currentTime + 0.05;
      while (radioNextT < audioCtx.currentTime + 0.3) {
        var mel = RADIO_MEL[radioStep % RADIO_MEL.length];
        if (mel > 0) radioNote(mel, radioNextT, 0.19, 'triangle', 0.5);
        if (radioStep % 4 === 0) radioNote(RADIO_BASS[Math.floor(radioStep / 4) % RADIO_BASS.length], radioNextT, 0.8, 'sine', 0.6);
        radioNextT += 0.21;
        radioStep++;
      }
    }
  }
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
// Round 19: a short sharp crack for gunfire.
function playShot() {
  if (!audioCtx || !masterGain) return;
  try {
    var osc = audioCtx.createOscillator(); osc.type = 'square';
    osc.frequency.setValueAtTime(900, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.09);
    var g = audioCtx.createGain();
    g.gain.setValueAtTime(0.25, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(g); g.connect(masterGain);
    osc.start(); osc.stop(audioCtx.currentTime + 0.12);
  } catch (e) {}
}
// Round 26 (item 6): two dry clicks for a manual reload — the R key
// would otherwise refill the magazine in total silence.
function playReload() {
  if (!audioCtx || !masterGain) return;
  try {
    [0, 0.09].forEach(function (off, i) {
      var osc = audioCtx.createOscillator(); osc.type = 'square';
      osc.frequency.value = i === 0 ? 1200 : 800;
      var g = audioCtx.createGain();
      var when = audioCtx.currentTime + off;
      g.gain.setValueAtTime(0.2, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.06);
      osc.connect(g); g.connect(masterGain);
      osc.start(when); osc.stop(when + 0.08);
    });
  } catch (e) {}
}
function toggleMute() {
  audioMuted = !audioMuted;
  if (masterGain) masterGain.gain.value = audioMuted ? 0 : 0.5;
  var btn = document.getElementById('muteBtn');
  if (btn) btn.textContent = audioMuted ? '🔇' : '🔊';
  // Round 29 (item 6): the Settings mute button kept its own label
  // ("Sound: ON") and never learned about M / the HUD button — so
  // after M muted, Settings still read ON, and tapping it UNMUTED
  // (label flipping to OFF while the music came back). Both labels
  // now follow the one flag, whichever control was used.
  var sbtn = document.getElementById('settingsMuteBtn');
  if (sbtn) sbtn.textContent = audioMuted ? 'Sound: OFF' : 'Sound: ON';
  return audioMuted;
}
window.addEventListener('keydown', function (e) { if (e.code === 'KeyM') toggleMute(); });
document.getElementById('muteBtn').addEventListener('click', toggleMute);
// Round 26 (item 5): any first touch/click resumes the context too —
// the canvas mousedown already did, but menu buttons and HUD buttons
// did not, so audio could stay suspended after a tap-only start.
document.addEventListener('pointerdown', function () { startAudio(); });

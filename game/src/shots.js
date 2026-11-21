// The four final screenshots: name, URL and what the frame must show.
// Shot 1 is the cover — the golden-hour chase, hero car big in the
// lower centre, low sun ahead, police flanking, dispatch panel up.
// The screenshot tooling opens each URL, waits for window.__shotReady,
// then captures. `shot=dialogue` stages Luna's line in the dialogue box
// so shot 3 is a real dialogue frame, not an empty beach.
var SHOTS = [
  { name: '1-chase-golden.jpg', url: '?cover=1&screen=game&spot=chase&v=golden', what: 'Cover: golden chase, big yellow COAST GT, sun ahead, 6 police + heli, dispatch panel' },
  { name: '2-promenade-day.jpg', url: '?cover=1&screen=game&spot=promenade&v=day', what: 'Day promenade: Gito on foot, city + beach + HUD (mission panel, minimap, weapons)' },
  { name: '3-luna-dialogue.jpg', url: '?cover=1&screen=game&spot=talk&v=day', what: 'Luna dialogue: Gito facing Luna on the promenade, dialogue box with Luna line "Gito! You\'re back!"' },
  { name: '4-vehicles.jpg', url: '?cover=1&screen=game&spot=bikesmany&v=day', what: 'Vehicles: red sport bike + mint Vespa + green sport in one frame, player coupe behind' }
];
// Stage a named shot after boot. No staging is needed for the four final
// shots: the 'talk' spot stages Luna's line in applyCoverSpot, the
// dialogue screen shows its own intro box, and the other spots are pure
// camera + world staging. (Calling showTalk on the dialogue screen would
// stack a second dialogue box over the screen's own — do not do that.)
function stageShot(name) {}
// Readiness signal for the screenshot tooling: the scene has rendered
// long enough for textures to be up, the sun rig settled and the police
// staged, so a capture now shows the finished frame instead of a
// half-loaded one. Time-based, not frame-counted — in the VM the game
// renders ~1 frame per second, so 150 frames would take minutes.
(function () {
  var start = performance.now();
  function tick() {
    if (performance.now() - start >= 8000) { window.__shotReady = true; return; }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

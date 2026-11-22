// Keyboard + touch controls. E enters a vehicle (or talks to the mission
// giver / advances dialogue); WASD and arrows drive and walk. The audio
// engine starts on the first keypress — browsers only allow sound after a
// user gesture.
var keys = {};
window.addEventListener('keydown', function (e) {
  keys[e.code] = true;
  if (e.code === 'KeyE') tryEnter();
  // Round 19: attack — Space punches / fires the selected weapon, keys
  // 1-7 pick a weapon. (The game shipped with weapon slots on the HUD
  // but no attack input at all, so Gito could not punch.)
  if (e.code === 'Space') { e.preventDefault(); tryAttack(); }
  if (e.code && e.code.indexOf('Digit') === 0) { var n = +e.code.slice(5); if (n >= 1 && n <= 7) weapon = n; }
  startAudio();
});
window.addEventListener('keyup', function (e) { keys[e.code] = false; });
// Mouse click on the 3D view attacks too.
document.getElementById('c').addEventListener('mousedown', function () { startAudio(); tryAttack(); });
function bindCtl(id, code) {
  var el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('touchstart', function (e) { e.preventDefault(); keys[code] = true; startAudio(); });
  el.addEventListener('touchend', function () { keys[code] = false; });
}
bindCtl('cl1', 'KeyA'); bindCtl('cl2', 'KeyD'); bindCtl('cr1', 'KeyW'); bindCtl('cr2', 'KeyS');
// Round 19: the attack button — big, on the right above the menu key,
// tap (touch) or click (mouse) to punch / fire. Touchstart + mousedown
// (not click) so one tap fires exactly once.
var atkEl = document.getElementById('atk');
if (atkEl) {
  atkEl.addEventListener('touchstart', function (e) { e.preventDefault(); startAudio(); tryAttack(); });
  atkEl.addEventListener('mousedown', function (e) { e.preventDefault(); startAudio(); tryAttack(); });
}
// Tapping a weapon slot selects it (delegated — the HUD rebuilds the
// slots, the container listener survives).
var weaponsBarEl = document.getElementById('weapons');
if (weaponsBarEl) weaponsBarEl.addEventListener('click', function (e) {
  var d = e.target.closest ? e.target.closest('div') : null;
  if (!d) return;
  var idx = Array.prototype.indexOf.call(weaponsBarEl.children, d);
  if (idx >= 0 && idx < 7) weapon = idx + 1;
});

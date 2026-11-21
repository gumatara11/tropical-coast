// Keyboard + touch controls. E enters a vehicle (or talks to the mission
// giver / advances dialogue); WASD and arrows drive and walk. The audio
// engine starts on the first keypress — browsers only allow sound after a
// user gesture.
var keys = {};
window.addEventListener('keydown', function (e) {
  keys[e.code] = true;
  if (e.code === 'KeyE') tryEnter();
  startAudio();
});
window.addEventListener('keyup', function (e) { keys[e.code] = false; });
function bindCtl(id, code) {
  var el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('touchstart', function (e) { e.preventDefault(); keys[code] = true; startAudio(); });
  el.addEventListener('touchend', function () { keys[code] = false; });
}
bindCtl('cl1', 'KeyA'); bindCtl('cl2', 'KeyD'); bindCtl('cr1', 'KeyW'); bindCtl('cr2', 'KeyS');

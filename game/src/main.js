// Bootstrap: resize handling, the debug accessor, shot staging, and the
// first frame() call that starts the loop. All world state lives in the
// modules loaded before this one; this file only wires them together.
// Resize: keep the renderer and the camera aspect matched to the window.
window.addEventListener('resize', function () {
  var W2 = window.innerWidth, H2 = window.innerHeight;
  renderer.setSize(W2, H2);
  cam.aspect = W2 / H2;
  cam.updateProjectionMatrix();
});
// Debug accessor for probes and the screenshot tooling: live player state
// without touching the DOM.
window.__tc = {
  get px() { return px; }, get pz() { return pz; },
  get heading() { return heading; }, get speed() { return speed; },
  get kmh() { return Math.round(Math.abs(speed) * 3.6); },
  get onFoot() { return onFoot; }, get rideMode() { return rideMode; },
  get wanted() { return wanted; }, get health() { return health; },
  get armour() { return armour; },
  get money() { return money; }, get missionIdx() { return missionIdx; },
  get missionStage() { return missionStage; },
  get talking() { return talking; },
  get screen() { return screen; }, get variant() { return variant; },
  get cover() { return cover; },
  get carCond() { return carCond; },
  get copShots() { return copShots; }, get copHits() { return copHits; },
  get officers() { return officers.map(o => ({ x: +o.position.x.toFixed(1), z: +o.position.z.toFixed(1), rot: +o.rotation.y.toFixed(2) })); },
  get policeCars() { return [police, police2, police3, police4, police5, police6].map(o => ({ x: +o.position.x.toFixed(1), z: +o.position.z.toFixed(1) })); },
  get crossCars() { return crossTraffic.map(o => ({ x: +o.position.x.toFixed(1), z: +o.position.z.toFixed(1) })); },
  get footSpeed() { return footSpeed; }, get walkPhase() { return walkPhase; },
  get runHeld() { return !!(keys.ShiftLeft || keys.ShiftRight); },
  get carX() { return carX; }, get carZ() { return carZ; }, get carHeading() { return carHeading; },
  get camFov() { return cam.fov; },
  shots: SHOTS
};
// Stage a named screenshot scene (see shots.js), then start the loop.
var shotName = qs.get('shot');
if (shotName) stageShot(shotName);
frame();

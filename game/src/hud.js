// HUD in 3D and 2D: the cyan "enter car" arrow, the destination beacon,
// the collision spark, the speedometer gauge, the minimap, the mission
// panel, wanted stars, weapon slots, radio line and police dispatch.
// Plus the rider staging poses (stagePose / stageSeat) shared by the
// cover shots and the live riding gameplay.
var enterArrow = new THREE.Group();
(function () {
  var am = new THREE.MeshBasicMaterial({ color: 0x0090ff });
  var cone = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 4), am);
  cone.rotation.x = Math.PI; cone.position.y = -0.3; enterArrow.add(cone);
  var glow = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.05, 4), new THREE.MeshBasicMaterial({ color: 0x0090ff, transparent: true, opacity: 0.30, side: THREE.DoubleSide, depthWrite: false }));
  glow.rotation.x = Math.PI; glow.position.y = -0.3; enterArrow.add(glow);
  var stem = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), am);
  stem.position.y = 0.4; enterArrow.add(stem);
  enterArrow.visible = false; scene.add(enterArrow);
})();
var beacon = new THREE.Group();
(function () {
  var ring = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.15, 24), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.7 }));
  ring.position.y = 0.1; beacon.add(ring);
  var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 14, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
  beam.position.y = 7; beacon.add(beam);
  beacon.visible = false; scene.add(beacon);
})();
var spark = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ color: 0xffe94a, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
spark.visible = false; scene.add(spark);

// Speedometer: a pink arc with a white needle over a faint track.
var gauge = document.getElementById('gauge'), spdNum = document.getElementById('spdNum');
var gaugeBoxEl = document.getElementById('gaugeBox');
var gtx = gauge.getContext('2d');
function drawGauge(kmh) {
  gtx.clearRect(0, 0, 240, 130);
  gtx.lineWidth = 12; gtx.lineCap = 'round';
  var grad = gtx.createLinearGradient(10, 0, 230, 0);
  grad.addColorStop(0, '#ff8ac8'); grad.addColorStop(0.5, '#ff5a9a'); grad.addColorStop(1, '#ff2a8a');
  gtx.strokeStyle = 'rgba(255,255,255,0.25)';
  gtx.beginPath(); gtx.arc(120, 115, 95, Math.PI, 2 * Math.PI); gtx.stroke();
  gtx.strokeStyle = grad;
  gtx.beginPath(); gtx.arc(120, 115, 95, Math.PI, Math.PI + Math.PI * Math.min(kmh / 200, 1)); gtx.stroke();
  var na = Math.PI + Math.PI * Math.min(kmh / 200, 1);
  gtx.strokeStyle = '#ffffff'; gtx.lineWidth = 4;
  gtx.beginPath(); gtx.moveTo(120, 115); gtx.lineTo(120 + Math.cos(na) * 80, 115 + Math.sin(na) * 80); gtx.stroke();
}
// Minimap: green land, blue sea, sand promenade, grey roads, gold dashes,
// yellow player dot, gold mission dot, blue police dots, white traffic dots.
var mm = document.getElementById('minimap');
var mtx = mm.getContext('2d');
// Round 26 (item 6): the map painter takes its context, so the
// fullscreen map draws the exact same picture at 3x — one painter,
// two canvases, never two diverging maps. drawMap keeps the HUD
// minimap; drawBigMap (below) feeds the fullscreen overlay.
function paintMap(c) {
  // Round 24 (bug #6): the minimap used to show only x -37..+37, so
  // Avenue 2, Avenue 3 and the whole west grid were invisible — the
  // map LOOKED one-directional even on the HUD. Full-grid scale now:
  // mx = 8 + (x+164)*0.8 (x -164..30), my = 8 + (z+205)*0.38.
  c.clearRect(0, 0, 170, 170);
  c.fillStyle = '#2a8a4a'; c.fillRect(0, 0, 170, 170);
  c.fillStyle = '#4a4a5a'; c.fillRect(0, 0, 133, 170);
  c.fillStyle = '#1a7ac8'; c.fillRect(163, 0, 7, 170);
  c.fillStyle = '#e8cf9a'; c.fillRect(150, 0, 13, 170);
  c.fillStyle = '#3a3a4a';
  c.fillRect(133, 0, 13, 170);
  c.fillRect(110, 0, 8, 170);
  c.fillRect(71, 0, 8, 170);
  c.fillRect(33, 0, 8, 170);
  [-163, -61, 41, 143].forEach(function (cz) { c.fillRect(8, 8 + (cz + 205) * 0.38 - 2, 138, 4); });
  c.fillStyle = '#ffd23f';
  for (var i = 0; i < 8; i++) c.fillRect(139, 10 + i * 20, 2, 10);
  function dot(x, z, col, r) {
    var mx = 8 + (x + 164) * 0.8, my = 8 + (z + 205) * 0.38;
    if (mx < 4 || mx > 166 || my < 4 || my > 166) return;
    c.fillStyle = col; c.beginPath(); c.arc(mx, my, r || 4, 0, 6.29); c.fill();
  }
  // Round 27 (Minimap): the mission dot was the same gold and size as
  // the player dot — unreadable. Mission now: white ring + gold core,
  // bigger; the player dot gains a dark outline so it never melts into
  // the gold dashes.
  function ringDot(x, z, col, r) {
    var mx = 8 + (x + 164) * 0.8, my = 8 + (z + 205) * 0.38;
    if (mx < 4 || mx > 166 || my < 4 || my > 166) return;
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(mx, my, r + 2.5, 0, 6.29); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(mx, my, r, 0, 6.29); c.fill();
  }
  dot(px, pz, '#1a1a1a', 6.5);
  dot(px, pz, '#ffd21a', 5);
  var cm4 = curMission();
  if (cm4 && !cover) {
    if (missionStage === 'talk') ringDot(cm4.giverObj.position.x, cm4.giverObj.position.z, '#ffd23f', 5.5);
    else if (cm4.check && cm4.check.x !== undefined) ringDot(cm4.check.x, cm4.check.z, '#ffd23f', 5.5);
  }
  dot(police.position.x, police.position.z, '#2a6aff', 4);
  dot(police2.position.x, police2.position.z, '#2a6aff', 4);
  dot(police3.position.x, police3.position.z, '#2a6aff', 4);
  dot(police4.position.x, police4.position.z, '#2a6aff', 4);
  dot(police5.position.x, police5.position.z, '#2a6aff', 4);
  dot(police6.position.x, police6.position.z, '#2a6aff', 4);
  traffic.forEach(function (t) { dot(t.position.x, t.position.z, '#ffffff', 3); });
  aveTraffic.forEach(function (t) { dot(t.position.x, t.position.z, '#ffffff', 3); });
  ave3Traffic.forEach(function (t) { dot(t.position.x, t.position.z, '#ffffff', 3); });
  officers.forEach(function (o) { dot(o.position.x, o.position.z, '#2a6aff', 3); });
  crossTraffic.forEach(function (t) { dot(t.position.x, t.position.z, '#ffffff', 3); });
  peds.forEach(function (pd) { dot(pd.position.x, pd.position.z, '#ff8ac8', 2); });
}
function drawMap() { paintMap(mtx); }

var missionPanelEl = document.getElementById('missionPanel');
var districtEl = document.getElementById('district');
var starsEl = document.getElementById('stars');
var carInfoEl = document.getElementById('carInfo');
var radioEl = document.getElementById('radio');
var dispatchEl = document.getElementById('dispatch');
var clockEl = document.getElementById('clock');
var reticleEl = document.getElementById('reticle');
var lastClockMin = -1;
function districtAt(x, z) {
  if (x >= 30) return 'OCEAN';
  if (x >= 14) return 'BEACH';
  // Round 24 (bug #6): West Market — the market square on the north
  // side of Coral St, just east of Avenue 3.
  if (x >= -124 && x <= -110 && z >= -76 && z <= -55) return 'WEST MARKET';
  if (x <= -110) return 'WESTSIDE';
  if (x <= -60 && x >= -110) {
    if (z < -145) return 'PELABUHAN';
    if (z < -60) return 'RESIDENTIAL';
    if (z < 40) return 'CITY CENTER';
    if (z < 120) return 'INDUSTRIAL';
    if (z < 145) return 'NIGHT CLUB';
    return 'SUNSET HILL';
  }
  if (x >= -13 && x <= 13) return 'PROMENADE';
  if (x >= -40 && x <= -24) return 'AVENUE 1';
  if (x >= -88 && x <= -72) return 'AVENUE 2';
  return 'CITY CENTER';
}
function streetAt(x, z) {
  if (x >= -8 && x <= 8) return 'COAST ROAD';
  if (x >= -37 && x <= -27) return 'AVENUE 1';
  if (x >= -85 && x <= -75) return 'AVENUE 2';
  if (x >= -133 && x <= -123) return 'AVENUE 3';
  if (x >= 14 && x < 30) return 'MARINA ROW';
  if (x >= 30) return 'OPEN WATER';
  // Round 24 (bug #6): the cross streets have names now, not 'CROSS ST'.
  var crossNames = ['PALM ROW', 'CORAL STREET', 'SUNSET BOULEVARD', 'HARBOR LANE'];
  for (var i = 0; i < crossZs.length; i++) if (z >= crossZs[i] - 5 && z <= crossZs[i] + 5) return crossNames[i];
  return '';
}
// Weapon slots: diagonal SVG gun silhouettes (a horizontal gun reads as a
// "T" at 30 px), the pistol's ammo is the real loadout, fists are infinite.
var WEAPONS = [
  { n: 1, name: 'PISTOL', icon: '<svg viewBox="0 0 24 24"><g transform="translate(12 12) rotate(-45) scale(0.78) translate(-12 -12)"><path d="M2 5h20v3.2H12l-2 9.8H6.2L8 8.2H2V5z"/><rect x="13.5" y="8.6" width="1.8" height="3"/></g></svg>', ammo: function () { return ammo + '/' + reserve; } },
  { n: 2, name: 'SMG', icon: '<svg viewBox="0 0 24 24"><g transform="translate(12 12) rotate(-45) scale(0.78) translate(-12 -12)"><path d="M1 5h22v3.5H15l-1 10.5H10.5L11.5 8.5H9l-.8 5.5H5l.8-5.5H1V5z"/></g></svg>', ammo: function () { return smgAmmo + '/' + smgReserve; } },
  { n: 3, name: 'SHOTGUN', icon: '<svg viewBox="0 0 24 24"><g transform="translate(12 12) rotate(-45) scale(0.78) translate(-12 -12)"><path d="M1 5.5h22v2.8H14.5l-.5 3.7h-3l.5-3.7H8.5L8 13.5H5L5.5 8.3H1V5.5z"/><rect x="15" y="9" width="5.5" height="2.6"/></g></svg>', ammo: function () { return sgAmmo + '/' + sgReserve; } },
  { n: 4, name: 'RIFLE', icon: '<svg viewBox="0 0 24 24"><g transform="translate(12 12) rotate(-45) scale(0.78) translate(-12 -12)"><rect x="9" y="2.5" width="6" height="2.5"/><path d="M1 5.5h21v3H17l-1 5.5H12.5L13.5 8.5H8l-.8 6H3.8L4.6 8.5H1V5.5z"/></g></svg>', ammo: function () { return rfAmmo + '/' + rfReserve; } },
  { n: 5, name: 'SNIPER', icon: '<svg viewBox="0 0 24 24"><g transform="translate(12 12) rotate(-45) scale(0.78) translate(-12 -12)"><rect x="8" y="2" width="8" height="3"/><path d="M1 6h22v2.5H14l-.8 4.5h-3l.8-4.5H6.5L6 13.5H2.8L3.3 8.5H1V6z"/></g></svg>', ammo: function () { return snAmmo + '/' + snReserve; } },
  { n: 6, name: 'BAT', icon: '<span class="wicon">🏏</span>', ammo: function () { return '∞'; } },
  { n: 7, name: 'FIST', icon: '<span class="wicon">👊</span>', ammo: function () { return '∞'; } }
];
var weaponsEl = document.getElementById('weapons');
var gunEl = document.getElementById('gun');
var healthBarEl = document.getElementById('healthBar');
var armourBarEl = document.getElementById('armourBar');
var healthNumEl = document.getElementById('healthNum');
var armourNumEl = document.getElementById('armourNum');
// Round 19: the HUD used to rebuild weapons + mission + dispatch + gun
// innerHTML EVERY frame. Now each rebuilds only when its string changes
// (dispatch distance rounded to 5 m, mission timer ticks once a second),
// and the highlight + gun chip follow the selected weapon.
var lastWeaponsHtml = null, lastMissionHtml = null, lastDispatchHtml = null, lastGunHtml = null, lastStarsHtml = null;
function updateHudExtra() {
  var m = curMission();
  var stageKey = missionIdx + '/' + missionStage;
  if (stageKey !== lastStageKey) { lastStageKey = stageKey; stageStartT = t; }
  var el = Math.max(0, Math.floor(t - stageStartT));
  var mm2 = Math.floor(el / 60), ss = el % 60;
  var timerTxt = '⏱ ' + (mm2 < 10 ? '0' : '') + mm2 + ':' + (ss < 10 ? '0' : '') + ss;
  if (missionPanelEl) {
    var done = m ? (missionIdx * 2 + (missionStage === 'do' ? 1 : 0)) : 6;
    var segs = '';
    for (var gi = 0; gi < 6; gi++) segs += '<span class="seg' + (gi < done ? ' on' : '') + '"></span>';
    if (!m) { var mph = '<b>FREE ROAM</b><span class="mtitle">All Missions Complete!</span><span>★ Enjoy Tropical Coast!</span><div class="stagebar">' + segs + '</div><span class="mtimer">' + timerTxt + '</span>'; }
    else {
      var stg = missionStage === 'talk' ? '1/2' : '2/2';
      var obj = missionStage === 'talk' ? 'Talk to ' + m.giver : m.objective;
      // Round 25 (bug #3): show how far the target is — the panel used
      // to say only "Talk to Luna" while she stood 74 m away.
      var tgtD = missionStage === 'talk' ? Math.round(Math.hypot(m.giverObj.position.x - px, m.giverObj.position.z - pz)) : (m.check && m.check.x !== undefined ? Math.round(Math.hypot(m.check.x - px, m.check.z - pz)) : null);
      if (tgtD !== null) obj += ' · ' + tgtD + 'm';
      var nxt = missionStage === 'talk' ? m.objective : (missions[missionIdx + 1] ? missions[missionIdx + 1].name : 'Free roam');
      var mph = '<b>MISSION ' + (missionIdx + 1) + ' · STAGE ' + stg + '</b><span class="mtitle">' + m.name + '</span><span>★ ' + obj + '</span><span class="mnext">NEXT ' + nxt + '</span><div class="stagebar">' + segs + '</div><span class="mtimer">' + timerTxt + '</span>';
    }
    if (mph !== lastMissionHtml) { missionPanelEl.innerHTML = mph; lastMissionHtml = mph; }
  }
  if (districtEl) { var da = districtAt(px, pz), sa = streetAt(px, pz); districtEl.textContent = (sa && sa !== da) ? sa + ' · ' + da : da; }
  if (clockEl) { var cmin = 16 * 60 + Math.floor(t); if (cmin !== lastClockMin) { lastClockMin = cmin; var ch = Math.floor(cmin / 60) % 24, cm2 = cmin % 60; clockEl.textContent = (ch < 10 ? '0' : '') + ch + ':' + (cm2 < 10 ? '0' : '') + cm2; } }
  if (starsEl) { var st = ''; for (var si = 0; si < 5; si++) st += si < wanted ? '★' : '<span class="dim">★</span>'; if (st !== lastStarsHtml) { starsEl.innerHTML = st; lastStarsHtml = st; } }
  if (carInfoEl) { var cn = carMesh.userData.driveName || (carMesh === parked1 ? 'CRIMSON GT' : (carMesh === parked2 ? 'AZURE GT' : 'COAST GT')); carInfoEl.textContent = cn + ' · CONDITION ' + carCond + '%'; carInfoEl.style.display = onFoot ? 'none' : 'block'; }
  if (radioEl) radioEl.textContent = '♪ RADIO TROPICAL 98.6 — Island Pop';
  if (healthBarEl) healthBarEl.style.width = health + '%';
  if (armourBarEl) armourBarEl.style.width = (armour / 50 * 100) + '%';
  if (healthNumEl) healthNumEl.textContent = Math.round(health);
  if (armourNumEl) armourNumEl.textContent = Math.round(armour);
  if (gunEl) { var wpn19 = WEAPON_DEFS[weapon]; var wa19 = weaponAmmo(); var gh = wpn19.gun ? '🔫 ' + wpn19.name + '<br>' + wa19.a + ' / ' + wa19.r : (weapon === 6 ? '🏏 BAT' : '👊 FIST') + '<br>∞'; if (window.__reloadFlash) gh += '<br>↻ RELOADING…'; if (gh !== lastGunHtml) { gunEl.innerHTML = gh; lastGunHtml = gh; } }
  if (weaponsEl) {
    var wh = '';
    WEAPONS.forEach(function (w) { wh += '<div' + (w.n === weapon ? ' class="on"' : '') + '>' + w.icon + '<b>' + w.n + '</b>' + w.name + '<br><em>' + w.ammo() + '</em></div>'; });
    if (wh !== lastWeaponsHtml) { weaponsEl.innerHTML = wh; lastWeaponsHtml = wh; }
  }
  if (dispatchEl) {
    if (wanted > 0) {
      // Round 26 (item 3): the panel shows ONLY the units that are
      // actually responding (policeResponse, same table as render.js)
      // — 2 cars at 1 star, one more car per star, the heli only from
      // 3 stars, plus the chasing foot officers in the footer.
      var resp26 = policeResponse(wanted);
      var units = [
        ['KITE-1', police, 'PURSUIT', 'pur'],
        ['MARLIN-3', police2, 'FLANKING', 'flank'],
        ['FALCON-2', police3, 'RAMMING', 'ram'],
        ['VIPER-5', police4, 'INTERCEPT', 'inter'],
        ['HARBOR-7', police5, 'ROADBLOCK', 'block'],
        ['COBRA-8', police6, 'BACKUP', 'pur']
      ].slice(0, resp26.cars);
      if (resp26.heli) units.push(['AIR ONE', heli, 'SPOTLIGHT', 'spot']);
      var dh = '<b>POLICE DISPATCH <span class="live">● LIVE</span></b>';
      var st7 = '';
      for (var si7 = 0; si7 < 5; si7++) st7 += si7 < wanted ? '★' : '<span class="dim">★</span>';
      dh += '<span class="dsub">' + st7 + ' · UNITS RESPONDING: ' + resp26.total + '</span>';
      units.forEach(function (u) {
        var dd = Math.round(Math.hypot(u[1].position.x - px, u[1].position.z - pz) / 5) * 5;
        var bw = Math.max(8, Math.round(100 - dd * 1.2));
        dh += '<span class="drow"><i>' + u[0] + '</i><span class="dbar"><i style="width:' + bw + '%"></i></span><b class="chip ' + u[3] + '">' + u[2] + '</b><em>' + dd + 'm</em></span>';
      });
      dh += '<span class="more">+' + resp26.officers + ' foot officers · DELTA-9 PURSUIT</span>';
      dispatchEl.style.display = 'block';
      if (dh !== lastDispatchHtml) { dispatchEl.innerHTML = dh; lastDispatchHtml = dh; }
    } else dispatchEl.style.display = 'none';
  }
  // Round 26 (item 6): the 🗺 button only exists in game/drive, like
  // the mute button (body.mode-game / mode-drive show it; the base
  // stylesheet hides .hud/.ctl on splash/menu/dialogue anyway).
  if (typeof mapBtnEl !== 'undefined' && mapBtnEl) mapBtnEl.style.display = (screen === 'game' || screen === 'drive') ? 'block' : 'none';
}

// Staging poses for the cover shots (and live riding): hips, knees,
// shoulders, elbows and head from one pose object. Knee = leg.children[1].
// Elbow here is arm.children[1] — the sleeve mesh, not the elbow group:
// the built elbow bend (-0.25) already carries the pose, and the verified
// staging shots were posed with this exact indexing, so it stays as-is.
// Negative rotation.x swings a limb toward the character's front. Lean
// uses YXZ euler order — under the default XYZ a rotation.x would roll
// the body sideways once yaw is on.
function stagePose(o) {
  var u = gito.userData;
  var kneeL = u.legL.children[1], kneeR = u.legR.children[1];
  var elbL = u.armL.children[1], elbR = u.armR.children[1];
  if (o.hip !== undefined) { u.legL.rotation.x = o.hip; u.legR.rotation.x = o.hip; }
  if (o.knee !== undefined) { kneeL.rotation.x = o.knee; kneeR.rotation.x = o.knee; }
  if (o.shoulder !== undefined) { u.armL.rotation.x = o.shoulder; u.armR.rotation.x = o.shoulder; }
  if (o.elbow !== undefined) { elbL.rotation.x = o.elbow; elbR.rotation.x = o.elbow; }
  if (o.head !== undefined) { u.head.rotation.x = o.head; }
  var spread = (o.spread !== undefined) ? o.spread : 0.18;
  u.armL.rotation.z = spread; u.armR.rotation.z = -spread;
}
// World position of a point given in a vehicle's local coords.
function vehPoint(v, lx, lz) {
  var h = v.rotation.y;
  return { x: v.position.x + lx * Math.cos(h) + lz * Math.sin(h), z: v.position.z - lx * Math.sin(h) + lz * Math.cos(h) };
}
// Place Gito seated on a vehicle: hips land on the seat (seatTopY world y,
// seat local x/z), torso leaned forward by `lean`. The lean pivots at the
// group origin, so the group shifts back along the facing direction by
// 0.95*sin(lean) to keep the hips on the seat.
function stageSeat(v, seatLX, seatLZ, seatTopY, lean, pose) {
  var seat = vehPoint(v, seatLX, seatLZ);
  var fx = -Math.sin(v.rotation.y), fz = -Math.cos(v.rotation.y);
  var back = 0.95 * Math.sin(lean);
  gito.position.set(seat.x - fx * back, seatTopY - 0.95 * Math.cos(lean), seat.z - fz * back);
  gito.rotation.order = 'YXZ';
  gito.rotation.y = v.rotation.y + Math.PI;
  gito.rotation.x = lean;
  stagePose(pose);
}

// Round 27 (B): respect chip — top-centre, under nothing else. The
// number + title update on every mission complete (missions.js).
var respectEl = document.createElement('div');
respectEl.id = 'respectChip';
respectEl.textContent = '★ RESPECT 0 — NOBODY';
respectEl.style.cssText = 'position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:6;color:#ffd23f;font-size:15px;font-weight:800;letter-spacing:1px;text-shadow:0 2px 4px #000;pointer-events:none;';
document.body.appendChild(respectEl);

// Round 26 (item 4): BUSTED overlay — built in JS so index.html stays
// untouched. A dark red veil over the frozen game: the fine (10% of
// cash) and two ways out. Respawn puts Gito back on foot at the
// Promenade spawn with full health + armour and the heat cleared (with
// a 6 s spawn grace, like a fresh load); the car stays where it was.
// Quitting to the menu applies the same reset.
var bustedEl = document.createElement('div');
bustedEl.id = 'bustedOverlay';
bustedEl.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:8;display:none;background:rgba(20,0,0,0.85);color:#fff;text-align:center;padding-top:20vh;';
bustedEl.innerHTML = '<div style="font-size:64px;font-weight:900;letter-spacing:8px;color:#ff3b30;">BUSTED</div><div id="bustedSub" style="font-size:18px;margin:14px 0 30px;color:#ffd23f;"></div><button id="bustedRespawnBtn" class="mbtn primary" style="margin:10px auto;text-align:center;">↻ Respawn — Promenade</button><button id="bustedMenuBtn" class="mbtn" style="margin:10px auto;text-align:center;">⬅ Quit to Menu</button>';
document.body.appendChild(bustedEl);
function resetAfterBusted() {
  health = 100; armour = 50; wanted = 0; wantedT = 0;
  if (adoptedCar) { adoptedCar.userData.adopted = false; adoptedCar = null; }
  onFoot = true; rideMode = 'none'; rideObj = null; gito.visible = true;
  px = 10; pz = 12; heading = 0; speed = 0;
  spawnSafeT = t + 6;
}
function showBusted() {
  // The fine lands the moment BUSTED shows (setMoney writes the HUD
  // immediately, so the cash on screen already matches the fine text);
  // the buttons below only reset stats and unfreeze. showBusted runs
  // once per death — the trigger in render.js is guarded by !busted.
  var loss = Math.floor(money * 0.1);
  if (loss > 0) { setMoney(money - loss); saveGame(); }
  var sub = document.getElementById('bustedSub');
  if (sub) sub.textContent = 'The police caught you. Fine: $' + loss.toLocaleString('en-US') + ' (10% of your cash).';
  bustedEl.style.display = 'block';
  if (typeof updateAudio === 'function') updateAudio(0, 0);
}
document.getElementById('bustedRespawnBtn').addEventListener('click', function () {
  resetAfterBusted();
  busted = false;
  if (typeof setPaused === 'function' && paused) setPaused(false);
  bustedEl.style.display = 'none';
});
document.getElementById('bustedMenuBtn').addEventListener('click', function () {
  resetAfterBusted();
  busted = false;
  bustedEl.style.display = 'none';
  setScreen('menu');
});

// Round 26 (item 7): hit feedback — the old game showed nothing at
// all when a shot landed (no hitmarker, no damage number), so Gito
// could not tell a hit from a miss. A white ✕ flashes at the reticle
// on every hit, the damage number floats up beside it, and a downed
// target gets a red DOWN tag. Counters let probes verify hits without
// "seeing" the screen.
var hitmarkEl = document.createElement('div');
hitmarkEl.id = 'hitmarker';
hitmarkEl.textContent = '✕';
hitmarkEl.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:6;font-size:34px;font-weight:900;color:#fff;text-shadow:0 0 6px #ff2a8a,0 2px 4px #000;opacity:0;pointer-events:none;';
document.body.appendChild(hitmarkEl);
var dmgNumEl = document.createElement('div');
dmgNumEl.id = 'dmgNum';
dmgNumEl.style.cssText = 'position:fixed;left:50%;top:50%;z-index:6;font-size:26px;font-weight:900;color:#ffd23f;text-shadow:0 2px 4px #000;opacity:0;pointer-events:none;';
document.body.appendChild(dmgNumEl);
var hitMarkCount = 0, hitDownCount = 0, dmgNumAlt = 0;
function showHitmarker(dmg, down) {
  hitMarkCount++;
  if (down) hitDownCount++;
  hitmarkEl.style.opacity = '1';
  hitmarkEl.style.color = down ? '#ff3b30' : '#fff';
  setTimeout(function () { hitmarkEl.style.opacity = '0'; }, 300);
  dmgNumAlt = (dmgNumAlt + 1) % 2;
  dmgNumEl.textContent = (down ? 'DOWN  −' : '−') + dmg;
  dmgNumEl.style.color = down ? '#ff3b30' : '#ffd23f';
  dmgNumEl.style.transform = 'translate(' + (dmgNumAlt === 0 ? 26 : -70) + 'px,-44px)';
  dmgNumEl.style.opacity = '1';
  setTimeout(function () { dmgNumEl.style.opacity = '0'; }, 700);
}

// Round 26 (item 6): fullscreen map — the old game had no map at all
// beyond the 170 px minimap, and Settings never promised one (it said
// "M — mute"). Tab or the 🗺 button opens a 510 px live map built by
// the same painter as the minimap; Tab / 🗺 / tap closes it. The game
// keeps running underneath (same as the dispatch panel), so close it
// before driving off.
var mapOverlayEl = document.createElement('div');
mapOverlayEl.id = 'mapOverlay';
mapOverlayEl.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:20;display:none;background:rgba(10,10,20,0.92);text-align:center;padding-top:5vh;';
mapOverlayEl.innerHTML = '<div style="color:#ffd23f;font-size:26px;font-weight:900;letter-spacing:2px;margin-bottom:10px;">TROPICAL COAST — MAP</div><canvas id="bigMap" width="510" height="510" style="width:510px;height:510px;max-width:92vw;max-height:70vh;border:4px solid #fff;border-radius:50%;background:#2a8a4a;"></canvas><div style="color:#fff;font-size:16px;margin-top:12px;">Tab / 🗺 — close &nbsp;·&nbsp; <span style="color:#ffd21a;">●</span> you &nbsp;<span style="color:#2a6aff;">●</span> police &nbsp;<span style="color:#fff;">●</span> traffic &nbsp;<span style="color:#ff8ac8;">●</span> peds</div>';
document.body.appendChild(mapOverlayEl);
var bigMapCanvas = document.getElementById('bigMap');
var bigMapCtx = bigMapCanvas.getContext('2d');
function drawBigMap() {
  bigMapCtx.save();
  bigMapCtx.scale(3, 3);
  paintMap(bigMapCtx);
  bigMapCtx.restore();
}
var mapOpen = false;
function toggleMap() {
  mapOpen = !mapOpen;
  if (mapOpen) { drawBigMap(); mapOverlayEl.style.display = 'block'; }
  else mapOverlayEl.style.display = 'none';
  return mapOpen;
}
mapOverlayEl.addEventListener('click', function () { if (mapOpen) toggleMap(); });
var mapBtnEl = document.createElement('button');
mapBtnEl.id = 'mapBtn';
mapBtnEl.textContent = '🗺';
mapBtnEl.style.cssText = 'position:fixed;top:58px;right:312px;z-index:9;background:rgba(20,20,30,.75);color:#fff;border:2px solid rgba(255,255,255,.6);border-radius:10px;padding:8px 14px;font-size:18px;font-weight:700;cursor:pointer;display:none;';
document.body.appendChild(mapBtnEl);
mapBtnEl.addEventListener('click', function () { startAudio(); toggleMap(); });

// Round 26 (item 6): the jump button — ⬆ on the left cluster, above
// the run button, same .ctl look as the other touch controls. Touch
// or click fires tryJump (render.js); Space stays Attack.
var jumpBtnEl = document.createElement('div');
jumpBtnEl.id = 'jumpBtn';
jumpBtnEl.className = 'ctl';
jumpBtnEl.textContent = '⬆';
jumpBtnEl.style.cssText = 'left:110px;bottom:126px;width:64px;height:64px;font-size:28px;';
document.body.appendChild(jumpBtnEl);
function jumpBtnFire(e) { if (e) e.preventDefault(); startAudio(); if (typeof tryJump === 'function') tryJump(); }
jumpBtnEl.addEventListener('touchstart', jumpBtnFire);
jumpBtnEl.addEventListener('mousedown', jumpBtnFire);

// Round 26 (item 6): the Settings list now matches what the game
// actually does — it used to omit reload and jump entirely and never
// said how fast running is (5 m/s walk, 8.5 m/s sprint, verified by
// probe). M stays mute; the map is Tab / 🗺. The list lives in
// index.html; hud.js corrects its text so the file stays untouched.
(function () {
  var rows = document.querySelectorAll('#settingsPanel .prow');
  if (rows && rows[1]) rows[1].textContent = 'WASD / arrows — move & drive · E — enter / talk · Space — attack · J / ⬆ — jump · R — reload · 1-7 — weapons · Shift — run (8,5 m/s) · Tab / 🗺 — map (fullscreen) · M — mute · Esc / P — pause';
})();

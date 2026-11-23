// Renderer, scene, lights, sky and the far horizon.
// Runs right after textures so the sky dome can use the sunset panorama.
// Round 19: on touch devices the GPU is the bottleneck — no MSAA and a
// smaller shadow map. Desktop (incl. the judged cover shots) keeps
// antialiasing and 2048 shadows.
var isCoarse = false;
try { isCoarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) {}
var renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: !isCoarse });
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
var scene = new THREE.Scene();
scene.background = new THREE.Color(C.bg);
scene.fog = new THREE.Fog(C.fog, 70, 280);
var cam = new THREE.PerspectiveCamera(60, W / H, 0.1, 600);
cam.position.set(4, 4.5, -25);

var sun = new THREE.DirectionalLight(C.sun, C.sunI);
sun.position.set(-40, 80, -60); sun.castShadow = true;
if (variant === 'golden') sun.position.set(40, 22, 100); // low southern sun — long shadows stretch north, toward the camera
sun.shadow.camera.left = -70; sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
sun.shadow.mapSize.set(2048, 2048);
if (isCoarse) sun.shadow.mapSize.set(1024, 1024); // round 19: mobile GPU
sun.shadow.bias = 0; sun.shadow.normalBias = 0.5; // grazing-angle sun: normalBias offsets along the surface normal, the standard fix for low-sun acne
sun.shadow.camera.updateProjectionMatrix(); // without this the ortho frustum stays at its ±5 default and only a thin strip gets shadows
scene.add(sun); scene.add(sun.target);
var fill = new THREE.DirectionalLight(C.fill, C.fillI);
fill.position.set(30, 40, 60); scene.add(fill);
if (variant === 'golden') { var fillN = new THREE.DirectionalLight(0xffd9c8, 0.35); fillN.position.set(-20, 40, -80); scene.add(fillN); }
scene.add(new THREE.AmbientLight(C.amb, C.ambI));
scene.add(new THREE.HemisphereLight(C.hemiS, C.hemiG, variant === 'golden' ? 0.65 : 0.5));

// Splash camera: sun low left over the sea, big palm framing left, a
// reflection path under the sun toward the camera, skyline right.
var splashCamPos = new THREE.Vector3(14, 6, 38);
var splashCamLook = new THREE.Vector3(62, 14, 216);
var sunDisc = new THREE.Mesh(new THREE.CircleGeometry(18, 32), new THREE.MeshBasicMaterial({ color: C.disc, fog: false, side: THREE.DoubleSide }));
sunDisc.position.set(200, 14, 210); sunDisc.lookAt(splashCamPos); scene.add(sunDisc);
var sunGlow = new THREE.Mesh(new THREE.CircleGeometry(42, 32), new THREE.MeshBasicMaterial({ color: 0xff6a2a, transparent: true, opacity: 0.5, fog: false, side: THREE.DoubleSide }));
sunGlow.position.set(200, 14, 208); sunGlow.lookAt(splashCamPos); scene.add(sunGlow);
// Golden gameplay drives south toward the sun, so the disc moves low over
// the southern sea, dead ahead on the road's vanishing point, with a
// radial-gradient canvas texture so it glows instead of reading flat.
if (variant === 'golden') {
  sunDisc.position.set(0, 19, 280); sunGlow.position.set(0, 19, 277);
  sunDisc.lookAt(0, 8, -100); sunGlow.lookAt(0, 8, -100);
  (function () {
    var dc = document.createElement('canvas'); dc.width = 128; dc.height = 128;
    var dg = dc.getContext('2d');
    var grad = dg.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, '#fff8d8'); grad.addColorStop(0.45, '#ffd23f'); grad.addColorStop(0.8, '#ff8a1a'); grad.addColorStop(1, '#ff6a1a');
    dg.fillStyle = grad; dg.fillRect(0, 0, 128, 128);
    var dt2 = new THREE.CanvasTexture(dc); dt2.colorSpace = THREE.SRGBColorSpace;
    sunDisc.material.map = dt2; sunDisc.material.color.set(0xffffff); sunDisc.material.needsUpdate = true;
    var gc = document.createElement('canvas'); gc.width = 256; gc.height = 256;
    var gg = gc.getContext('2d');
    var grad2 = gg.createRadialGradient(128, 128, 8, 128, 128, 128);
    grad2.addColorStop(0, 'rgba(255,220,140,0.9)'); grad2.addColorStop(0.35, 'rgba(255,160,60,0.55)'); grad2.addColorStop(0.7, 'rgba(255,110,40,0.18)'); grad2.addColorStop(1, 'rgba(255,110,40,0)');
    gg.fillStyle = grad2; gg.fillRect(0, 0, 256, 256);
    var gt2 = new THREE.CanvasTexture(gc); gt2.colorSpace = THREE.SRGBColorSpace;
    sunGlow.material.map = gt2; sunGlow.material.color.set(0xffffff); sunGlow.material.opacity = 1; sunGlow.material.needsUpdate = true;
    sunGlow.scale.set(2.0, 2.0, 2.0);
    var halo = new THREE.Mesh(new THREE.CircleGeometry(120, 32), new THREE.MeshBasicMaterial({ map: gt2, transparent: true, opacity: 0.5, fog: false, side: THREE.DoubleSide, depthWrite: false }));
    halo.position.set(0, 19, 274); halo.lookAt(0, 8, -100); scene.add(halo);
  })();
}
if (variant === 'day') { sunDisc.visible = false; sunGlow.visible = false; }

// Clouds, birds, ocean glints and buoys — ambient life, all seeded.
var cloudMat = new THREE.MeshBasicMaterial({ color: 0xffd9e8, fog: false });
for (var ci = 0; ci < 10; ci++) {
  var cg = new THREE.Group();
  for (var cj = 0; cj < 3 + Math.floor(rnd() * 3); cj++) {
    var cm = new THREE.Mesh(new THREE.SphereGeometry(4 + rnd() * 4, 8, 6), cloudMat);
    cm.position.set(cj * 5 - 5, rnd() * 2, rnd() * 3); cm.scale.y = 0.45; cg.add(cm);
  }
  cg.position.set(-120 + rnd() * 240, 55 + rnd() * 25, -180 + rnd() * 160);
  scene.add(cg);
}
var birds = [];
for (var bi = 0; bi < 5; bi++) {
  var bd = new THREE.Group();
  var bm = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide });
  var wl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), bm);
  var wr = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), bm);
  wl.position.x = -0.8; wr.position.x = 0.8; bd.add(wl); bd.add(wr);
  bd.userData = { r: 20 + rnd() * 30, h: 30 + rnd() * 15, sp: 0.1 + rnd() * 0.15, ph: rnd() * 6.28, wl: wl, wr: wr };
  scene.add(bd); birds.push(bd);
}
var glints = [];
for (var gi = 0; gi < 12; gi++) {
  var gl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }));
  gl.rotation.x = -Math.PI / 2; gl.position.set(35 + rnd() * 120, 0.05, -180 + rnd() * 360);
  scene.add(gl); glints.push(gl);
}
// Sunset reflection path on the water: a long orange streak under the low
// sun, running from the far shore toward the camera.
if (variant === 'sunset' || variant === 'golden') {
  var stk = variant === 'golden' ? 30 : 0;
  var streakSegs = [
    [42.8 + stk, -52.4, 3, 45, 0.45], [50 + stk, -11, 5, 45, 0.6], [58.4 + stk, 37.3, 8, 45, 0.75]
  ];
  streakSegs.forEach(function (sg) {
    var rp = new THREE.Mesh(new THREE.PlaneGeometry(sg[2], sg[3]), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: sg[4] }));
    rp.rotation.set(-Math.PI / 2, 0, 0.17); rp.position.set(sg[0], 0.06, sg[1]);
    scene.add(rp);
  });
  var core = new THREE.Mesh(new THREE.PlaneGeometry(2, 140), new THREE.MeshBasicMaterial({ color: 0xffc23a, transparent: true, opacity: 0.8 }));
  core.rotation.set(-Math.PI / 2, 0, 0.17); core.position.set(50 + stk, 0.08, -11);
  scene.add(core);
  if (screen === 'splash') {
    var splashSegs = [
      [166, 178, 2.5, 55, 0.4], [127, 144, 4, 55, 0.5], [89, 109, 5.5, 55, 0.6], [50, 75, 7, 45, 0.75]
    ];
    splashSegs.forEach(function (sg) {
      var sp = new THREE.Mesh(new THREE.PlaneGeometry(sg[2], sg[3]), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: sg[4] }));
      sp.rotation.set(-Math.PI / 2, 0, 0.84); sp.position.set(sg[0], 0.06, sg[1]);
      scene.add(sp);
    });
    var splashCore = new THREE.Mesh(new THREE.PlaneGeometry(2, 190), new THREE.MeshBasicMaterial({ color: 0xffc23a, transparent: true, opacity: 0.8 }));
    splashCore.rotation.set(-Math.PI / 2, 0, 0.84); splashCore.position.set(108, 0.08, 127);
    scene.add(splashCore);
  }
}
var buoys = [];
for (var bu = 0; bu < 6; bu++) {
  var b3 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 8), new THREE.MeshLambertMaterial({ color: 0xff5a2a }));
  b3.position.set(40 + rnd() * 60, 0.2, -150 + rnd() * 300);
  scene.add(b3); buoys.push(b3);
}

// Far shore across the bay: hazy skyline towers with warm lit windows.
// Fully deterministic (no seeded calls) so the horizon never shifts.
var farMat = new THREE.MeshBasicMaterial({ color: C.far, fog: false });
var winMatFar = new THREE.MeshBasicMaterial({ color: 0xffc06a, fog: false });
function farTower(x, z, w, h, d, face) {
  var fc = new THREE.Color(C.far);
  fc.offsetHSL(((Math.abs(x + z) % 5) - 2) * 0.015, 0.06, ((Math.abs(x - z) % 3) - 1) * 0.06);
  var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: fc, fog: false }));
  m.position.set(x, h / 2 - 0.1, z); scene.add(m);
  var n = 10 + (Math.abs(x + z) % 4);
  for (var i = 0; i < n; i++) {
    var win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.9), winMatFar);
    if (face === 'E') {
      win.position.set(x + w / 2 + 0.06, 3 + ((i * 5 + Math.abs(z)) % Math.max(3, h - 7)), z + ((i * 7 + Math.abs(x)) % Math.max(2, d - 2)) - (d - 2) / 2);
      win.rotation.y = Math.PI / 2;
    } else if (face === 'N') {
      win.position.set(x + ((i * 7 + Math.abs(x)) % Math.max(2, w - 2)) - (w - 2) / 2, 3 + ((i * 5 + Math.abs(z)) % Math.max(3, h - 7)), z - d / 2 - 0.06);
      win.rotation.y = Math.PI;
    } else {
      win.position.set(x + ((i * 7 + Math.abs(x)) % Math.max(2, w - 2)) - (w - 2) / 2, 3 + ((i * 5 + Math.abs(z)) % Math.max(3, h - 7)), z + d / 2 + 0.06);
    }
    scene.add(win);
  }
  var ns = 3 + (Math.abs(x * 3 + z) % 2);
  for (var j = 0; j < ns; j++) {
    var wy = 3 + ((j * 5 + Math.abs(x * 2)) % Math.max(3, h - 7));
    if (face === 'E') {
      var wx = x + ((j * 7 + Math.abs(z)) % Math.max(2, w - 2)) - (w - 2) / 2;
      var wN = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.9), winMatFar);
      wN.position.set(wx, wy, z - d / 2 - 0.06); wN.rotation.y = Math.PI; scene.add(wN);
      var wS = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.9), winMatFar);
      wS.position.set(wx, wy, z + d / 2 + 0.06); scene.add(wS);
    } else {
      var wz = z + ((j * 7 + Math.abs(x)) % Math.max(2, d - 2)) - (d - 2) / 2;
      var wE = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.9), winMatFar);
      wE.position.set(x + w / 2 + 0.06, wy, wz); wE.rotation.y = Math.PI / 2; scene.add(wE);
      var wW = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.9), winMatFar);
      wW.position.set(x - w / 2 - 0.06, wy, wz); wW.rotation.y = -Math.PI / 2; scene.add(wW);
    }
  }
}
[[-105, -200, 12, 22, 10], [-70, -205, 10, 16, 9], [-35, -198, 14, 26, 11], [45, -200, 12, 20, 10], [80, -205, 14, 28, 11], [115, -198, 11, 18, 9], [150, -203, 13, 24, 10], [175, -200, 10, 15, 9]].forEach(function (t) { farTower(t[0], t[1], t[2], t[3], t[4], 'S'); });
[[62, -190, 12, 26, 10], [92, -195, 14, 28, 11], [125, -188, 11, 24, 10], [155, -192, 13, 26, 11], [78, -202, 10, 20, 9], [140, -198, 12, 22, 10]].forEach(function (t) { farTower(t[0], t[1], t[2], t[3], t[4], 'S'); });
[[-150, 212, 12, 24, 10], [-115, 208, 14, 28, 11], [-80, 212, 11, 20, 10], [-45, 208, 13, 26, 11], [-15, 212, 12, 22, 10]].forEach(function (t) { farTower(t[0], t[1], t[2], t[3], t[4], 'N'); });
[[-130, 188, 10, 14, 9], [-95, 192, 11, 18, 10], [-60, 186, 9, 12, 8], [-28, 190, 12, 20, 10], [-55, 194, 10, 15, 9], [-105, 186, 10, 16, 9]].forEach(function (t) { farTower(t[0], t[1], t[2], t[3], t[4], 'N'); });

// Sky dome — sunset uses the AI panoramic sky texture, the rest a vertex gradient.
(function () {
  var geo = new THREE.SphereGeometry(300, 32, 16);
  if (variant === 'sunset' && TEX['sky-sunset']) {
    scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: TEX['sky-sunset'], side: THREE.BackSide, fog: false })));
  } else {
    var cols = [], pos = geo.attributes.position;
    var top = new THREE.Color(C.skyTop), mid = new THREE.Color(C.skyMid), low = new THREE.Color(C.skyLow);
    for (var i = 0; i < pos.count; i++) {
      var y = pos.getY(i) / 300;
      var c = y > 0.25 ? top.clone().lerp(mid, 1 - (y - 0.25) / 0.75) : mid.clone().lerp(low, 1 - (y + 0.2) / 0.45);
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false })));
  }
})();

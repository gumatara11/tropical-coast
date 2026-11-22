// The city itself: ground, roads, shops, towers, the street grid, the five
// west districts, the beach and the street furniture. Everything is placed
// top-level in build order so the seeded layout never shifts.
function box(w, h, d, color, x, y, z) {
  var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: color }));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
}
// Textured box with an AI facade; the repeat band follows the height
// (about 15 m per tile, five floors). Tint varies per building so the
// skyline is not one flat colour.
function texBox(w, h, d, texName, x, y, z, tint) {
  var band = h <= 18 ? '-1' : (h <= 30 ? '-2' : '-3');
  var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ map: TEX[texName + band], color: tint || 0xffffff }));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
}
function signTexture(text, bg, fg, vertical) {
  var cv = document.createElement('canvas'); cv.width = vertical ? 128 : 512; cv.height = vertical ? 512 : 128;
  var g = cv.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = fg; g.font = 'bold ' + (vertical ? 64 : 72) + 'px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (vertical) { g.save(); g.translate(64, 256); g.rotate(-Math.PI / 2); g.fillText(text, 0, 0); g.restore(); }
  else g.fillText(text, 256, 64);
  return new THREE.CanvasTexture(cv);
}
// Sign texture that shrinks the font until long names fit.
function signTextureFit(text, bg, fg) {
  var cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256;
  var g = cv.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  var fs = 150;
  g.font = 'bold ' + fs + 'px Arial';
  while (fs > 40 && g.measureText(text).width > 940) { fs -= 6; g.font = 'bold ' + fs + 'px Arial'; }
  g.fillText(text, 512, 128);
  return new THREE.CanvasTexture(cv);
}
function signPlane(tex, w, h, x, y, z, ry) {
  var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  m.position.set(x, y, z); m.rotation.y = ry || 0; scene.add(m); return m;
}
function palm(x, zz, s) {
  var g = new THREE.Group();
  g.scale.setScalar(s || 1);
  var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 9, 8), new THREE.MeshLambertMaterial({ map: TEX['bark'] }));
  trunk.position.y = 4.5; trunk.castShadow = true; g.add(trunk);
  var leafMats = [new THREE.MeshLambertMaterial({ color: 0x2a8a3a }), new THREE.MeshLambertMaterial({ color: 0x1f7a2e })];
  for (var f = 0; f < 12; f++) {
    var a = f / 12 * Math.PI * 2;
    var fg = new THREE.Group();
    fg.position.set(0, 9.0, 0); fg.rotation.y = a;
    var mat = leafMats[f % 2];
    var s1 = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.3, 4), mat);
    s1.scale.set(1, 1, 0.35); s1.rotation.x = 1.05; s1.position.set(0, 0.33, 0.56); s1.castShadow = true;
    fg.add(s1);
    var s2 = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.5, 4), mat);
    s2.scale.set(1, 1, 0.35); s2.rotation.x = 2.45; s2.position.set(0, 0.07, 1.61); s2.castShadow = true;
    fg.add(s2);
    g.add(fg);
  }
  var nut = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshLambertMaterial({ color: 0x8a5a2a }));
  nut.position.y = 8.6; g.add(nut);
  g.position.set(x, 0, zz); scene.add(g); return g;
}

// ---- Ground: coast road, sidewalks, sand, ocean, city slab ----
var road = new THREE.Mesh(new THREE.PlaneGeometry(16, 440), new THREE.MeshLambertMaterial({ map: (variant === 'golden' ? TEX['road-golden'] : TEX['road-long']), color: 0xffffff }));
road.rotation.x = -Math.PI / 2; road.position.set(0, 0, 0); road.receiveShadow = true; scene.add(road);
// Sun-glare strip down the middle of the golden road: a bright band of
// reflected sun running to the vanishing point.
if (variant === 'golden') {
  var glc = document.createElement('canvas'); glc.width = 64; glc.height = 16;
  var glg = glc.getContext('2d');
  var grad3 = glg.createLinearGradient(0, 0, 64, 0);
  grad3.addColorStop(0, 'rgba(255,220,150,0)'); grad3.addColorStop(0.5, 'rgba(255,240,190,1)'); grad3.addColorStop(1, 'rgba(255,220,150,0)');
  glg.fillStyle = grad3; glg.fillRect(0, 0, 64, 16);
  var glareTex = new THREE.CanvasTexture(glc); glareTex.colorSpace = THREE.SRGBColorSpace;
  var glare = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 440), new THREE.MeshBasicMaterial({ map: glareTex, transparent: true, opacity: 0.8, depthWrite: false }));
  glare.rotation.x = -Math.PI / 2; glare.position.set(0, 0.035, 0); scene.add(glare);
}
var dashMat = new THREE.MeshBasicMaterial({ color: 0xffd23f });
for (var d = -210; d < 210; d += 8) {
  var dash = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 3.5), dashMat);
  dash.rotation.x = -Math.PI / 2; dash.position.set(0, 0.02, d); scene.add(dash);
}
var edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
[-7.5, 7.5].forEach(function (ex) {
  var el = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 440), edgeMat);
  el.rotation.x = -Math.PI / 2; el.position.set(ex, 0.02, 0); scene.add(el);
});
var cwMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
[-163, -61, 41, 143].forEach(function (cz) {
  for (var s = -7; s <= 7; s += 2) {
    var stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3), cwMat);
    stripe.rotation.x = -Math.PI / 2; stripe.position.set(s, 0.02, cz); scene.add(stripe);
  }
});
for (var mh = -180; mh < 200; mh += 60) {
  var hole = new THREE.Mesh(new THREE.CircleGeometry(0.7, 12), new THREE.MeshBasicMaterial({ color: 0x333333 }));
  hole.rotation.x = -Math.PI / 2; hole.position.set(4, 0.02, mh); scene.add(hole);
}
box(6, 0.15, 440, 0xd8b8d8, -11, 0.07, 0);
box(6, 0.15, 440, 0xe8cf9a, 11, 0.07, 0);
var tiles = new THREE.Mesh(new THREE.PlaneGeometry(6, 440), new THREE.MeshLambertMaterial({ map: TEX['promenade-tiles'] }));
tiles.rotation.x = -Math.PI / 2; tiles.position.set(11, 0.16, 0); tiles.receiveShadow = true; scene.add(tiles);
var sand = new THREE.Mesh(new THREE.PlaneGeometry(16, 440), new THREE.MeshLambertMaterial({ map: TEX['sand'] }));
sand.rotation.x = -Math.PI / 2; sand.position.set(22, 0.06, 0); sand.receiveShadow = true; scene.add(sand);
var ocean = new THREE.Mesh(new THREE.PlaneGeometry(180, 440), new THREE.MeshLambertMaterial({ map: TEX['sea'], color: C.ocean }));
ocean.rotation.x = -Math.PI / 2; ocean.position.set(120, -0.1, 0); scene.add(ocean);
var city = new THREE.Mesh(new THREE.PlaneGeometry(100, 440), new THREE.MeshLambertMaterial({ color: C.city }));
city.rotation.x = -Math.PI / 2; city.position.set(-64, 0, 0); city.receiveShadow = true; scene.add(city);

// ---- Shops along the coast road, facing the sea ----
var shopDefs = [
  ['CAFE', 0xff5a5a], ['NEON FM', 0x9a5aff], ['HOTEL', 0x2a9ad8], ['PIZZA', 0xff8a2a],
  ['TACOS', 0x37b24a], ['BAR', 0x8a2a5a], ['SURF SHOP', 0x2ac8c8], ['RAMEN', 0xd82a2a],
  ['GYM', 0x5a7ad8], ['MARKET', 0x8ac82a], ['HOTEL', 0xc82a8a], ['CAFE', 0x2a8a6a]
];
var shopCols = [0xe8d8b8, 0xd8c8a8, 0xe8c8a8, 0xc8d8e8, 0xe8d8c8, 0xd8e8c8, 0xe8e8d8, 0xd8c8b8, 0xe8d8a8, 0xc8e8d8, 0xe8c8d8, 0xd8d8c8];
shopDefs.forEach(function (sd, i) {
  var bz = -180 + i * 34, bh = 20 + rnd() * 8, bw = 8 + rnd() * 4, bd = 7;
  var bx = -17 - bw / 2;
  var b = box(bw, bh, bd, shopCols[i], bx, bh / 2, bz);
  var winMat = new THREE.MeshBasicMaterial({ color: 0x9ae8ff });
  [-2.2, 0, 2.2].forEach(function (wz) {
    for (var wy = 4.0; wy < bh - 1; wy += 3) {
      var win = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.2), winMat);
      win.position.set(bx + bw / 2 + 0.06, wy, bz + wz); win.rotation.y = Math.PI / 2; scene.add(win);
    }
  });
  var awn = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, bw + 1.5), new THREE.MeshLambertMaterial({ color: 0xe82020 }));
  awn.position.set(bx + bw / 2 + 1.0, 3.0, bz); awn.rotation.z = -0.12; scene.add(awn);
  if (bh > 9) {
    [5.5, 8.5, 12.5, 15.5, 18.5].forEach(function (by) {
      if (by < bh - 1) {
        var balc = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 5.5), new THREE.MeshLambertMaterial({ color: 0xffffff }));
        balc.position.set(bx + bw / 2 + 0.7, by, bz); scene.add(balc);
        var rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 5.5), new THREE.MeshLambertMaterial({ color: 0xdddddd }));
        rail.position.set(bx + bw / 2 + 1.38, by + 0.35, bz); scene.add(rail);
      }
    });
  }
  if (i % 4 === 0) {
    var strip = new THREE.Mesh(new THREE.PlaneGeometry(0.8, bh - 2), new THREE.MeshBasicMaterial({ color: 0xff4dd2 }));
    strip.position.set(bx + bw / 2 + 0.07, bh / 2, bz + bd / 2 - 1); strip.rotation.y = Math.PI / 2; scene.add(strip);
  }
  signPlane(signTexture(sd[0], '#' + sd[1].toString(16).padStart(6, '0'), '#ffffff', false), 6, 2.6, bx + bw / 2 + 0.07, bh - 1.5, bz, Math.PI / 2);
  var shop = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.6), new THREE.MeshLambertMaterial({ map: TEX['shop-front'] }));
  shop.position.set(bx + bw / 2 + 0.06, 1.6, bz); shop.rotation.y = Math.PI / 2; scene.add(shop);
  if (i % 3 === 0) box(bw * 0.7, 0.2, 2, 0x888888, bx, bh * 0.6, bz + bd / 2 + 0.5);
  if (i % 3 === 1) { var tk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 10), new THREE.MeshLambertMaterial({ color: 0xaaaaaa })); tk.position.set(bx, bh + 0.75, bz); scene.add(tk); }
  if (i % 3 === 2) box(0.15, 3, 0.15, 0x666666, bx, bh + 1.5, bz);
});
// Mid-rise towers with warm AI facades and lit windows at dusk.
var towerTints = [0xffe8c8, 0xffd9b0, 0xd8e4ff, 0xfff0d8];
var winMatMid = new THREE.MeshBasicMaterial({ color: 0xffc86a });
for (var t = 0; t < 8; t++) {
  var th = 16 + rnd() * 24;
  var tower = texBox(8 + rnd() * 6, th, 8, ['facade-cream', 'facade-beige', 'facade-terra'][t % 3], -60 - rnd() * 25, th / 2, -180 + t * 50, towerTints[t % 4]);
  if (variant === 'golden' || variant === 'sunset') {
    var tw = tower.geometry.parameters.width;
    var tx = tower.position.x;
    var tz = tower.position.z;
    for (var wr = 0; wr < 4; wr++) for (var wc = 0; wc < 3; wc++) {
      var wwin = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), winMatMid);
      wwin.position.set(tx + tw / 2 + 0.06, 3 + wr * 3.2, tz + (wc - 1) * 2.2);
      wwin.rotation.y = Math.PI / 2; scene.add(wwin);
    }
  }
}
// West skyline: taller towers with pink-lit windows on the east face.
[[-72, -160, 11, 36, 10], [-88, -120, 12, 30, 10], [-70, -80, 10, 42, 9], [-90, -40, 12, 34, 10], [-74, 0, 11, 38, 10], [-88, 40, 10, 28, 9], [-72, 80, 12, 32, 10], [-90, 120, 11, 26, 9], [-76, 160, 10, 30, 9]].forEach(function (t) { farTower(t[0], t[1], t[2], t[3], t[4], 'E'); });
// Named towers — big bright signs on the east faces, readable from the beach.
signPlane(signTextureFit('SUNSET HOTEL', '#ff5a2a', '#ffffff'), 13, 3.4, -64.8, 36, -80, Math.PI / 2);
signPlane(signTextureFit('PALM MALL', '#2a8a3a', '#ffffff'), 13, 3.4, -68.3, 32, 0, Math.PI / 2);
signPlane(signTextureFit('CORAL APARTMENTS', '#ff5a8a', '#ffffff'), 13, 3.4, -65.8, 26, 80, Math.PI / 2);
signPlane(signTextureFit('OCEAN TOWER', '#2a6ad8', '#ffffff'), 13, 3.4, -70.8, 24, 160, Math.PI / 2);

// ---- Street grid: Avenue 1, Avenue 2, four cross streets, city blocks ----
var avRoad = new THREE.Mesh(new THREE.PlaneGeometry(10, 440), new THREE.MeshLambertMaterial({ map: (variant === 'golden' ? TEX['road-golden'] : TEX['road-long']), color: 0xffffff }));
avRoad.rotation.x = -Math.PI / 2; avRoad.position.set(-32, 0.01, 0); avRoad.receiveShadow = true; scene.add(avRoad);
for (var ad = -210; ad < 210; ad += 8) {
  var adash = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 3.5), dashMat);
  adash.rotation.x = -Math.PI / 2; adash.position.set(-32, 0.03, ad); scene.add(adash);
}
var avRoad2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 440), new THREE.MeshLambertMaterial({ map: (variant === 'golden' ? TEX['road-golden'] : TEX['road-long']), color: 0xffffff }));
avRoad2.rotation.x = -Math.PI / 2; avRoad2.position.set(-80, 0.01, 0); avRoad2.receiveShadow = true; scene.add(avRoad2);
for (var ad2 = -210; ad2 < 210; ad2 += 8) {
  var adash2 = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 3.5), dashMat);
  adash2.rotation.x = -Math.PI / 2; adash2.position.set(-80, 0.03, ad2); scene.add(adash2);
}
crossZs.forEach(function (cz) {
  var cr = new THREE.Mesh(new THREE.PlaneGeometry(118, 10), new THREE.MeshLambertMaterial({ map: (variant === 'golden' ? TEX['road-cross-golden'] : TEX['road-cross']), color: 0xffffff }));
  cr.rotation.x = -Math.PI / 2; cr.position.set(-51, 0.03, cz); cr.receiveShadow = true; scene.add(cr);
  for (var dx = -106; dx < 6; dx += 8) {
    var d2 = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.35), dashMat);
    d2.rotation.x = -Math.PI / 2; d2.position.set(dx, 0.04, cz); scene.add(d2);
  }
  for (var s2 = -36; s2 <= -28; s2 += 2) {
    var st2 = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3), cwMat);
    st2.rotation.x = -Math.PI / 2; st2.position.set(s2, 0.04, cz + 6.5); scene.add(st2);
  }
});
// City blocks between the cross streets, with a plaza park in the middle.
var facadeNames = ['facade-cream', 'facade-beige', 'facade-terra'];
var segs = [[-205, -168], [-158, -66], [-56, 36], [46, 138], [148, 205]];
segs.forEach(function (sg, si) {
  if (si === 2) {
    var plaza = new THREE.Mesh(new THREE.PlaneGeometry(16, 84), new THREE.MeshLambertMaterial({ color: 0x3a8a4a }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.set(-44, 0.05, -10); scene.add(plaza);
    var fb = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, 0.8, 12), new THREE.MeshLambertMaterial({ color: 0xdddddd }));
    fb.position.set(-44, 0.4, -10); scene.add(fb);
    var fw = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.3, 12), new THREE.MeshBasicMaterial({ color: 0x2a9ad8 }));
    fw.position.set(-44, 0.85, -10); scene.add(fw);
    for (var tr = 0; tr < 6; tr++) {
      var tx2 = -50 + (tr % 3) * 6, tz2 = -30 + Math.floor(tr / 3) * 36;
      var trk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 8), new THREE.MeshLambertMaterial({ color: 0x6a4a2a }));
      trk.position.set(tx2, 1.5, tz2); scene.add(trk);
      var top2 = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4, 8), new THREE.MeshLambertMaterial({ color: 0x2a7a3a }));
      top2.position.set(tx2, 4.5, tz2); scene.add(top2);
    }
    box(2.2, 0.15, 0.6, 0x8a6a3a, -40, 0.5, 20); box(2.2, 0.15, 0.6, 0x8a6a3a, -48, 0.5, -30);
    return;
  }
  var n = 2;
  for (var bi = 0; bi < n; bi++) {
    var span = sg[1] - sg[0] - 24;
    var bz = sg[0] + 12 + bi * (n > 1 ? span / (n - 1) : 0);
    var bh2 = 24 + rnd() * 10;
    var bw2 = 10 + rnd() * 4, bd2 = 12 + rnd() * 8;
    var bx2 = -44 - rnd() * 4;
    texBox(bw2, bh2, bd2, facadeNames[(si * 2 + bi) % 3], bx2, bh2 / 2, bz, towerTints[(si * 2 + bi) % 4]);
    // East-face windows (street side): the block row was blank from the
    // road; three columns, one row every 3 m, same offset as the shops.
    [-3, 0, 3].forEach(function (wz) {
      for (var wy = 4.0; wy < bh2 - 1; wy += 3) {
        var bwin = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.2), winMatMid);
        bwin.position.set(bx2 + bw2 / 2 + 0.06, wy, bz + wz); bwin.rotation.y = Math.PI / 2; scene.add(bwin);
      }
    });
    if (bi % 2 === 0) box(bw2 * 0.4, 1, bd2 * 0.4, 0x666666, bx2, bh2 + 0.5, bz);
    if (bi % 2 === 1) box(0.15, 3, 0.15, 0x666666, bx2, bh2 + 1.5, bz);
  }
});
// Density fillers: fixed buildings in the gaps of the block row, then a
// second skyline row — all fixed sizes, no seeded calls, so the layout
// stays deterministic while the city reads denser.
[[-176, 28, 10, 10], [-112, 26, 16, 10], [92, 30, 12, 10], [176, 27, 16, 10]].forEach(function (f, fi) {
  texBox(f[2], f[1], f[3], facadeNames[fi % 3], -44, f[1] / 2, f[0], towerTints[(fi + 1) % 4]);
  if (fi % 2 === 0) box(f[2] * 0.4, 1, f[3] * 0.4, 0x666666, -44, f[1] + 0.5, f[0]);
});
[[-150, 32, 10, 8], [-105, 36, 12, 8], [-48, 30, 10, 8], [-5, 34, 12, 8], [52, 30, 10, 8], [95, 36, 12, 8], [130, 32, 10, 8], [195, 28, 12, 8]].forEach(function (f, fi) {
  texBox(f[2], f[1], f[3], facadeNames[fi % 3], -56, f[1] / 2, f[0], towerTints[(fi + 2) % 4]);
  if (fi % 2 === 1) box(f[2] * 0.4, 1, f[3] * 0.4, 0x666666, -56, f[1] + 0.5, f[0]);
});

// ---- Round 16: dense infill — MANY buildings in probed gaps ----
// Gito (23 Nov 01:04): "gedung nya padatin tangan yang banyak" — the city
// still shows empty sky between buildings, so fill every verified gap.
// Footprints probed 23 Nov (probe-block.json): 4 rows at x -57, -70, -92,
// -106. All fixed sizes, no seeded calls. Nothing sits on a road, on the
// plaza (x -52..-36, z -52..32), on a cross street (z -168..-158, -66..-56,
// 36..46, 138..148), or on a round-15 alley lane (z -121..-117, -101..-97,
// 67.63..71.63, 104..108). Margins are >= 1 m from every neighbour.
// [z0, z1, h, facadeIdx, tintIdx, xCenter, w]
var denseInfill = [
  [-205, -192, 22, 0, 0, -57, 10], [-44, -34, 14, 1, 1, -57, 10],
  [-26, -9, 26, 2, 2, -57, 10], [0, 14, 30, 0, 3, -57, 10],
  [18, 34, 18, 1, 0, -57, 10],
  [-152, -138, 24, 2, 1, -70, 10], [-116, -109, 16, 0, 2, -70, 10],
  [-96, -85, 20, 1, 3, -70, 10], [-74, -67, 14, 2, 0, -70, 10],
  [-55, -45, 28, 0, 1, -70, 10], [-43, -35, 18, 1, 2, -70, 10],
  [-24, -12, 24, 2, 3, -70, 10], [5.5, 15.5, 18, 0, 0, -70, 10],
  [25, 35, 22, 1, 1, -70, 10], [47, 58, 26, 2, 2, -70, 10],
  [86, 97, 20, 0, 3, -70, 10], [125, 137, 24, 1, 0, -70, 10],
  [191, 205, 28, 2, 1, -70, 10],
  [-209, -200, 20, 0, 2, -92, 10], [-157, -146, 24, 1, 3, -92, 10],
  [-144, -134, 18, 2, 0, -92, 10], [-100, -86, 22, 0, 1, -92, 10],
  [-75, -67, 16, 1, 2, -92, 10], [-55, -46, 20, 2, 3, -92, 10],
  [-34, -23, 30, 0, 0, -92, 10], [-21, -8, 26, 1, 1, -92, 10],
  [6, 15, 20, 2, 2, -92, 10], [25, 34, 18, 0, 3, -92, 10],
  [47, 54, 16, 1, 0, -92, 10], [75, 88, 22, 2, 1, -92, 10],
  [131, 137, 14, 0, 2, -92, 10],
  [-190, -180, 18, 1, 3, -106, 10], [-157, -146, 22, 2, 0, -106, 10],
  [-144, -134, 20, 0, 1, -106, 10], [-126, -110, 20, 1, 2, -106, 10],
  [-101, -84, 24, 2, 3, -106, 10], [-76, -67, 18, 0, 0, -106, 10],
  [-55, -41, 28, 1, 1, -106, 10], [-39, -25, 22, 2, 2, -106, 10],
  [-23, -9, 30, 0, 3, -106, 10], [-7, 9, 26, 1, 0, -106, 10],
  [11, 25, 32, 2, 1, -106, 10], [27, 34, 18, 0, 2, -106, 10],
  [47, 53, 16, 1, 3, -106, 10], [66, 81, 20, 2, 0, -106, 10],
  [116, 128, 24, 0, 1, -106, 10], [130, 137, 18, 1, 2, -106, 10],
  [149, 159, 22, 2, 3, -106, 10]
];
denseInfill.forEach(function (f, fi) {
  var d = f[1] - f[0], cz = (f[0] + f[1]) / 2;
  texBox(f[6], f[2], d, facadeNames[f[3] % 3], f[5], f[2] / 2, cz, towerTints[f[4] % 4]);
  if (fi % 2 === 0) box(f[6] * 0.4, 1, d * 0.4, 0x666666, f[5], f[2] + 0.5, cz);
});

// ---- SA-style alleys (round 15) ----
// Infill buildings close the block gaps, leaving 4 m east-west lanes from
// Avenue 1 (x -37) to Avenue 2 (x -75). Footprints probed 23 Nov
// (probe-block.json): block row x≈-44, second row x≈-56; lane z-bands sit
// in the real z-gaps of both rows. Faces that would be coplanar with an
// existing same-facing wall are offset 0.1 m so nothing z-fights.
// [z0, z1, h, facadeIdx, tintIdx, xCenter, w]
var alleyInfill = [
  [-139.72, -121, 11, 0, 0, -45.5, 12], [-126, -120.9, 7, 2, 2, -56.7, 10.6],
  [-116.9, -109, 9, 0, 3, -56.7, 10.6], [-107, -100.9, 8, 1, 1, -45.5, 12],
  [-97, -86.81, 12, 2, 2, -45.5, 12], [-97.1, -86.81, 10, 1, 0, -56.7, 10.6],
  [56, 67.73, 10, 2, 1, -56.7, 10.6], [71.63, 87, 13, 0, 3, -45.5, 12],
  [71.53, 91, 11, 0, 2, -56.7, 10.6], [97, 104, 9, 1, 0, -45.5, 12],
  [99, 104.1, 7, 1, 3, -56.7, 10.6], [108, 118.67, 12, 2, 1, -45.5, 12],
  [107.9, 116, 11, 0, 0, -56.7, 10.6]
];
alleyInfill.forEach(function (f, fi) {
  var d = f[1] - f[0], cz = (f[0] + f[1]) / 2;
  texBox(f[6], f[2], d, facadeNames[f[3] % 3], f[5], f[2] / 2, cz, towerTints[f[4] % 4]);
  if (fi % 2 === 0) box(f[6] * 0.4, 1, d * 0.4, 0x666666, f[5], f[2] + 0.5, cz);
});
// Alley props: small fixed helpers, no seeded calls, no extra lights.
function dumpster(x, z) {
  var g = new THREE.Group();
  var body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 1.0), new THREE.MeshLambertMaterial({ color: 0x2a4a2a }));
  body.position.y = 0.55; body.castShadow = true; g.add(body);
  var lid = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.0), new THREE.MeshLambertMaterial({ color: 0x1a3a1a }));
  lid.position.y = 1.14; lid.rotation.z = 0.06; g.add(lid);
  g.position.set(x, 0, z); scene.add(g); return g;
}
function trashBag(x, z, s) {
  var b = new THREE.Mesh(new THREE.SphereGeometry(0.28 * (s || 1), 8, 6), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
  b.scale.y = 0.8; b.position.set(x, 0.2 * (s || 1), z); scene.add(b); return b;
}
function cardboard(x, z, s, ry) {
  var c = new THREE.Mesh(new THREE.BoxGeometry(0.7 * (s || 1), 0.5 * (s || 1), 0.6 * (s || 1)), new THREE.MeshLambertMaterial({ color: 0x9a7a4a }));
  c.position.set(x, 0.25 * (s || 1), z); c.rotation.y = ry || 0; c.castShadow = true; scene.add(c); return c;
}
function puddle(x, z, w, d) {
  var p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: 0x1a2530 }));
  p.rotation.x = -Math.PI / 2; p.position.set(x, 0.06, z); scene.add(p); return p;
}
function wallPipe(x, z, h) {
  var pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, h, 8), new THREE.MeshLambertMaterial({ color: 0x777777 }));
  pipe.position.set(x, h / 2, z); scene.add(pipe);
  var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 8), new THREE.MeshLambertMaterial({ color: 0x777777 }));
  arm.rotation.z = Math.PI / 2; arm.position.set(x, h - 0.3, z); scene.add(arm);
  return pipe;
}
function acUnit(x, z) {
  var u = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.4), new THREE.MeshLambertMaterial({ color: 0x9a9a9a }));
  u.position.set(x, 1.3, z); scene.add(u); return u;
}
function alleyLamp(x, z) {
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.2, 8), new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
  pole.position.set(x, 1.6, z); scene.add(pole);
  var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
  bulb.position.set(x, 3.35, z); scene.add(bulb);
  return bulb;
}
function wallBulb(x, y, z) {
  var b = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffc86a }));
  b.position.set(x, y, z); scene.add(b); return b;
}
function scribbleTexture() {
  var cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
  var g = cv.getContext('2d');
  g.fillStyle = '#241a2e'; g.fillRect(0, 0, 256, 128);
  [['#ff5a8a', 20, 90, 90, 30], ['#ffd23f', 60, 100, 140, 40], ['#2ac8ff', 100, 80, 200, 50], ['#37e07a', 30, 50, 180, 95], ['#ff5a5a', 150, 110, 230, 35]].forEach(function (s) {
    g.strokeStyle = s[0]; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(s[1], s[2]); g.lineTo(s[3], s[4]); g.stroke();
  });
  g.fillStyle = '#ffffff'; g.font = 'bold 34px Arial'; g.textAlign = 'center';
  g.fillText('SA', 128, 78);
  return new THREE.CanvasTexture(cv);
}
var scribTex = scribbleTexture();
// Lane 1: z -121..-117 (seg 1 north gap).
box(38, 0.05, 4, 0x23232a, -56, 0.025, -119);
dumpster(-41, -117.9);
trashBag(-43.2, -118.5); trashBag(-43.9, -117.7, 0.8); trashBag(-39.6, -120.4);
cardboard(-48, -120.5, 1, 0.3); cardboard(-47.3, -120.6, 0.7, -0.2);
puddle(-52, -119, 2.6, 1.4);
wallPipe(-46, -120.85, 4.2);
acUnit(-56, -117.1); acUnit(-44, -120.8);
signPlane(signTexture('TROPICAL', '#1a1a2e', '#ff5a8a', false), 3.2, 1.0, -47, 2.4, -120.92, 0);
signPlane(scribTex, 2.2, 1.1, -60, 1.9, -116.97, Math.PI);
alleyLamp(-66, -119); wallBulb(-40, 3.0, -120.9);
// Lane 2: z -101..-97 (seg 1 south gap).
box(38, 0.05, 4, 0x23232a, -56, 0.025, -99);
dumpster(-58, -97.7);
trashBag(-55.5, -98.6); trashBag(-60.2, -98.2, 0.9); trashBag(-44, -100.3);
cardboard(-47, -100.5, 0.9, 0.5); cardboard(-46.2, -100.6, 0.6, 0.1);
puddle(-64, -99, 2.4, 1.2);
wallPipe(-47, -100.85, 4.0);
acUnit(-56, -97.3);
signPlane(signTexture('TROPICAL', '#1a1a2e', '#ff5a8a', false), 3.2, 1.0, -44, 2.4, -100.82, 0);
signPlane(scribTex, 2.2, 1.1, -48, 1.9, -97.07, Math.PI);
alleyLamp(-68, -99); wallBulb(-40, 3.0, -100.8);
// Lane 3: z 67.63..71.63 (seg 3 north gap).
box(38, 0.05, 4, 0x23232a, -56, 0.025, 69.63);
dumpster(-42, 71.1);
trashBag(-44.5, 70.2); trashBag(-39.8, 68.6, 0.85); trashBag(-57, 70.5);
cardboard(-49, 68.2, 1, -0.3); cardboard(-49.8, 68.1, 0.7, 0.4);
puddle(-54, 69.63, 2.6, 1.3);
wallPipe(-47, 67.85, 4.2);
acUnit(-58, 71.33);
signPlane(signTexture('TROPICAL', '#1a1a2e', '#ff5a8a', false), 3.2, 1.0, -46, 2.4, 67.71, 0);
signPlane(scribTex, 2.2, 1.1, -60, 1.9, 71.46, Math.PI);
alleyLamp(-66, 69.63); wallBulb(-40, 3.0, 67.75);
// Lane 4: z 104..108 (seg 3 south gap).
box(38, 0.05, 4, 0x23232a, -56, 0.025, 106);
dumpster(-59, 107.35);
trashBag(-56.5, 106.6); trashBag(-61.5, 107.2, 0.9); trashBag(-43, 105.2);
cardboard(-46, 104.5, 1, 0.2); cardboard(-45.2, 104.4, 0.65, -0.4);
puddle(-52, 106, 2.4, 1.2);
wallPipe(-50, 104.25, 3.8);
acUnit(-56, 107.7);
signPlane(signTexture('TROPICAL', '#1a1a2e', '#ff5a8a', false), 3.2, 1.0, -48, 2.4, 104.18, 0);
signPlane(scribTex, 2.2, 1.1, -44, 1.9, 107.93, Math.PI);
alleyLamp(-67, 106); wallBulb(-40, 3.0, 104.2);

// ---- The five west districts ----
// 1) Pelabuhan: containers, warehouse, crane, cargo ship offshore.
var contCols = [0xd82a2a, 0x2a6ad8, 0x37b24a, 0xffd23f, 0x8a5aff];
[[-95, -195], [-80, -195], [-95, -175], [-80, -175]].forEach(function (cc, ci) {
  box(8, 2.6, 8, contCols[ci % 5], cc[0], 1.3, cc[1]);
  if (ci % 2 === 0) box(8, 2.6, 8, contCols[(ci + 2) % 5], cc[0], 3.9, cc[1]);
});
box(16, 8, 12, 0x8a8a8a, -88, 4, -185);
signPlane(signTextureFit('PORT WAREHOUSE', '#d8a020', '#ffffff'), 13, 3, -88, 6.3, -178.9, 0);
signPlane(signTextureFit('PORT WAREHOUSE', '#d8a020', '#ffffff'), 11, 2.6, -79.9, 5.5, -185, Math.PI / 2);
box(1, 18, 1, 0xffd23f, -70, 9, -190);
box(14, 1, 1, 0xffd23f, -70, 18, -190);
(function () {
  var ship = new THREE.Group();
  var hull = new THREE.Mesh(new THREE.BoxGeometry(18, 3, 6), new THREE.MeshLambertMaterial({ color: 0x2a3a4a }));
  hull.position.y = 0.6; ship.add(hull);
  var deck = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 5), new THREE.MeshLambertMaterial({ color: 0xd82a2a }));
  deck.position.set(-1, 3, 0); ship.add(deck);
  var bridge = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 5), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  bridge.position.set(7, 3.5, 0); ship.add(bridge);
  ship.position.set(60, 0, -190); scene.add(ship);
})();
// 2) Residential: six houses; Gito's is the pink one with the 'my house' sign.
function house(x, z, col, roofCol, gitoHouse) {
  box(6, 4, 6, col, x, 2, z);
  var roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.4, 4), new THREE.MeshLambertMaterial({ color: roofCol }));
  roof.position.set(x, 5.2, z); roof.rotation.y = Math.PI / 4; scene.add(roof);
  if (gitoHouse) signPlane(signTexture('my house', '#ff5a8a', '#ffffff', false), 4, 1.4, x, 3.2, z + 3.1, 0);
}
house(-95, -130, 0xffe9a8, 0xd82a2a, false);
house(-75, -130, 0xe8c8a8, 0x8a5a2a, false);
house(-95, -105, 0xf0d8b8, 0xc86a2a, false);
house(-75, -105, 0xff8ac8, 0xff5a8a, true);
house(-95, -80, 0xe8d8c8, 0x9a6a4a, false);
house(-75, -80, 0xffe9a8, 0x37b24a, false);
// 3) Industrial: factories + two smokestacks with red tips.
box(14, 7, 10, 0x777777, -90, 3.5, 60);
box(14, 6, 10, 0x666666, -90, 3, 95);
box(12, 6, 10, 0x888888, -95, 3, 110);
[[-100, 55], [-100, 100]].forEach(function (ss) {
  var st = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 14, 10), new THREE.MeshLambertMaterial({ color: 0x9a9a9a }));
  st.position.set(ss[0], 7, ss[1]); scene.add(st);
  var tip = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
  tip.position.set(ss[0], 14.3, ss[1]); scene.add(tip);
});
// 4) Night Club: dark box, TROPICAL CLUB signs on both faces, neon bar.
box(12, 8, 10, 0x2a2a4a, -85, 4, 125);
signPlane(signTextureFit('TROPICAL CLUB', '#ff2ad8', '#ffffff'), 8, 2.4, -91, 6.5, 125, -Math.PI / 2);
signPlane(signTextureFit('TROPICAL CLUB', '#ff2ad8', '#ffffff'), 12, 3, -78.9, 6.5, 125, Math.PI / 2);
box(8, 0.4, 0.4, 0xff2ad8, -91, 8.2, 125);
// 5) Sunset Hill: big hill + viewpoint platform + two trees.
(function () {
  var hill = new THREE.Mesh(new THREE.ConeGeometry(25, 18, 12), new THREE.MeshLambertMaterial({ color: 0x5a7a4a }));
  hill.position.set(-90, 9, 185); scene.add(hill);
  box(6, 0.5, 6, 0x8a6a3a, -90, 18.2, 185);
  [[-94, 180], [-86, 190]].forEach(function (ht) {
    var trk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 8), new THREE.MeshLambertMaterial({ color: 0x6a4a2a }));
    trk.position.set(ht[0], 19.5, ht[1]); scene.add(trk);
    var top = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4, 8), new THREE.MeshLambertMaterial({ color: 0x2a7a3a }));
    top.position.set(ht[0], 22.5, ht[1]); scene.add(top);
  });
})();

// Road palms on both sides of the coast road, sand palms on the beach —
// including the big framing palm for the splash shot.
for (var p = -200; p < 210; p += 26) { if (p === -44) continue; palm(10.5, p); if (p % 52 === 0) palm(-10.5, p + 12); }
palm(19, -120); palm(26, 10); palm(19, 80); palm(27, 170); palm(28, 62, 2.2);

// ---- Beach: umbrellas, benches, balls, net, lifeguard tower, pier ----
var beachCols = [0xff5a5a, 0xffd23f, 0x2ac8ff, 0xff8ac8, 0x37e07a, 0xff8a2a];
var umbCols = [0xff2a2a, 0xff5a2a, 0xff7a1a, 0xe83a2a, 0xff8a2a, 0xd81a2a]; // red/orange only, like the video
function umbrella(x, z, col) {
  var g = new THREE.Group();
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), new THREE.MeshLambertMaterial({ color: 0xeeeeee }));
  pole.position.y = 1.3; g.add(pole);
  var top = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1, 8), new THREE.MeshLambertMaterial({ color: col }));
  top.position.y = 2.9; g.add(top);
  var lounger = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 1.8), new THREE.MeshLambertMaterial({ color: 0xeeeeee }));
  lounger.position.set(1.2, 0.35, 0.5); g.add(lounger);
  var table = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  table.position.set(-1.2, 0.7, -0.5); g.add(table);
  var tleg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 6), new THREE.MeshLambertMaterial({ color: 0x888888 }));
  tleg.position.set(-1.2, 0.35, -0.5); g.add(tleg);
  g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
  g.position.set(x, 0, z); scene.add(g); return g;
}
for (var u = -180; u < 200; u += 52) umbrella(18, u, umbCols[Math.floor(rnd() * 6)]);
for (var u2 = -160; u2 < 200; u2 += 40) umbrella(26, u2 + 20, umbCols[Math.floor(rnd() * 6)]);
for (var bn = -150; bn < 200; bn += 70) { box(2.2, 0.15, 0.6, 0x8a6a3a, 16, 0.5, bn); box(0.15, 0.5, 0.6, 0x8a6a3a, 15, 0.25, bn); box(0.15, 0.5, 0.6, 0x8a6a3a, 17, 0.25, bn); }
// Beach balls — kept clear of Luna (22.5,-57.5) and the Gito photo spot
// (11.5,-60), or a ball reads as stuck to a shoulder in close shots.
var beachBalls = [];
for (var b2 = 0; b2 < 8; b2++) {
  var bx = 17 + rnd() * 10, bz = -170 + rnd() * 340;
  if (Math.hypot(bx - 22.5, bz + 57.5) < 7 || Math.hypot(bx - 11.5, bz + 60) < 7) bz += 30;
  var ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshLambertMaterial({ color: beachCols[b2 % 6] }));
  ball.position.set(bx, 0.5, bz); scene.add(ball); beachBalls.push(ball);
}
var volleyNet;
(function () {
  var net = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.1), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
  net.position.set(24, 1.9, -30); scene.add(net); volleyNet = net;
  [-4, 4].forEach(function (dx) { var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8), new THREE.MeshLambertMaterial({ color: 0xdddddd })); pole.position.set(24 + dx, 1.25, -30); scene.add(pole); });
})();
// Lifeguard tower: X-braced wooden legs, deck + railing, cabin, pyramid
// roof, red flag, stairs on the west side.
(function () {
  var lg = new THREE.Group();
  var wood = new THREE.MeshLambertMaterial({ map: TEX['wood-planks'] });
  [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]].forEach(function (off) {
    var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 5, 8), wood);
    leg.position.set(off[0], 2.5, off[1]); lg.add(leg);
  });
  [-1.1, 1.1].forEach(function (fx) {
    [-0.55, 0.55].forEach(function (rz) {
      var brace = new THREE.Mesh(new THREE.BoxGeometry(0.09, 3.4, 0.09), wood);
      brace.position.set(fx, 2.5, 0); brace.rotation.x = rz; lg.add(brace);
    });
  });
  var deck = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 3.4), wood);
  deck.position.y = 5.1; lg.add(deck);
  [[0, -1.65, 0], [0, 1.65, 0], [-1.65, 0, 1], [1.65, 0, 1]].forEach(function (r) {
    var horiz = r[2] === 0;
    var top = new THREE.Mesh(new THREE.BoxGeometry(horiz ? 3.4 : 0.08, 0.08, horiz ? 0.08 : 3.4), wood);
    top.position.set(r[0], 6.0, r[1]); lg.add(top);
    [-1.1, 0, 1.1].forEach(function (po) {
      if (r[0] === -1.65 && po === 0) return; // stair gap
      var post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), wood);
      post.position.set(horiz ? po : r[0], 5.55, horiz ? r[1] : po); lg.add(post);
    });
  });
  var cab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 2.6), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  cab.position.y = 6.2; lg.add(cab);
  var winBand = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.8, 2.7), new THREE.MeshLambertMaterial({ color: 0x2a4a6a }));
  winBand.position.y = 6.4; lg.add(winBand);
  var roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 4), new THREE.MeshLambertMaterial({ color: 0xff5a5a }));
  roof.position.y = 7.7; roof.rotation.y = Math.PI / 4; lg.add(roof);
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), wood);
  pole.position.y = 8.6; lg.add(pole);
  var flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshBasicMaterial({ color: 0xff2222, side: THREE.DoubleSide }));
  flag.position.set(0.5, 8.9, 0); lg.add(flag);
  for (var st = 0; st < 5; st++) {
    var step = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 1), wood);
    step.position.set(-1.6 - st * 0.35, 0.4 + st * 1.0, 0); lg.add(step);
  }
  lg.position.set(24, 0, -90); scene.add(lg);
})();
for (var sr = 0; sr < 4; sr++) {
  var sb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.12), new THREE.MeshLambertMaterial({ color: beachCols[sr % 6] }));
  sb.position.set(17.5 + sr * 0.7, 1.2, -20); sb.rotation.z = 0.2; scene.add(sb);
}
// Wooden pier into the ocean: planks + posts.
(function () {
  var pierWood = new THREE.MeshLambertMaterial({ map: TEX['wood-planks'] });
  for (var pl = 0; pl < 12; pl++) {
    var plank = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 1.2), pierWood);
    plank.position.set(32, 0.5, 40 + pl * 1.4); plank.castShadow = true; plank.receiveShadow = true; scene.add(plank);
  }
  [-2, 2].forEach(function (dx) { for (var pp = 0; pp < 6; pp++) box(0.2, 1, 0.2, 0x6a4a2a, 32 + dx, 0, 42 + pp * 3); });
})();
// Beach bar hut — pink, with plank trim, corner posts, base skirt, a framed
// window and a striped awning over the counter.
box(4.5, 3, 3.5, 0xff8ac8, 24, 1.5, 120);
(function () {
  var trimM = new THREE.MeshLambertMaterial({ color: 0xd84a7a });
  var postM = new THREE.MeshLambertMaterial({ color: 0x8a2a4a });
  var whiteM2 = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [0.7, 2.15].forEach(function (ty) {
    var tr = new THREE.Mesh(new THREE.BoxGeometry(4.56, 0.12, 0.08), trimM);
    tr.position.set(24, ty, 118.18); scene.add(tr);
  });
  [[21.8, 118.2], [26.2, 118.2], [21.8, 121.8], [26.2, 121.8]].forEach(function (cp) {
    var post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.0, 0.22), postM);
    post.position.set(cp[0], 1.5, cp[1]); scene.add(post);
  });
  var skirt = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 3.6), new THREE.MeshLambertMaterial({ color: 0x7a3a5a }));
  skirt.position.set(24, 0.18, 120); scene.add(skirt);
  var win = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 0.06), new THREE.MeshLambertMaterial({ color: 0x2a4a5a }));
  win.position.set(22.6, 1.5, 118.18); scene.add(win);
  var frT = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.08), whiteM2); frT.position.set(22.6, 2.02, 118.14); scene.add(frT);
  var frB = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.08), whiteM2); frB.position.set(22.6, 0.98, 118.14); scene.add(frB);
  var frL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.12, 0.08), whiteM2); frL.position.set(21.93, 1.5, 118.14); scene.add(frL);
  var frR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.12, 0.08), whiteM2); frR.position.set(23.27, 1.5, 118.14); scene.add(frR);
  for (var ai = 0; ai < 6; ai++) {
    var slat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 1.4), new THREE.MeshBasicMaterial({ color: ai % 2 === 0 ? 0xff5a5a : 0xffffff }));
    slat.position.set(22.2 + ai * 0.58, 2.1, 117.5); slat.rotation.x = 0.35; scene.add(slat);
  }
})();
var bhut = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.6, 4), new THREE.MeshLambertMaterial({ color: 0xff5a5a }));
bhut.position.set(24, 3.8, 120); bhut.rotation.y = Math.PI / 4; scene.add(bhut);
signPlane(signTexture('bar Akari', '#ff2a8a', '#ffffff', false), 4, 1, 24, 2.8, 118.2, Math.PI);
box(3, 0.3, 1, 0xc89a5a, 24, 0.9, 116.5);
// Railing between promenade and beach; the gaps keep the menu, dialogue
// and car-enter shots clear.
(function () {
  var railMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
  [[-210, -100], [-70, -50], [-30, 210]].forEach(function (rg) {
    var len = rg[1] - rg[0], mid = (rg[0] + rg[1]) / 2;
    var top = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, len), railMat);
    top.position.set(14.2, 1.05, mid); scene.add(top);
    var midR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, len), railMat);
    midR.position.set(14.2, 0.6, mid); scene.add(midR);
    for (var rp = rg[0]; rp <= rg[1]; rp += 14) {
      var post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, 0.1), railMat);
      post.position.set(14.2, 0.52, rp); scene.add(post);
    }
  });
})();

// ---- Street furniture ----
var lampMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
for (var l = -190; l < 210; l += 34) {
  box(0.25, 6.5, 0.25, 0x2a2a3a, -8.6, 3.2, l);
  var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), lampMat); lamp.position.set(-8.6, 6.7, l); scene.add(lamp);
  box(0.25, 6.5, 0.25, 0x2a2a3a, 8.6, 3.2, l + 17);
  var lamp2 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), lampMat); lamp2.position.set(8.6, 6.7, l + 17); scene.add(lamp2);
}
function trafficLight(x, z) {
  var g = new THREE.Group();
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 8), new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
  pole.position.y = 2.5; g.add(pole);
  var head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.5), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  head.position.y = 5.2; g.add(head);
  [0x37e07a, 0xffd23f, 0xff2a2a].forEach(function (lc, li) {
    var dot = new THREE.Mesh(new THREE.CircleGeometry(0.22, 10), new THREE.MeshBasicMaterial({ color: lc }));
    dot.position.set(0, 5.65 - li * 0.5, 0.26); g.add(dot);
  });
  g.position.set(x, 0, z); scene.add(g); return g;
}
trafficLight(-8.6, -61); trafficLight(8.6, 41);
function stopSign(x, z) {
  var g = new THREE.Group();
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), new THREE.MeshLambertMaterial({ color: 0x888888 }));
  pole.position.y = 1.3; g.add(pole);
  var oct = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 8), new THREE.MeshLambertMaterial({ color: 0xff2222 }));
  oct.rotation.x = Math.PI / 2; oct.position.y = 2.9; g.add(oct);
  g.position.set(x, 0, z); scene.add(g); return g;
}
stopSign(-8.6, -163); stopSign(8.6, 143);
signPlane(signTexture('TROPICAL COAST', '#ff2a8a', '#ffffff', false), 10, 3, -14, 9, -100, Math.PI / 2);
box(0.4, 9, 0.4, 0x666666, -14, 4.5, -100);
signPlane(signTexture('SURF • SUN • FUN', '#2a9ad8', '#ffffff', false), 10, 3, -14, 9, 100, Math.PI / 2);
box(0.4, 9, 0.4, 0x666666, -14, 4.5, 100);
box(3, 0.15, 1.2, 0x2a9ad8, -11, 1, -80);
box(0.2, 1, 0.2, 0x666666, -12.4, 0.5, -80); box(0.2, 1, 0.2, 0x666666, -9.6, 0.5, -80);
signPlane(signTexture('BUS', '#2a9ad8', '#ffffff', false), 1.2, 1.2, -11, 2.2, -80, Math.PI / 2);

// ---- Ferris wheel + boats ----
var wheel = new THREE.Group();
(function () {
  var rim = new THREE.Mesh(new THREE.TorusGeometry(12, 0.5, 8, 32), new THREE.MeshLambertMaterial({ color: 0xff5a8a }));
  wheel.add(rim);
  for (var s = 0; s < 8; s++) {
    var a = s / 8 * Math.PI * 2;
    var spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 24, 6), new THREE.MeshLambertMaterial({ color: 0xdddddd }));
    spoke.position.set(Math.cos(a) * 0, Math.sin(a) * 0, 0); spoke.rotation.z = a; wheel.add(spoke);
    var cab2 = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshLambertMaterial({ color: beachCols[s % 6] }));
    cab2.position.set(Math.cos(a) * 12, Math.sin(a) * 12, 0); wheel.add(cab2);
  }
  var hub = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 12), new THREE.MeshLambertMaterial({ color: 0x888888 }));
  hub.rotation.x = Math.PI / 2; wheel.add(hub);
  wheel.position.set(72, 20, -175); scene.add(wheel);
  box(2, 20, 2, 0x888888, 72, 10, -175);
})();
function boat(x, z, col) {
  var g = new THREE.Group();
  var hull = new THREE.Mesh(new THREE.BoxGeometry(6, 1.2, 2.4), new THREE.MeshLambertMaterial({ color: col }));
  hull.position.y = 0.4; g.add(hull);
  var cab3 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.5, 2), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  cab3.position.set(-0.5, 1.6, 0); g.add(cab3);
  var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4, 6), new THREE.MeshLambertMaterial({ color: 0x8a6a3a }));
  mast.position.set(1, 3, 0); g.add(mast);
  g.position.set(x, 0, z); scene.add(g); return g;
}
boat(60, -40, 0xffffff); boat(95, 30, 0xff8a2a); boat(45, 90, 0x2a9ad8);
function sailboat(x, z, col) {
  var g = new THREE.Group();
  var hull = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 2), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  hull.position.y = 0.4; g.add(hull);
  var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5, 6), new THREE.MeshLambertMaterial({ color: 0x8a6a3a }));
  mast.position.y = 3; g.add(mast);
  var sail = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
  sail.position.set(1.2, 3, 0); g.add(sail);
  g.position.set(x, 0, z); scene.add(g); return g;
}
sailboat(70, -100, 0xff5a5a); sailboat(120, 80, 0x2ac8ff);

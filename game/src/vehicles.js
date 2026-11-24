// Vehicles: the player coupe, police/taxi/traffic sedans, bikes, boats,
// jetskis and helicopters. All builders use literal coordinates only —
// no seeded calls — so the world layout never shifts.
var tireMat = new THREE.MeshLambertMaterial({ map: treadTex });

// One builder for every car. The sport coupe is an extruded side profile
// (long sloping hood, curved roofline, tapered tail) with the AI flank
// paint mapped onto it; sedans use the same extruded-profile language
// with a taller cabin so the yellow coupe still reads distinct. Wheels
// are r 0.42 at axle 0.42 — planted, normal ride height, not slammed.
function makeCar(color, x, z, kind) {
  var g = new THREE.Group();
  var bodyM = new THREE.MeshLambertMaterial({ color: color });
  var dark = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
  var glassM = new THREE.MeshLambertMaterial({ color: 0x2a4a5a });
  if (kind === 'sport') {
    var sportBodyM = bodyM;
    if (color === 0xffd21a && TEX['car-side']) {
      var csTex = TEX['car-side'].clone(); csTex.needsUpdate = true;
      csTex.repeat.set(1 / 5.56, 0.719); csTex.offset.set(0.516, 0.379);
      sportBodyM = new THREE.MeshLambertMaterial({ map: csTex });
    }
    var bp = new THREE.Shape();
    bp.moveTo(-2.20, 0.34);
    bp.lineTo(-2.45, 0.60);
    bp.quadraticCurveTo(-2.15, 0.80, -1.35, 0.94);
    bp.lineTo(-0.70, 1.00);
    bp.quadraticCurveTo(-0.45, 1.20, 0.05, 1.44);
    bp.quadraticCurveTo(0.45, 1.50, 0.95, 1.46);
    bp.quadraticCurveTo(1.45, 1.38, 1.80, 1.12);
    bp.quadraticCurveTo(2.05, 1.00, 2.20, 0.90);
    bp.lineTo(2.45, 0.82);
    bp.lineTo(2.48, 0.40);
    bp.lineTo(2.05, 0.32);
    bp.lineTo(-2.05, 0.32);
    bp.closePath();
    var bodyGeo = new THREE.ExtrudeGeometry(bp, { depth: 2.1, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 2, curveSegments: 12 });
    var carBody = new THREE.Mesh(bodyGeo, sportBodyM);
    carBody.rotation.y = -Math.PI / 2; carBody.position.x = 1.05; g.add(carBody);
    // Dark glass inlay on both flanks, top edge just below the body line,
    // with a body-colour B-pillar splitting front and rear windows.
    var gp = new THREE.Shape();
    gp.moveTo(-0.60, 1.02);
    gp.lineTo(-0.45, 1.14);
    gp.quadraticCurveTo(-0.05, 1.36, 0.30, 1.42);
    gp.quadraticCurveTo(0.80, 1.42, 1.05, 1.28);
    gp.lineTo(1.15, 1.04);
    gp.lineTo(1.15, 1.02);
    gp.lineTo(-0.60, 1.02);
    gp.closePath();
    var glassGeo = new THREE.ExtrudeGeometry(gp, { depth: 2.34, bevelEnabled: false, curveSegments: 10 });
    var glassInlay = new THREE.Mesh(glassGeo, glassM);
    glassInlay.rotation.y = -Math.PI / 2; glassInlay.position.x = 1.17; g.add(glassInlay);
    [-1.19, 1.19].forEach(function (px) {
      var pillar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.40, 0.07), bodyM);
      pillar.position.set(px, 1.23, 0.45); g.add(pillar);
    });
    [-1.08, 1.08].forEach(function (sx) {
      var skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 3.3), dark);
      skirt.position.set(sx, 0.38, 0.1); g.add(skirt);
    });
    [-1.13, 1.13].forEach(function (fx) {
      var cline = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 2.6), dark);
      cline.position.set(fx, 0.76, 0.15); g.add(cline);
      [-0.55, 0.95].forEach(function (dz) {
        var cut = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.44, 0.03), dark);
        cut.position.set(fx, 0.76, dz); g.add(cut);
      });
      var handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.24), dark);
      handle.position.set(fx, 1.00, 0.55); g.add(handle);
      var haunch = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 1.0), bodyM);
      haunch.position.set(fx, 0.88, 1.45); g.add(haunch);
    });
    [-1.19, 1.19].forEach(function (sx) {
      var streak = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.25, 0.06), new THREE.MeshBasicMaterial({ color: 0xdfe8ee }));
      streak.position.set(sx, 1.20, 0.1); streak.rotation.x = 0.4; g.add(streak);
      var sideLamp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.28), new THREE.MeshBasicMaterial({ color: 0xfff6c8 }));
      sideLamp.position.set(sx * 0.96, 0.66, -2.28); g.add(sideLamp);
    });
    var split = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.25), dark); split.position.set(0, 0.30, -2.48); g.add(split);
    var grille = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.06), dark);
    grille.position.set(0, 0.56, -2.50); g.add(grille);
    // Round 27 (P2 13): the Coast GT nose gets the sedan's chrome
    // slats + a lower intake, so the grille reads as a grille from the
    // front instead of one dark slab; LED strips over the lamps.
    [-0.45, -0.15, 0.15, 0.45].forEach(function (gx) {
      var gslat = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.03), new THREE.MeshLambertMaterial({ color: 0xbbbbbb }));
      gslat.position.set(gx, 0.56, -2.54); g.add(gslat);
    });
    var intake = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.10, 0.05), dark);
    intake.position.set(0, 0.36, -2.50); g.add(intake);
    [-0.8, 0.8].forEach(function (lx) {
      var led = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.045, 0.04), new THREE.MeshBasicMaterial({ color: 0xd8f4ff }));
      led.position.set(lx, 0.92, -2.44); led.rotation.x = -0.22; g.add(led);
    });
    // Round 27 (P2 13): fuel cap on the right rear flank + a fender
    // vent behind each front wheel — the doors had handles and cuts
    // but nothing else to catch the eye.
    var fuelCap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 12), dark);
    fuelCap.rotation.z = Math.PI / 2; fuelCap.position.set(1.14, 0.92, 1.35); g.add(fuelCap);
    [-1.13, 1.13].forEach(function (vx) {
      var vent = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.10, 0.30), dark);
      vent.position.set(vx, 0.72, -1.15); g.add(vent);
    });
    [-1.22, 1.22].forEach(function (mx) {
      var mir = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.3), dark);
      mir.position.set(mx, 1.16, -0.15); g.add(mir);
    });
    var wing = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.05, 0.3), dark); wing.position.set(0, 0.96, 2.28); g.add(wing);
    [-1.15, 1.15].forEach(function (epx) {
      var endplate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.3), dark);
      endplate.position.set(epx, 1.04, 2.28); g.add(endplate);
    });
    var diff = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 0.15), dark); diff.position.set(0, 0.36, 2.50); g.add(diff);
    var tlBar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, 0.06), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    tlBar.position.set(0, 0.66, 2.54); g.add(tlBar);
    [-0.6, 0.6].forEach(function (ex) {
      var exh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.25, 8), new THREE.MeshLambertMaterial({ color: 0x888888 }));
      exh.rotation.x = Math.PI / 2; exh.position.set(ex, 0.48, 2.54); g.add(exh);
    });
    var plate = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.25), new THREE.MeshBasicMaterial({ map: plateTex }));
    plate.position.set(0, 0.48, 2.60); g.add(plate);
    // Gold roof skin (player yellow only): the rear faces away from the low
    // sun, so the roof crown sits in shadow — a thin gold skin with a warm
    // emissive lifts it back to body gold. Ends before the rear glass.
    if (color === 0xffd21a) {
      var rp = new THREE.Shape();
      rp.moveTo(0.0, 1.55);
      rp.quadraticCurveTo(0.45, 1.63, 0.95, 1.57);
      rp.quadraticCurveTo(1.45, 1.49, 1.55, 1.41);
      rp.lineTo(1.55, 1.37);
      rp.quadraticCurveTo(1.45, 1.45, 0.95, 1.53);
      rp.quadraticCurveTo(0.45, 1.59, 0.0, 1.51);
      rp.closePath();
      var roofGeo = new THREE.ExtrudeGeometry(rp, { depth: 1.9, bevelEnabled: false, curveSegments: 10 });
      var roofSkin = new THREE.Mesh(roofGeo, new THREE.MeshLambertMaterial({ color: 0xffd21a, emissive: 0x664400 }));
      roofSkin.rotation.y = -Math.PI / 2; roofSkin.position.x = 0.95; g.add(roofSkin);
    }
    // Dark rear-glass panel on the rear slope (player yellow only) so the
    // roof does not read as bare gold from behind.
    if (color === 0xffd21a) {
      var rwp = new THREE.Shape();
      rwp.moveTo(1.55, 1.36);
      rwp.lineTo(2.05, 1.10);
      rwp.lineTo(2.05, 1.07);
      rwp.lineTo(1.55, 1.33);
      rwp.closePath();
      var rwGeo = new THREE.ExtrudeGeometry(rwp, { depth: 1.5, bevelEnabled: false, curveSegments: 8 });
      var rwPanel = new THREE.Mesh(rwGeo, glassM);
      rwPanel.rotation.y = -Math.PI / 2; rwPanel.position.x = 0.75; g.add(rwPanel);
    }
    if (color === 0xffd21a) {
      var tk = new THREE.Shape();
      tk.moveTo(2.05, 1.07);
      tk.lineTo(2.45, 0.89);
      tk.lineTo(2.56, 0.78);
      tk.lineTo(2.42, 0.78);
      tk.lineTo(2.42, 0.86);
      tk.lineTo(2.02, 1.04);
      tk.closePath();
      var tkGeo = new THREE.ExtrudeGeometry(tk, { depth: 2.0, bevelEnabled: false, curveSegments: 8 });
      var trunkSkin = new THREE.Mesh(tkGeo, new THREE.MeshLambertMaterial({ color: 0xffd21a, emissive: 0x442200 }));
      trunkSkin.rotation.y = -Math.PI / 2; trunkSkin.position.x = 1.0; g.add(trunkSkin);
    }
    if (color === 0xffd21a) {
      [-1, 1].forEach(function (s) {
        [-1.7, 1.7].forEach(function (wz2) {
          var well = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0a0a0a }));
          well.position.set(s * 1.08, 0.42, wz2);
          well.rotation.y = s * Math.PI / 2;
          g.add(well);
          var arch = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.05, 8, 20, Math.PI), dark);
          arch.position.set(s * 1.10, 0.42, wz2);
          arch.rotation.y = Math.PI / 2;
          g.add(arch);
        });
      });
    }
  } else {
    // Sedan: extruded lower profile, tall glass cabin, curved roof.
    var np = new THREE.Shape();
    np.moveTo(-2.30, 0.34);
    np.lineTo(-2.45, 0.56);
    np.quadraticCurveTo(-2.10, 0.72, -1.30, 0.80);
    np.lineTo(-0.70, 0.86);
    np.lineTo(0.90, 0.88);
    np.quadraticCurveTo(1.60, 0.88, 2.10, 0.80);
    np.lineTo(2.30, 0.70);
    np.lineTo(2.32, 0.38);
    np.lineTo(2.00, 0.32); np.lineTo(-2.00, 0.32);
    np.closePath();
    var nBodyGeo = new THREE.ExtrudeGeometry(np, { depth: 2.0, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2, curveSegments: 10 });
    var nBody = new THREE.Mesh(nBodyGeo, bodyM);
    nBody.rotation.y = -Math.PI / 2; nBody.position.x = 1.0; g.add(nBody);
    var cabN = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.48, 1.8), glassM); cabN.position.set(0, 1.12, 0.15); g.add(cabN);
    var nrp = new THREE.Shape();
    nrp.moveTo(-0.55, 1.36);
    nrp.quadraticCurveTo(0.00, 1.56, 0.55, 1.54);
    nrp.quadraticCurveTo(1.05, 1.50, 1.35, 1.32);
    nrp.lineTo(1.35, 1.26);
    nrp.quadraticCurveTo(0.90, 1.44, 0.30, 1.45);
    nrp.quadraticCurveTo(-0.20, 1.44, -0.55, 1.30);
    nrp.closePath();
    var nRoofGeo = new THREE.ExtrudeGeometry(nrp, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1, curveSegments: 10 });
    var nRoof = new THREE.Mesh(nRoofGeo, bodyM);
    nRoof.rotation.y = -Math.PI / 2; nRoof.position.x = 0.8; g.add(nRoof);
    var nShield = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.9), glassM);
    nShield.position.set(0, 1.09, -0.75); nShield.rotation.x = -0.45; g.add(nShield);
    var nRearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.8), glassM);
    nRearGlass.position.set(0, 1.12, 1.35); nRearGlass.rotation.x = 0.45; g.add(nRearGlass);
    var nGrille = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 0.06), dark);
    nGrille.position.set(0, 0.52, -2.44); g.add(nGrille);
    // Round 26 (item 10): chrome vertical slats across the grille so the
    // sedan nose reads as a grille + lamps, not one dark slab.
    [-0.6, -0.2, 0.2, 0.6].forEach(function (gx) {
      var slat = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.03), new THREE.MeshLambertMaterial({ color: 0x888888 }));
      slat.position.set(gx, 0.52, -2.48); g.add(slat);
    });
    var nFascia = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.32, 0.06), dark);
    nFascia.position.set(0, 0.48, 2.38); g.add(nFascia);
    [-1.05, 1.05].forEach(function (sx) {
      var nSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 3.4), dark);
      nSkirt.position.set(sx, 0.38, 0.1); g.add(nSkirt);
      [-1.5, 1.5].forEach(function (wz2) {
        var nWell = new THREE.Mesh(new THREE.CircleGeometry(0.43, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0a0a0a }));
        nWell.position.set(sx * 0.98, 0.42, wz2);
        nWell.rotation.y = (sx > 0 ? 1 : -1) * Math.PI / 2;
        g.add(nWell);
        var nArch = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.045, 8, 20, Math.PI), dark);
        nArch.position.set(sx * 1.02, 0.42, wz2);
        nArch.rotation.y = Math.PI / 2;
        g.add(nArch);
      });
    });
    [-1.07, 1.07].forEach(function (fx) {
      var belt = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 3.0), dark);
      belt.position.set(fx, 0.88, 0.1); g.add(belt);
      [-0.5, 0.9].forEach(function (dz) {
        var cut = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.42, 0.03), dark);
        cut.position.set(fx, 0.69, dz); g.add(cut);
      });
      var handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.22), dark);
      handle.position.set(fx, 0.86, 0.2); g.add(handle);
    });
    if (kind === 'police') {
      // Classic black-and-white: black hood + black trunk deck, a bigger
      // light bar with distinct red/blue pods and a white centre lens, a
      // front push bar and a black rear window band.
      var hoodBlk = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 1.15), dark);
      hoodBlk.position.set(0, 0.84, -1.55); hoodBlk.rotation.x = -0.10; g.add(hoodBlk);
      var trunkBlk = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.85), dark);
      trunkBlk.position.set(0, 0.86, 1.80); trunkBlk.rotation.x = 0.08; g.add(trunkBlk);
      var bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.5), dark); bar.position.set(0, 1.64, 0.15); g.add(bar);
      var red = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.32, 0.52), new THREE.MeshBasicMaterial({ color: 0xff2222 })); red.position.set(-0.42, 1.74, 0.15); g.add(red);
      var blue = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.32, 0.52), new THREE.MeshBasicMaterial({ color: 0x2244ff })); blue.position.set(0.42, 1.74, 0.15); g.add(blue);
      var centre = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.52), new THREE.MeshBasicMaterial({ color: 0xffffff })); centre.position.set(0, 1.74, 0.15); g.add(centre);
      g.userData.lightR = red; g.userData.lightB = blue;
      var pushH = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.1), dark); pushH.position.set(0, 0.59, -2.52); g.add(pushH);
      [-0.6, 0.6].forEach(function (pvx) {
        var pushV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), dark); pushV.position.set(pvx, 0.59, -2.52); g.add(pushV);
      });
      var pRear = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.05), dark); pRear.position.set(0, 0.69, 2.37); g.add(pRear);
      // Round 27 (P2 19): POLICE painted on both doors (transparent
      // canvas texture, reads as lettering on the white door) + a black
      // side stripe low on the flank, so a cruiser reads as POLICE from
      // the side, not just from the light bar.
      [-1, 1].forEach(function (s) {
        var doorTxt = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.29), new THREE.MeshBasicMaterial({ map: policeTex, transparent: true }));
        doorTxt.position.set(s * 1.08, 0.64, 0.10); doorTxt.rotation.y = s * Math.PI / 2; g.add(doorTxt);
        var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 2.6), dark);
        stripe.position.set(s * 1.06, 0.44, 0.10); g.add(stripe);
      });
    }
    if (kind === 'taxi') {
      var sign = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.28, 0.45), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
      sign.position.set(0, 1.72, 0.15); g.add(sign);
    }
    // Round 27 (P2 19): traffic variety — plain sedans/coupes get one
    // deterministic extra by spawn position (no rnd()): roof rails, a
    // rear spoiler, or front fog lamps, so no two traffic cars look
    // identical from the street.
    if (kind === 'sedan' || kind === 'coupe') {
      var variant = ((Math.abs(x * 3 + z * 7)) % 3 + 3) % 3;
      if (variant === 0) {
        [-0.6, 0.6].forEach(function (rx) {
          var rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 1.5), dark);
          rail.position.set(rx, 1.40, 0.15); g.add(rail);
        });
      } else if (variant === 1) {
        var spo = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.28), dark);
        spo.position.set(0, 0.94, 2.28); g.add(spo);
      } else {
        [-0.7, 0.7].forEach(function (fx2) {
          var fog = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.10, 0.05), new THREE.MeshBasicMaterial({ color: 0xfff6c8 }));
          fog.position.set(fx2, 0.42, -2.46); g.add(fog);
        });
      }
    }
  }
  // Black tires, gunmetal ring, five thin silver spokes, dark centre cap.
  // The front wheels are recorded so the gameplay can steer them.
  // Round 26 (item 10): the old flat face disc + ring read as a 2D
  // sticker — a rounded sidewall shoulder + a dished rim barrel give the
  // wheel real depth instead of a flat circle.
  var wz = kind === 'sport' ? 1.7 : 1.5;
  var wx = kind === 'sport' ? 1.00 : 0.92;
  [[-wx, -wz], [wx, -wz], [-wx, wz], [wx, wz]].forEach(function (w) {
    var wg = new THREE.Group();
    if (w[1] < 0) { (g.userData.frontWheels = g.userData.frontWheels || []).push(wg); }
    var tire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 20), tireMat);
    tire.rotation.z = Math.PI / 2; wg.add(tire);
    var sgn = w[0] < 0 ? -1 : 1;
    var shoulder = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.075, 8, 20), new THREE.MeshLambertMaterial({ color: 0x141414 }));
    shoulder.rotation.y = Math.PI / 2; shoulder.position.x = sgn * 0.14; wg.add(shoulder);
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.10, 16), new THREE.MeshLambertMaterial({ color: 0x555555 }));
    barrel.rotation.z = Math.PI / 2; barrel.position.x = sgn * 0.12; wg.add(barrel);
    var ring = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.30, 16), new THREE.MeshBasicMaterial({ color: 0x999999, side: THREE.DoubleSide }));
    ring.rotation.y = sgn * Math.PI / 2; ring.position.x = sgn * 0.175; wg.add(ring);
    for (var sp = 0; sp < 5; sp++) {
      var spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.56, 0.07), new THREE.MeshLambertMaterial({ color: 0xb0b0b0 }));
      spoke.position.set(sgn * 0.15, 0, 0); spoke.rotation.x = sp * Math.PI / 5; wg.add(spoke);
    }
    var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.32, 8), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    cap.rotation.z = Math.PI / 2; wg.add(cap);
    wg.position.set(w[0], 0.42, w[1]); g.add(wg);
  });
  [-0.8, 0.8].forEach(function (fx) {
    var hlW = kind === 'sport' ? 0.62 : 0.35, hlH = kind === 'sport' ? 0.20 : 0.16;
    var hlZ = kind === 'sport' ? -2.42 : -2.47, hlY = kind === 'sport' ? 0.74 : 0.69;
    // Round 26 (item 10): the old bare white box read as a plain block —
    // a dark surround frames the lens and a projector dot gives it a
    // lamp shape instead of a flat slab.
    var surround = new THREE.Mesh(new THREE.BoxGeometry(hlW + 0.10, hlH + 0.08, 0.04), dark);
    surround.position.set(fx, hlY, hlZ + 0.02);
    if (kind === 'sport') surround.rotation.x = -0.22;
    g.add(surround);
    var hl = new THREE.Mesh(new THREE.BoxGeometry(hlW, hlH, 0.06), new THREE.MeshBasicMaterial({ color: kind === 'sport' ? 0xffffff : 0xfff6c8 }));
    if (kind === 'sport') { hl.position.set(fx, 0.74, -2.42); hl.rotation.x = -0.22; } else { hl.position.set(fx, 0.69, -2.47); }
    g.add(hl);
    var proj = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    proj.rotation.x = Math.PI / 2; proj.position.set(fx * 0.72, hlY, hlZ - 0.045); g.add(proj);
    var tl = new THREE.Mesh(new THREE.BoxGeometry(kind === 'sport' ? 0.5 : 0.65, 0.18, 0.06), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    tl.position.set(kind === 'sport' ? fx * 0.69 : fx, kind === 'sport' ? 0.72 : 0.74, kind === 'sport' ? 2.54 : 2.38); g.add(tl);
  });
  g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
  g.position.set(x, 0, z); scene.add(g); return g;
}

// The player coupe "COAST GT" (TC-128), yellow sport coupe.
var player = makeCar(0xffd21a, 0, 10, 'sport');
// Rear treatment, player coupe only: dark rear glass on the roof's rear
// slope, a full-width brake-light strip with white reverse ends, a dark
// rear fascia and chrome exhaust tips — the rear reads as a stack
// (glass / dark band / red bar / fascia) from the chase camera.
(function () {
  var glassDark = new THREE.MeshLambertMaterial({ color: 0x0e1418 });
  var rearGlass2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 0.14), new THREE.MeshLambertMaterial({ color: 0x22303c }));
  rearGlass2.position.set(0, 1.26, 1.52); rearGlass2.rotation.x = 0.70; player.add(rearGlass2);
  var tailBand = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.26, 0.05), glassDark);
  tailBand.position.set(0, 0.86, 2.48); player.add(tailBand);
  var strip = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.30, 0.06), new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
  strip.position.set(0, 0.70, 2.56); player.add(strip);
  [-0.86, 0.86].forEach(function (wx) {
    var rev = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.06), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    rev.position.set(wx, 0.70, 2.56); player.add(rev);
  });
  var fascia = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 0.08), new THREE.MeshLambertMaterial({ color: 0x1a1a2a }));
  fascia.position.set(0, 0.48, 2.52); player.add(fascia);
  // Round 27 (item 13): COAST GT rear badge on the tail band + GT
  // fender badges, so the coupe carries its name like a real GT —
  // the rear used to show only the plate.
  var gtBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.24), new THREE.MeshBasicMaterial({ map: signTextureFit('COAST GT', '#1a1a2a', '#ffd23f') }));
  gtBadge.position.set(0, 0.86, 2.53); player.add(gtBadge);
  [-1, 1].forEach(function (s) {
    var fb = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 0.10), new THREE.MeshBasicMaterial({ map: signTexture('GT', '#1a1a2a', '#ffffff', false) }));
    fb.position.set(s * 1.14, 0.98, -0.95); fb.rotation.y = s * Math.PI / 2; player.add(fb);
  });
  var splitLip = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.06, 0.35), new THREE.MeshLambertMaterial({ color: 0x1a1a2a }));
  splitLip.position.set(0, 0.26, -2.52); player.add(splitLip);
  [-0.6, 0.6].forEach(function (ex) {
    var tip = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 10), new THREE.MeshLambertMaterial({ color: 0xcccccc }));
    tip.rotation.x = Math.PI / 2; tip.position.set(ex, 0.50, 2.58); player.add(tip);
  });
})();
var police = makeCar(0xf2f2f2, 3.2, -2, 'police');
var police2 = makeCar(0xf2f2f2, -3.5, -30, 'police');
var police3 = makeCar(0xf2f2f2, -3.5, -80, 'police');
var police4 = makeCar(0xf2f2f2, 3.5, 40, 'police');
var police5 = makeCar(0xf2f2f2, -3.5, 120, 'police');
var police6 = makeCar(0xf2f2f2, 3.5, 160, 'police');
var taxi = makeCar(0xffd21a, -2, 40, 'taxi');
// Round 23: the taxi drives +z (render.js) so it faces +z — rotation 0
// had it driving backwards, nose to the rear.
taxi.rotation.y = Math.PI;
var traffic = [
  makeCar(0x8a5aff, -3, -50, 'coupe'),
  makeCar(0x37b24a, 3, -80, 'sedan'),
  makeCar(0xff8a2a, -3, -110, 'sedan'),
  makeCar(0x2ac8c8, 3, -140, 'coupe'),
  makeCar(0xd82a5a, -3, -170, 'sedan')
];
// Round 23: coast-road traffic drives +z, so every car faces +z — the
// missing rotation had all five driving backwards (nose to the rear).
traffic.forEach(function (a) { a.rotation.y = Math.PI; });
var aveTraffic = [
  makeCar(0x2a6a8a, -32, -100, 'sedan'),
  makeCar(0xd8d82a, -32, 30, 'coupe'),
  makeCar(0x8a2a5a, -32, 150, 'sedan')
];
aveTraffic.forEach(function (a) { a.rotation.y = Math.PI; });
// Round 24 (bug #6): EVERY cross street carries a car now — the old
// two only ran on Coral St / Sunset Blvd and only over x -58..8, so the
// east-west streets read as empty decoration. One car per cross street,
// full grid width (x -158..8, see render.js), dir in userData.
var crossTraffic = [
  makeCar(0x37e07a, -50, -61, 'coupe'),
  makeCar(0xff5a2a, 0, 41, 'sedan'),
  makeCar(0x2a9ad8, -50, -163, 'sedan'),
  makeCar(0xffd23f, 0, 143, 'coupe')
];
crossTraffic[0].rotation.y = -Math.PI / 2; crossTraffic[0].userData.dir = 1;
crossTraffic[1].rotation.y = Math.PI / 2; crossTraffic[1].userData.dir = -1;
crossTraffic[2].rotation.y = -Math.PI / 2; crossTraffic[2].userData.dir = 1;
crossTraffic[3].rotation.y = Math.PI / 2; crossTraffic[3].userData.dir = -1;
var parked1 = makeCar(0xd82a2a, -29, 100, 'sport'); parked1.rotation.y = Math.PI;
var parked2 = makeCar(0x2a9ad8, -35, -100, 'coupe'); parked2.rotation.y = 0;
var ave2Traffic = [
  makeCar(0x2a8a6a, -80, -60, 'sedan'),
  makeCar(0xc82a8a, -80, 80, 'coupe')
];
ave2Traffic.forEach(function (a) { a.rotation.y = Math.PI; });
// Bike traffic flowing like car traffic (coast road + Avenue 1 + Avenue 2).
// Not enterable.
var bikeTraffic = [
  makeBike(0x2ad82a, 3, -30, Math.PI, 'sport'),
  makeBike(0xffd21a, -32, 60, Math.PI, 'vespa'),
  makeBike(0x8a5aff, -80, -20, Math.PI, 'sport'),
  makeBike(0xff8a2a, -5, -140, Math.PI, 'sport'),
  makeBike(0xff8ac8, -30, -60, Math.PI, 'vespa'),
  makeBike(0x2ac8c8, -78, 40, Math.PI, 'sport'),
  makeBike(0xf2f2f2, 5, 100, Math.PI, 'vespa'),
  makeBike(0xd82a2a, -34, 150, Math.PI, 'sport'),
  makeBike(0x37e07a, -128, 20, Math.PI, 'sport')
];
// Round 23: Avenue 3 traffic — same +z flow as the other avenues, so
// every car faces +z (rotation PI, like aveTraffic / ave2Traffic).
var ave3Traffic = [
  makeCar(0x2a8a6a, -128, -60, 'sedan'),
  makeCar(0xc82a8a, -128, 80, 'coupe')
];
ave3Traffic.forEach(function (a) { a.rotation.y = Math.PI; });
// Round 23: bike-traffic riders — every moving bike carries a rider now
// (a bike rolling along with nobody on it was the bug). A full person()
// figure, seated like the verified fbike/fvespa staging poses: hips on
// the seat, torso leaned forward, hands to the bars, feet to the pegs,
// helmeted head. Parked bikes (`bikes`) are untouched — still riderless,
// the player climbs onto those. person() is called here, after every
// seeded layout call in world.js/character.js, so the shared rnd()
// sequence — and every existing placement — is unchanged.
function makeBikeRider(bike, shirtCol, pantsCol) {
  var rider = person(shirtCol, pantsCol, false, { flat: true });
  var sport = bike.userData.type === 'sport';
  var seatTopY = sport ? 1.05 : 0.845;
  var lean = sport ? 0.62 : 0.12;
  var seatLZ = sport ? 0.45 : 0.4;
  // Same seat math as stageSeat, in bike-local coords: the group origin
  // sits below the hips, so it shifts back 0.95*sin(lean) along the
  // facing and drops 0.95*cos(lean) under the seat top.
  rider.position.set(0, seatTopY - 0.95 * Math.cos(lean), seatLZ + 0.95 * Math.sin(lean));
  rider.rotation.order = 'YXZ';
  rider.rotation.y = Math.PI;
  rider.rotation.x = lean;
  // Seated pose (stagePose indexing: knee = leg.children[1], elbow proxy
  // = arm.children[1]; no arm/leg child is added, removed or reordered).
  var u = rider.userData;
  var hip = sport ? -1.30 : -1.3, knee = sport ? 1.20 : 1.3;
  u.legL.rotation.x = hip; u.legR.rotation.x = hip;
  u.legL.children[1].rotation.x = knee; u.legR.children[1].rotation.x = knee;
  var shoulder = sport ? -1.0 : -0.6, elbow = sport ? -0.35 : -0.5;
  u.armL.rotation.x = shoulder; u.armR.rotation.x = shoulder;
  u.armL.children[1].rotation.x = elbow; u.armR.children[1].rotation.x = elbow;
  var spread = sport ? 0.08 : 0.18;
  u.armL.rotation.z = spread; u.armR.rotation.z = -spread;
  u.head.rotation.x = sport ? -0.2 : 0.1;
  // Helmet: a dark shell over the hair + a clear-ish visor, appended at
  // the END of the head group only (never inserted before existing head
  // meshes).
  var helmM = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
  var shell = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), helmM);
  shell.scale.set(1.05, 1.15, 1.08); shell.position.y = 0.01; u.head.add(shell);
  var visor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.03), new THREE.MeshLambertMaterial({ color: 0x2a4a5a }));
  visor.position.set(0, 0.02, 0.12); u.head.add(visor);
  bike.add(rider);
  return rider;
}
var riderCols = [
  [0xff5a5a, 0x2a2a4a], [0x2a9ad8, 0x4a4a4a], [0x37b24a, 0x2a2a4a],
  [0xffd23f, 0x8a5a2a], [0x9a5aff, 0x2a2a4a], [0x2ac8c8, 0x4a4a4a],
  [0xff8a2a, 0x2a2a4a], [0xff8ac8, 0x8a5a2a], [0x37e07a, 0x2a2a4a]
];
bikeTraffic.forEach(function (bk, bi) {
  var rc = riderCols[bi % riderCols.length];
  makeBikeRider(bk, rc[0], rc[1]);
});
// Police helicopter: white rounded body, blue band, big bubble canopy,
// tail boom with fin and tail rotor, belly + skids, spotlight cone.
var heli = new THREE.Group();
(function () {
  var whiteM = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 });
  var blueM = new THREE.MeshLambertMaterial({ color: 0x2a4ad8 });
  var darkM = new THREE.MeshLambertMaterial({ color: 0x222222 });
  var hb = new THREE.Mesh(new THREE.SphereGeometry(1.15, 14, 10), whiteM);
  hb.scale.set(1, 0.85, 1.75); heli.add(hb);
  var band = new THREE.Mesh(new THREE.SphereGeometry(1.17, 14, 10), blueM);
  band.scale.set(1, 0.14, 1.72); band.position.y = -0.12; heli.add(band);
  var hg = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 10), new THREE.MeshBasicMaterial({ color: 0x9adfff }));
  hg.scale.set(1, 0.8, 0.9); hg.position.set(0, 0.15, -1.45); heli.add(hg);
  var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8), darkM);
  mast.position.y = 0.95; heli.add(mast);
  var rotor = new THREE.Group(); rotor.position.y = 1.2;
  var rb1 = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.07, 0.38), darkM); rotor.add(rb1);
  var rb2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.07, 7.6), darkM); rotor.add(rb2);
  heli.add(rotor); heli.userData.rotor = rotor;
  var tail = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.28, 3.2, 8), whiteM);
  tail.rotation.x = Math.PI / 2; tail.position.set(0, 0.2, 3.2); heli.add(tail);
  var fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.6), blueM);
  fin.position.set(0, 0.55, 4.6); heli.add(fin);
  var tr = new THREE.Group(); tr.position.set(0.2, 0.3, 4.5);
  var tr1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.18), darkM); tr.add(tr1);
  var tr2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 1.2), darkM); tr.add(tr2);
  heli.add(tr);
  var spot = new THREE.Mesh(new THREE.ConeGeometry(2.5, 8, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.12, side: THREE.DoubleSide }));
  spot.position.y = -4.5; heli.add(spot);
  heli.userData.spot = spot;
  var belly = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 3.4), new THREE.MeshLambertMaterial({ color: 0xe8e8e8 }));
  belly.position.set(0, -0.55, 0); heli.add(belly);
  // Round 27 (P2 18): the heli was a smooth egg — side doors with
  // windows + rear side windows, so it reads as a helicopter cabin.
  [-1, 1].forEach(function (s) {
    var door = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 1.05), whiteM);
    door.position.set(s * 1.17, 0.05, -0.2); heli.add(door);
    var doorWin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.62), new THREE.MeshLambertMaterial({ color: 0x2a4a5a }));
    doorWin.position.set(s * 1.21, 0.18, -0.25); heli.add(doorWin);
    var doorHandle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.18), darkM);
    doorHandle.position.set(s * 1.21, -0.08, 0.18); heli.add(doorHandle);
    var rearWin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.30, 0.50), new THREE.MeshLambertMaterial({ color: 0x2a4a5a }));
    rearWin.position.set(s * 1.02, 0.12, 0.95); heli.add(rearWin);
  });
  [-0.85, 0.85].forEach(function (sx) {
    var skid = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 3.2), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    skid.position.set(sx, -0.85, 0); heli.add(skid);
    [-1.2, 1.2].forEach(function (sz) {
      var strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), new THREE.MeshLambertMaterial({ color: 0x222222 }));
      strut.position.set(sx, -0.68, sz); heli.add(strut);
    });
  });
  heli.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
})();
heli.position.set(18, 26, -60); scene.add(heli);
// Motorboat: one smooth lofted deep-V hull tapering to a sharp bow point,
// sheer sweeping up to a low bow tip, white crowned deck, low curved light
// windshield, open cockpit with two bucket seats + rear bench, flat transom
// and a tall clear outboard. Front is -z, length 6.0, max beam 2.2.
// allWhite paints the whole boat white (the rideable one).
function makeMotorboat(color, x, z, heading, ph, allWhite) {
  var g = new THREE.Group();
  var hullM = new THREE.MeshLambertMaterial({ color: color });
  var whiteM = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 });
  var darkM = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
  var trimM = allWhite ? new THREE.MeshLambertMaterial({ color: 0xd8d8d8 }) : darkM;
  var cowlM = allWhite ? whiteM : darkM;
  var ST = [ // z, halfBeam, sheerY, keelY
    [-3.00, 0.03, 0.98, 0.70],
    [-2.85, 0.12, 0.96, 0.55],
    [-2.60, 0.30, 0.93, 0.40],
    [-2.00, 0.58, 0.89, 0.16],
    [-1.00, 0.85, 0.86, 0.04],
    [0.00, 1.00, 0.84, 0.00],
    [1.00, 1.08, 0.83, 0.00],
    [2.00, 1.10, 0.84, 0.02],
    [3.00, 1.08, 0.86, 0.04]
  ];
  function bSection(st) {
    var hb = st[1], sh = st[2], kl = st[3], d = sh - kl;
    return [
      [-hb, sh], [-hb * 0.78, sh - d * 0.35], [-hb * 0.48, kl + 0.10], [0, kl],
      [hb * 0.48, kl + 0.10], [hb * 0.78, sh - d * 0.35], [hb, sh]
    ];
  }
  function stAt(z) {
    for (var s = 0; s < ST.length - 1; s++) {
      if (z >= ST[s][0] && z <= ST[s + 1][0]) {
        var t = (z - ST[s][0]) / (ST[s + 1][0] - ST[s][0]);
        return [z, ST[s][1] + t * (ST[s + 1][1] - ST[s][1]), ST[s][2] + t * (ST[s + 1][2] - ST[s][2]), ST[s][3] + t * (ST[s + 1][3] - ST[s][3])];
      }
    }
    return ST[ST.length - 1];
  }
  (function () {
    var pos = [];
    function tri(a, b, c) { pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
    function P(sec, i, z) { return [sec[i][0], sec[i][1], z]; }
    for (var s = 0; s < ST.length - 1; s++) {
      var A = bSection(ST[s]), B = bSection(ST[s + 1]);
      for (var i = 0; i < 6; i++) {
        tri(P(A, i, ST[s][0]), P(A, i + 1, ST[s][0]), P(B, i + 1, ST[s + 1][0]));
        tri(P(A, i, ST[s][0]), P(B, i + 1, ST[s + 1][0]), P(B, i, ST[s + 1][0]));
      }
    }
    var T = bSection(ST[ST.length - 1]), cz = ST[ST.length - 1][0], cx = 0, cy = 0;
    for (var k = 0; k < T.length; k++) { cx += T[k][0]; cy += T[k][1]; }
    cx /= T.length; cy /= T.length;
    for (var j = 0; j < T.length - 1; j++) tri([cx, cy, cz], [T[j][0], T[j][1], cz], [T[j + 1][0], T[j + 1][1], cz]);
    var hg = new THREE.BufferGeometry();
    hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    hg.computeVertexNormals();
    g.add(new THREE.Mesh(hg, hullM));
  })();
  function hullXAt(z, y) {
    var sec = bSection(stAt(z));
    if (y >= sec[0][1]) return Math.abs(sec[0][0]);
    if (y <= sec[3][1]) return 0;
    for (var i = 0; i < 3; i++) {
      var a = sec[i], b = sec[i + 1];
      if (y <= a[1] && y >= b[1]) {
        var t = (a[1] - y) / (a[1] - b[1]);
        return Math.abs(a[0] + t * (b[0] - a[0]));
      }
    }
    return 0;
  }
  function sheerBand(zs, yLo, yHi, xOff, mat) {
    [-1, 1].forEach(function (sd) {
      var pos = [];
      function tri(a, b, c) { pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
      for (var s = 0; s < zs.length - 1; s++) {
        var A = stAt(zs[s]), B = stAt(zs[s + 1]);
        var x0 = sd * (A[1] + xOff), x1 = sd * (B[1] + xOff);
        var t0 = A[2] + yHi, b0 = A[2] + yLo, t1 = B[2] + yHi, b1 = B[2] + yLo;
        if (sd > 0) { tri([x0, b0, zs[s]], [x0, t0, zs[s]], [x1, t1, zs[s + 1]]); tri([x0, b0, zs[s]], [x1, t1, zs[s + 1]], [x1, b1, zs[s + 1]]); }
        else { tri([x0, t0, zs[s]], [x0, b0, zs[s]], [x1, b1, zs[s + 1]]); tri([x0, t0, zs[s]], [x1, b1, zs[s + 1]], [x1, t1, zs[s + 1]]); }
      }
      var bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      bg.computeVertexNormals();
      g.add(new THREE.Mesh(bg, mat));
    });
  }
  sheerBand([-3.00, -2.85, -2.60, -2.00, -1.00, 0.00, 1.00, 2.00, 3.00], -0.035, 0.035, 0.015, trimM);
  sheerBand([-0.35, 0.00, 1.00, 1.70], 0.01, 0.06, 0.0, whiteM);
  (function () {
    function deckStrip(zs) {
      var pos = [];
      function tri(a, b, c) { pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
      for (var s = 0; s < zs.length - 1; s++) {
        var A = stAt(zs[s]), B = stAt(zs[s + 1]);
        var pA = [-A[1] * 0.94, A[2] + 0.02, zs[s]], cA = [0, A[2] + 0.07, zs[s]], sA = [A[1] * 0.94, A[2] + 0.02, zs[s]];
        var pB = [-B[1] * 0.94, B[2] + 0.02, zs[s + 1]], cB = [0, B[2] + 0.07, zs[s + 1]], sB = [B[1] * 0.94, B[2] + 0.02, zs[s + 1]];
        tri(pA, pB, cB); tri(pA, cB, cA);
        tri(cA, cB, sB); tri(cA, sB, sA);
      }
      var dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      dg.computeVertexNormals();
      g.add(new THREE.Mesh(dg, whiteM));
    }
    deckStrip([-3.00, -2.60, -2.00, -1.00, -0.35]);
    deckStrip([1.70, 2.00, 3.00]);
  })();
  (function () {
    function strip3(zs, edgeFn) {
      var pos = [];
      function tri(a, b, c) { pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
      for (var s = 0; s < zs.length - 1; s++) {
        var A = edgeFn(zs[s]), B = edgeFn(zs[s + 1]);
        var pA = [-A[0], A[1], zs[s]], cA = [0, A[2], zs[s]], sA = [A[0], A[1], zs[s]];
        var pB = [-B[0], B[1], zs[s + 1]], cB = [0, B[2], zs[s + 1]], sB = [B[0], B[1], zs[s + 1]];
        tri(pA, pB, cB); tri(pA, cB, cA);
        tri(cA, cB, sB); tri(cA, sB, sA);
      }
      var dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      dg.computeVertexNormals();
      return dg;
    }
    g.add(new THREE.Mesh(strip3([-0.35, 0.00, 1.00, 1.70], function (z) { return [hullXAt(z, 0.52) - 0.03, 0.52, 0.49]; }), darkM));
    [-1, 1].forEach(function (sd) {
      var pos = [];
      function tri(a, b, c) { pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
      var zs = [-0.30, 0.00, 1.00, 1.65];
      for (var s = 0; s < zs.length - 1; s++) {
        var B0 = [sd * (hullXAt(zs[s], 0.54) - 0.03), 0.54, zs[s]], B1 = [sd * (hullXAt(zs[s + 1], 0.54) - 0.03), 0.54, zs[s + 1]];
        var T0 = [sd * (hullXAt(zs[s], 0.84) - 0.03), 0.84, zs[s]], T1 = [sd * (hullXAt(zs[s + 1], 0.84) - 0.03), 0.84, zs[s + 1]];
        if (sd > 0) { tri(B0, B1, T1); tri(B0, T1, T0); }
        else { tri(B0, T0, T1); tri(B0, T1, B1); }
      }
      var lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      lg.computeVertexNormals();
      g.add(new THREE.Mesh(lg, darkM));
    });
    [[-0.33, 0], [1.68, Math.PI]].forEach(function (bp) {
      var z = bp[0];
      var sec = bSection(stAt(z));
      var sh = new THREE.Shape();
      sh.moveTo(-Math.abs(sec[0][0]) + 0.03, 0.86);
      for (var i = 1; i < sec.length; i++) sh.lineTo(sec[i][0] + (sec[i][0] < 0 ? 0.03 : -0.03), Math.max(sec[i][1], 0.50));
      sh.lineTo(Math.abs(sec[sec.length - 1][0]) - 0.03, 0.86);
      sh.closePath();
      var plate = new THREE.Mesh(new THREE.ShapeGeometry(sh), darkM);
      plate.position.z = z; plate.rotation.y = bp[1]; g.add(plate);
    });
  })();
  var tanM = new THREE.MeshLambertMaterial({ color: allWhite ? 0xf2f2f2 : 0xc8a878 });
  function bucketSeat(sx) {
    var base = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.48), whiteM); base.position.set(sx, 0.60, 0.45); g.add(base);
    var cush = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.06, 0.42), tanM); cush.position.set(sx, 0.71, 0.45); g.add(cush);
    var back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.09), whiteM); back.position.set(sx, 0.92, 0.70); g.add(back);
    var backC = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.30, 0.04), tanM); backC.position.set(sx, 0.92, 0.65); g.add(backC);
  }
  bucketSeat(0.48); bucketSeat(-0.48);
  var bench = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.16, 0.42), whiteM); bench.position.set(0, 0.60, 1.42); g.add(bench);
  var benchCush = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.06, 0.38), tanM); benchCush.position.set(0, 0.71, 1.42); g.add(benchCush);
  var benchBack = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 0.09), whiteM); benchBack.position.set(0, 0.92, 1.63); g.add(benchBack);
  var benchBackC = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.30, 0.04), tanM); benchBackC.position.set(0, 0.92, 1.585); g.add(benchBackC);
  var console_ = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.38, 0.35), whiteM); console_.position.set(0.48, 0.71, -0.08); g.add(console_);
  var dash = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.06, 0.30), darkM); dash.position.set(0.48, 0.91, -0.08); g.add(dash);
  var glassM = new THREE.MeshLambertMaterial({ color: 0x8fb4c8 });
  var shield = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.30, 0.04), glassM);
  shield.position.set(0, 1.00, -0.42); shield.rotation.x = -0.42; g.add(shield);
  var shieldTop = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.045, 0.05), whiteM);
  shieldTop.position.set(0, 1.13, -0.48); shieldTop.rotation.x = -0.42; g.add(shieldTop);
  [-0.47, 0.47].forEach(function (wx) {
    var post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.04), whiteM);
    post.position.set(wx, 1.00, -0.42); post.rotation.x = -0.42; g.add(post);
  });
  [-0.52, 0.52].forEach(function (wx) {
    var wing = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.28), glassM);
    wing.position.set(wx, 0.99, -0.30); wing.rotation.y = -wx * 0.9; wing.rotation.x = -0.3; g.add(wing);
  });
  var column = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8), darkM); column.position.set(0.48, 0.88, 0.02); column.rotation.x = 0.45; g.add(column);
  var wheel = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.03, 8, 20), darkM); wheel.position.set(0.48, 1.00, -0.06); wheel.rotation.x = -0.45; g.add(wheel);
  var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), darkM); hub.rotation.x = Math.PI / 2 - 0.45; hub.position.set(0.48, 1.00, -0.06); g.add(hub);
  var motor = new THREE.Group();
  var cowl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.30), cowlM); cowl.position.set(0, 1.12, 0.06); motor.add(cowl);
  var cowlCap = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 8), cowlM); cowlCap.scale.set(1.0, 0.65, 0.8); cowlCap.position.set(0, 1.35, 0.06); motor.add(cowlCap);
  var cowlTop = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.08, 0.32), whiteM); cowlTop.position.set(0, 1.33, 0.06); motor.add(cowlTop);
  var shaft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.80, 0.16), darkM); shaft.position.set(0, 0.55, 0.06); motor.add(shaft);
  var lower = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.42), darkM); lower.position.set(0, 0.02, 0.12); motor.add(lower);
  var fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.48), darkM); fin.position.set(0, -0.06, 0.14); motor.add(fin);
  motor.position.set(0, 0, 3.02); motor.rotation.x = 0.05; g.add(motor);
  // Round 27 (P2 16): the boat was an open origami tub — a cuddy cabin
  // with windows on the foredeck + a deck rail on both sides, so it
  // reads as a real motorboat instead of a flat folded hull.
  var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.55, 1.00), whiteM); cabin.position.set(0, 1.14, -1.45); g.add(cabin);
  var cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.06, 1.06), whiteM); cabinRoof.position.set(0, 1.44, -1.45); g.add(cabinRoof);
  [-1, 1].forEach(function (s) {
    var cabWin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.62), glassM);
    cabWin.position.set(s * 0.56, 1.20, -1.45); g.add(cabWin);
    var cabWin2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.30), glassM);
    cabWin2.position.set(s * 0.56, 1.20, -0.85); g.add(cabWin2);
  });
  var cabFront = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.30, 0.03), glassM);
  cabFront.position.set(0, 1.20, -1.96); cabFront.rotation.x = -0.25; g.add(cabFront);
  [-1, 1].forEach(function (s) {
    [-0.2, 0.7, 1.6].forEach(function (rz) {
      var post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.30, 6), whiteM);
      post.position.set(s * (hullXAt(rz, 0.86) - 0.12), 1.03, rz); g.add(post);
    });
    var rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.85, 6), whiteM);
    rail.rotation.x = Math.PI / 2; rail.position.set(s * (hullXAt(0.7, 0.86) - 0.12), 1.18, 0.7); g.add(rail);
  });
  g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
  g.position.set(x, -0.22, z); g.rotation.y = heading;
  g.userData.baseY = -0.22; g.userData.ph = ph; g.userData.kind = 'boat';
  scene.add(g); return g;
}
// Jetski: bow tip high and upswept like a ski tip, deck sloping down
// from the bow, a stepped saddle (rider lower, passenger higher), a
// handlebar swept back toward the rider with a small wind deflector,
// rear boarding platform, recessed footwells. Front is -z.
function makeJetski(color, x, z, heading, ph) {
  var g = new THREE.Group();
  var hullM = new THREE.MeshLambertMaterial({ color: color });
  var darkM = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
  var glassM = new THREE.MeshLambertMaterial({ color: 0x2a4a5a });
  var jp = new THREE.Shape();
  jp.moveTo(-1.55, 0.58);
  jp.quadraticCurveTo(-1.42, 0.74, -1.05, 0.62);
  jp.quadraticCurveTo(-0.55, 0.50, -0.10, 0.46);
  jp.lineTo(0.85, 0.42);
  jp.lineTo(1.28, 0.38);
  jp.lineTo(1.28, 0.10);
  jp.lineTo(-0.85, 0.04);
  jp.quadraticCurveTo(-1.30, 0.08, -1.55, 0.58);
  jp.closePath();
  var jHullGeo = new THREE.ExtrudeGeometry(jp, { depth: 0.72, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1, curveSegments: 10 });
  var hull = new THREE.Mesh(jHullGeo, hullM);
  hull.rotation.y = -Math.PI / 2; hull.position.x = 0.36; g.add(hull);
  var jStripe = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 2.4), darkM); jStripe.position.set(0, 0.14, 0); g.add(jStripe);
  [-0.41, 0.41].forEach(function (sx) {
    var acc = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 2.2), new THREE.MeshLambertMaterial({ color: 0xf2f2f2 }));
    acc.position.set(sx, 0.32, 0); g.add(acc);
  });
  [-0.39, 0.39].forEach(function (rx) {
    var rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 2.5), darkM);
    rail.position.set(rx, 0.44, 0); rail.rotation.x = -0.03; g.add(rail);
  });
  var hood = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), hullM); hood.scale.set(0.55, 0.55, 1.1); hood.position.set(0, 0.52, -0.75); g.add(hood);
  var noseW = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.30, 0.35), hullM);
  noseW.position.set(0, 0.55, -1.42); noseW.rotation.x = 0.35; g.add(noseW);
  var shield = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.30), glassM); shield.position.set(0, 0.98, -0.68); shield.rotation.x = -0.5; g.add(shield);
  var seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.62), darkM); seat.position.set(0, 0.52, 0.15); g.add(seat);
  var step = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.50), darkM); step.position.set(0, 0.60, 0.72); g.add(step);
  [-0.24, 0.24].forEach(function (bx) {
    var bol = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.55), darkM);
    bol.position.set(bx, 0.56, 0.15); g.add(bol);
  });
  var platform = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.05, 0.30), darkM); platform.position.set(0, 0.40, 1.15); g.add(platform);
  // Round 27 (P2 17): the rear was a bare cyan block — a black deck mat
  // on the platform, a red tail strip, an exhaust outlet and side vents
  // give the back of the jetski something to look at.
  var deckMat = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.03, 0.26), new THREE.MeshLambertMaterial({ color: 0x0a0a0a })); deckMat.position.set(0, 0.44, 1.15); g.add(deckMat);
  var tailStrip = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0xff2222 })); tailStrip.position.set(0, 0.42, 1.31); g.add(tailStrip);
  var jetExhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.10, 8), darkM); jetExhaust.rotation.x = Math.PI / 2; jetExhaust.position.set(0, 0.22, 1.28); g.add(jetExhaust);
  [-0.30, 0.30].forEach(function (vx) {
    var vent = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.10, 0.30), darkM);
    vent.position.set(vx, 0.38, 1.05); g.add(vent);
  });
  var grab = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), darkM); grab.rotation.z = Math.PI / 2; grab.position.set(0, 0.72, 1.02); g.add(grab);
  [-0.18, 0.18].forEach(function (gx) {
    var gleg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 6), darkM); gleg.position.set(gx, 0.66, 1.02); g.add(gleg);
  });
  [-0.40, 0.40].forEach(function (fx) {
    var fw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.70), darkM);
    fw.position.set(fx, 0.30, 0.25); g.add(fw);
    var spon = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.35), darkM);
    spon.position.set(fx, 0.12, 1.05); g.add(spon);
  });
  var column = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.30, 0.1), darkM); column.position.set(0, 0.72, -0.55); g.add(column);
  [-1, 1].forEach(function (s) {
    var half = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.38, 8), darkM);
    half.rotation.z = Math.PI / 2; half.rotation.y = -s * 0.30;
    half.position.set(s * 0.18, 0.88, -0.52); g.add(half);
    var grip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 8), darkM);
    grip.rotation.z = Math.PI / 2; grip.rotation.y = -s * 0.30;
    grip.position.set(s * 0.35, 0.88, -0.46); g.add(grip);
  });
  g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
  g.position.set(x, -0.12, z); g.rotation.y = heading;
  g.userData.baseY = -0.12; g.userData.ph = ph; g.userData.kind = 'jetski';
  scene.add(g); return g;
}
// Two parked bike types, plain colours only (no logos or livery):
// a classic Vespa scooter and a full-fairing sport bike.
function makeBike(color, x, z, heading, type) {
  var g = new THREE.Group();
  var bodyM = new THREE.MeshLambertMaterial({ color: color });
  var darkM = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
  var chromeM = new THREE.MeshLambertMaterial({ color: 0xb0b0b0 });
  if (type === 'vespa') {
    // Faggio-style scooter: one continuous body profile (tall rounded
    // shield → shallow footboard dip → rounded rear hump), small wheels
    // tucked under the body, long-stalk round mirrors, chrome rear rack.
    // Faggio wheels: bigger tires with a BRIGHT chrome disc + dark hub,
    // so each wheel reads as a circle even at 60px wide.
    [-0.55, 0.55].forEach(function (wz) {
      var tire = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.08, 10, 18), darkM);
      tire.rotation.y = Math.PI / 2; tire.position.set(0, 0.34, wz); g.add(tire);
      var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.12, 16), chromeM);
      hub.rotation.z = Math.PI / 2; hub.position.set(0, 0.34, wz); g.add(hub);
      for (var vsp = 0; vsp < 4; vsp++) {
        var vspoke = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.035), darkM);
        vspoke.position.set(0, 0.34, wz); vspoke.rotation.x = vsp * Math.PI / 4; g.add(vspoke);
      }
      var hubDark = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10), darkM);
      hubDark.rotation.z = Math.PI / 2; hubDark.position.set(0, 0.34, wz); g.add(hubDark);
    });
    var vp = new THREE.Shape();
    vp.moveTo(-0.85, 0.45);
    vp.lineTo(-0.82, 0.88);
    vp.quadraticCurveTo(-0.75, 0.94, -0.62, 0.82);
    vp.quadraticCurveTo(-0.45, 0.60, -0.30, 0.45);
    vp.lineTo(0.30, 0.42);
    vp.quadraticCurveTo(0.45, 0.62, 0.55, 0.70);
    vp.lineTo(0.82, 0.70);
    vp.quadraticCurveTo(0.85, 0.70, 0.85, 0.50);
    vp.lineTo(0.85, 0.42);
    vp.closePath();
    var vGeo = new THREE.ExtrudeGeometry(vp, { depth: 0.20, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3, curveSegments: 8 });
    var vBody = new THREE.Mesh(vGeo, bodyM);
    vBody.rotation.y = -Math.PI / 2; vBody.position.x = 0.10; g.add(vBody);
    var shieldBall = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), bodyM);
    shieldBall.scale.set(0.32, 0.62, 0.28); shieldBall.position.set(0, 0.74, -0.78); g.add(shieldBall);
    var humpBall = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), bodyM);
    humpBall.scale.set(0.40, 0.32, 0.70); humpBall.position.set(0, 0.62, 0.55); g.add(humpBall);
    var floorboard = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.62), darkM);
    floorboard.position.set(0, 0.40, -0.02); g.add(floorboard);
    var trim = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.03, 0.40), new THREE.MeshLambertMaterial({ color: 0x2a9a8a }));
    trim.position.set(0, 0.42, 0.65); g.add(trim);
    var vfender = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 8, 14, Math.PI * 0.75), bodyM);
    vfender.rotation.y = Math.PI / 2; vfender.position.set(0, 0.34, -0.55); g.add(vfender);
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.10, 0.60), darkM); seat.position.set(0, 0.76, 0.48); g.add(seat);
    var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.70, 8), darkM); bar.rotation.z = Math.PI / 2; bar.position.set(0, 0.92, -0.42); g.add(bar);
    [-1, 1].forEach(function (s) {
      var stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.30, 6), darkM);
      stalk.position.set(s * 0.36, 1.02, -0.42); stalk.rotation.z = -s * 0.60; g.add(stalk);
      var mirror = new THREE.Mesh(new THREE.SphereGeometry(0.10, 14, 12), chromeM);
      mirror.scale.set(1, 1, 0.25); mirror.position.set(s * 0.48, 1.18, -0.42); g.add(mirror);
    });
    var rack = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.02, 0.22), chromeM); rack.position.set(0, 0.75, 0.78); g.add(rack);
    [-0.12, 0.12].forEach(function (rx) {
      var strut = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.02), chromeM);
      strut.position.set(rx, 0.72, 0.78); g.add(strut);
    });
    var vExhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 8), chromeM); vExhaust.rotation.x = Math.PI / 2; vExhaust.position.set(0.20, 0.30, 0.30); g.add(vExhaust);
    var lampFrame = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.24, 0.03), chromeM); lampFrame.position.set(0, 0.80, -0.94); g.add(lampFrame);
    var apronBox = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.02), new THREE.MeshLambertMaterial({ color: 0x888888 })); apronBox.position.set(0, 0.55, -0.90); g.add(apronBox);
    // Square headlamp, BRIGHT pale yellow — the grey one read as a smudge.
    var lamp = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.05), new THREE.MeshBasicMaterial({ color: 0xfff2b0 })); lamp.position.set(0, 0.80, -0.96); g.add(lamp);
    // Round 27 (item 14): amber indicators flanking the tail lens +
    // a chrome grab rail over the rear — the P2 14 tail housing below
    // covers the lens + plate.
    [-0.13, 0.13].forEach(function (tx) {
      var turn = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.03), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
      turn.position.set(tx, 0.64, 0.885); g.add(turn);
    });
    var grabBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 8), chromeM);
    grabBar.rotation.z = Math.PI / 2; grabBar.position.set(0, 0.82, 0.80); g.add(grabBar);
    [-0.13, 0.13].forEach(function (gx) {
      var grabLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 6), chromeM);
      grabLeg.position.set(gx, 0.78, 0.80); g.add(grabLeg);
    });
    // Round 27 (P2 14): the rear was a bare hump + one small lamp.
    // A chrome tail housing with a bigger red lens, a white rear plate,
    // and a visible engine block with cooling fins under the hump, so
    // the Vespa reads as a machine from behind, not a smooth toy.
    var tailHouse = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.03), chromeM); tailHouse.position.set(0, 0.62, 0.92); g.add(tailHouse);
    var tailLens = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.08, 0.04), new THREE.MeshBasicMaterial({ color: 0xff2222 })); tailLens.position.set(0, 0.62, 0.94); g.add(tailLens);
    // Round 28: dark backing behind the white plate — white-on-cream had
    // no contrast, the plate was invisible from behind. z 0.94/0.95: the
    // plate sat at 0.78 INSIDE the extruded body (rear face ~0.93), so
    // the R27 plate never showed at all.
    var vPlateBack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.02), darkM); vPlateBack.position.set(0, 0.48, 0.94); g.add(vPlateBack);
    var vPlate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.02), new THREE.MeshBasicMaterial({ color: 0xf2f2f2 })); vPlate.position.set(0, 0.48, 0.95); g.add(vPlate);
    var vEngine = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.22, 0.34), darkM); vEngine.position.set(0, 0.40, 0.58); g.add(vEngine);
    [0.34, 0.40, 0.46].forEach(function (fy) {
      var vfin = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.30), chromeM);
      vfin.position.set(0, fy, 0.58); g.add(vfin);
    });
    var vEngineCap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 10), chromeM); vEngineCap.rotation.z = Math.PI / 2; vEngineCap.position.set(0.17, 0.40, 0.58); g.add(vEngineCap);
    var stand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), darkM); stand.position.set(-0.14, 0.16, 0.2); stand.rotation.z = 0.5; g.add(stand);
  } else {
    // Sport bike: one continuous angular top line (low nose → fairing →
    // tank peak → stepped seat → short pointed tail), torus tires with
    // chrome spokes, round tank, finned engine, single big right exhaust.
    // PCJ-600 wheels: big dark tires with a BRIGHT chrome disc + dark
    // spokes, so each wheel reads as a spoked circle even at 60px wide.
    [-0.8, 0.8].forEach(function (wz) {
      var tire = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.09, 10, 20), darkM);
      tire.rotation.y = Math.PI / 2; tire.position.set(0, 0.39, wz); g.add(tire);
      var rim = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.10, 16), chromeM);
      rim.rotation.z = Math.PI / 2; rim.position.set(0, 0.39, wz); g.add(rim);
      for (var sp = 0; sp < 5; sp++) {
        var spoke = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.035), darkM);
        spoke.position.set(0, 0.39, wz); spoke.rotation.x = sp * Math.PI / 5; g.add(spoke);
      }
      var hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 10), darkM);
      hubCap.rotation.z = Math.PI / 2; hubCap.position.set(0, 0.39, wz); g.add(hubCap);
    });
    // PCJ-600 body: ONE continuous ANGULAR side profile — pointed low
    // nose → steep fairing face → screen base → stepped tank peak →
    // seat step → pointed tail. Sharp corners, almost no bevel: the
    // smooth bevelled profile read as a round red blob, not a sport bike.
    var fp = new THREE.Shape();
    fp.moveTo(-1.12, 0.44);
    fp.lineTo(-1.08, 0.64);
    fp.lineTo(-0.78, 0.82);
    fp.lineTo(-0.55, 0.88);
    fp.lineTo(-0.30, 0.86);
    fp.lineTo(-0.10, 0.92);
    fp.lineTo(0.15, 0.94);
    fp.lineTo(0.35, 0.88);
    fp.lineTo(0.60, 0.88);
    fp.lineTo(0.95, 0.90);
    fp.lineTo(1.14, 0.86);
    fp.lineTo(1.10, 0.70);
    fp.lineTo(0.55, 0.60);
    fp.lineTo(0.10, 0.58);
    fp.lineTo(-0.35, 0.56);
    fp.lineTo(-0.70, 0.52);
    fp.closePath();
    var fairGeo = new THREE.ExtrudeGeometry(fp, { depth: 0.38, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1, curveSegments: 4 });
    var fairing = new THREE.Mesh(fairGeo, bodyM);
    fairing.rotation.y = -Math.PI / 2; fairing.position.x = 0.19; g.add(fairing);
    // Round 27 (P2 15): the old fairing was only 0.24 wide — narrower
    // than the tank, so from the side the bike read as a naked cruiser.
    // Full-width fairing + a belly pan under the engine close the gap
    // between the wheels, like a real faired sport bike.
    var belly = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.20, 0.95), bodyM);
    belly.position.set(0, 0.30, 0.05); g.add(belly);
    var bellyLip = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.50), darkM);
    bellyLip.position.set(0, 0.22, -0.30); g.add(bellyLip);
    // Tank: TALL rounded hump rising well above the fairing top line so
    // it reads as a separate tank — the flat one merged into the fairing.
    var tankBall = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), bodyM);
    tankBall.scale.set(0.40, 0.20, 0.45); tankBall.position.set(0, 1.00, 0.0); g.add(tankBall);
    var tankCap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.12), darkM); tankCap.position.set(0, 1.10, 0.0); g.add(tankCap);
    // Compact dark engine block only — the big grey slab is gone, so the
    // space between the wheels stays open and the wheels read.
    var engine = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.45), new THREE.MeshLambertMaterial({ color: 0x3a3a3a }));
    engine.position.set(0, 0.46, 0.05); g.add(engine);
    [0.38, 0.45, 0.52].forEach(function (fy) {
      var fin = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.40), chromeM);
      fin.position.set(0, fy, 0.05); g.add(fin);
    });
    [-0.15, 0.15].forEach(function (cx) {
      var cover = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 12), chromeM);
      cover.rotation.z = Math.PI / 2; cover.position.set(cx, 0.46, 0.05); g.add(cover);
    });
    var fender = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.06, 8, 14, Math.PI * 0.7), bodyM);
    fender.rotation.y = Math.PI / 2; fender.position.set(0, 0.39, -0.8); g.add(fender);
    // Tall clear windscreen rising well above the fairing, like the SA
    // PCJ-600 — a curved bubble lens, TRANSPARENT so the bars show
    // through it. (Opaque pale read as a solid white sail, not glass.)
    // Dark base strip anchors it to the fairing.
    var screen = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.32, depthWrite: false })); screen.scale.set(0.46, 0.50, 0.16); screen.position.set(0, 1.10, -0.50); screen.rotation.x = -0.30; g.add(screen);
    var screenBase = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.04), darkM); screenBase.position.set(0, 0.90, -0.50); screenBase.rotation.x = -0.45; g.add(screenBase);
    // Stepped seat: passenger seat clearly higher than the rider seat.
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.42), darkM); seat.position.set(0, 0.945, 0.55); g.add(seat);
    var seat2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.34), darkM); seat2.position.set(0, 0.99, 0.88); g.add(seat2);
    var tailCowl = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.20), bodyM); tailCowl.position.set(0, 0.945, 1.05); g.add(tailCowl);
    // Pointed tail tip, like the SA PCJ-600.
    var tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.20, 4), bodyM); tailTip.rotation.x = Math.PI / 2; tailTip.scale.set(1, 1, 0.55); tailTip.position.set(0, 0.94, 1.20); g.add(tailTip);
    // Handlebar with grips + stalk mirrors, like the SA PCJ-600.
    var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8), darkM); bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.00, -0.42); g.add(bar);
    [-1, 1].forEach(function (gx) {
      var grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 8), darkM); grip.rotation.z = Math.PI / 2; grip.position.set(gx * 0.30, 1.00, -0.42); g.add(grip);
      var stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6), chromeM); stalk.position.set(gx * 0.26, 1.12, -0.44); stalk.rotation.z = -gx * 0.5; g.add(stalk);
      var mirror = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), chromeM); mirror.scale.set(1, 1, 0.4); mirror.position.set(gx * 0.32, 1.22, -0.44); g.add(mirror);
    });
    // Chrome front forks, thicker and outside the fairing sides so they
    // read — the old thin ones hid behind the fairing bulges.
    [-0.14, 0.14].forEach(function (fx) {
      var fork = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.90, 6), chromeM);
      fork.position.set(fx, 0.68, -0.62); fork.rotation.x = 0.5; g.add(fork);
    });
    // TWO round headlamps, side by side on the nose — far enough apart
    // to read as a PAIR (the close pair merged into one blob). Dark
    // backing just a rim behind each lamp, like the SA PCJ-600.
    [-0.11, 0.11].forEach(function (lx) {
      var lampBack = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), darkM);
      lampBack.scale.set(1, 1, 0.5); lampBack.position.set(lx, 0.70, -1.02); g.add(lampBack);
      var headlamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
      headlamp.scale.set(1, 1, 0.6); headlamp.position.set(lx, 0.70, -1.05); g.add(headlamp);
      var headRing = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.012, 8, 16), chromeM);
      headRing.position.set(lx, 0.70, -1.07); g.add(headRing);
    });
    var tail = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.05), new THREE.MeshBasicMaterial({ color: 0xff2222 })); tail.position.set(0, 0.84, 1.16); g.add(tail);
    var exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.90, 8), chromeM); exhaust.rotation.x = Math.PI / 2; exhaust.position.set(0.24, 0.26, 0.25); g.add(exhaust);
    var muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.35, 8), chromeM); muffler.rotation.x = Math.PI / 2; muffler.position.set(0.24, 0.28, 0.70); g.add(muffler);
    [-0.24, 0.24].forEach(function (px) {
      var pegArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.10, 6), darkM);
      pegArm.rotation.z = Math.PI / 2; pegArm.position.set(px > 0 ? 0.19 : -0.19, 0.55, 0.30); g.add(pegArm);
      var peg = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.04, 0.14), darkM);
      peg.position.set(px, 0.55, 0.30); g.add(peg);
    });
    var stand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6), darkM); stand.position.set(-0.16, 0.22, 0.3); stand.rotation.z = 0.5; g.add(stand);
  }
  g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
  g.position.set(x, 0, z); g.rotation.y = heading;
  g.userData.kind = 'bike';
  g.userData.type = type; // 'vespa' | 'sport' — the rider pose picks seat height/lean
  scene.add(g); return g;
}
function makeTourHeli() {
  var g = new THREE.Group();
  var whiteM = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 });
  var redM = new THREE.MeshLambertMaterial({ color: 0xd82a2a });
  var darkM = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
  var glassM = new THREE.MeshLambertMaterial({ color: 0x2a4a5a });
  var body = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 10), whiteM); body.scale.set(1, 0.85, 1.7); g.add(body);
  var stripe = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.16, 2.4), redM); stripe.position.y = -0.1; g.add(stripe);
  var glass = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 8), glassM); glass.scale.set(1, 0.8, 0.9); glass.position.set(0, 0.1, -1.35); g.add(glass);
  var boom = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 3.2, 8), whiteM); boom.rotation.x = Math.PI / 2; boom.position.set(0, 0.15, 3.0); g.add(boom);
  var fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.6), redM); fin.position.set(0, 0.5, 4.5); g.add(fin);
  var tailRotor = new THREE.Group(); tailRotor.position.set(0.22, 0.25, 4.4);
  var tr1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.18), darkM); tailRotor.add(tr1);
  var tr2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 1.2), darkM); tailRotor.add(tr2);
  g.add(tailRotor); g.userData.tailRotor = tailRotor;
  var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8), darkM); mast.position.y = 0.95; g.add(mast);
  // Round 27 (P2 18): side doors with windows + rear side windows —
  // the tour heli was a smooth egg with one glass bubble.
  [-0.75, 0.75].forEach(function (sx) {
    var door = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 1.05), whiteM);
    door.position.set(sx * 1.55, 0.05, -0.2); g.add(door);
    var doorWin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.62), glassM);
    doorWin.position.set(sx * 1.60, 0.18, -0.25); g.add(doorWin);
    var doorHandle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.18), darkM);
    doorHandle.position.set(sx * 1.60, -0.08, 0.18); g.add(doorHandle);
    var rearWin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.30, 0.50), glassM);
    rearWin.position.set(sx * 1.31, 0.12, 0.95); g.add(rearWin);
  });
  var rotor = new THREE.Group(); rotor.position.y = 1.2;
  var rb1 = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.07, 0.38), darkM); rotor.add(rb1);
  var rb2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.07, 7.6), darkM); rotor.add(rb2);
  g.add(rotor); g.userData.rotor = rotor;
  [-0.75, 0.75].forEach(function (sx) {
    var skid = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 8), darkM);
    skid.rotation.x = Math.PI / 2; skid.position.set(sx, -0.95, 0.2); g.add(skid);
    [-0.9, 0.9].forEach(function (sz) {
      var strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), darkM);
      strut.position.set(sx, -0.55, sz); strut.rotation.z = -sx * 0.3; g.add(strut);
    });
  });
  g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
  g.position.set(33, 28, 20);
  scene.add(g); return g;
}
// Motorboats in the sea at the beach edge so Gito can wade out and board
// them (E). The white one at (38,30) is the rideable all-white boat.
var motorboats = [
  makeMotorboat(0xffffff, 36, -20, 0.6, 0),
  makeMotorboat(0xffffff, 38, 30, -0.4, 2.1, true),
  makeMotorboat(0x2ac8c8, 39, 90, 0.9, 4.2)
];
var jetskis = [
  makeJetski(0x2ac8ff, 34, -60, 0.3, 1.0),
  makeJetski(0x2ac8ff, 36, 10, -0.8, 3.0),
  makeJetski(0xff2a8a, 38, 120, 0.5, 5.0)
];
// Parked bikes, all rideable (E). Spread so no mission path, car spawn,
// Luna or shop door is blocked.
var bikes = [
  makeBike(0xd82a2a, 6, 12, -1.2, 'sport'),
  makeBike(0xf5f0e6, -12, -20, 0.4, 'vespa'),
  makeBike(0xf0e6d0, 22, 118, 2.2, 'vespa'),
  makeBike(0x2a6ad8, 26, -88, -0.6, 'sport'),
  makeBike(0xff8ac8, -12, -6, 0.9, 'vespa'),
  makeBike(0x7ac8ff, -12, -90, -0.5, 'vespa'),
  makeBike(0xffd23f, -70, -80, 1.8, 'vespa'),
  makeBike(0xe84a4a, -88, -160, 0.3, 'vespa'),
  makeBike(0x9a6aff, -85, 110, 2.6, 'vespa'),
  makeBike(0xf2f2f2, 24, 60, -1.1, 'vespa'),
  makeBike(0x2ad82a, 10, -30, 0.6, 'sport'),
  makeBike(0xff8a2a, -30, -100, 2.0, 'sport'),
  makeBike(0x3a3a3a, -78, -60, -0.9, 'sport'),
  makeBike(0xf2f2f2, -70, 100, 1.4, 'sport'),
  makeBike(0x8a5aff, 16, 150, 0.2, 'sport'),
  makeBike(0x2ac8c8, 12, 100, -1.8, 'sport')
];
// Tour helicopter circling slowly over the beach.
var tourHeli = makeTourHeli();
// Round 27 (P3 20): a PARKED tour heli on a beach helipad, rideable
// (E) — the circling tour heli and the police heli both fly too high to
// board. The parked heli never moves on its own; it only flies while
// Gito is in it (render.js 'heli' branch).
var parkedHeli = makeTourHeli();
parkedHeli.position.set(24, 1.06, 165); // rest altitude = groundY 0.06 + 1.0: skids (local y -0.95) touch the sand; at y 0 the body was buried to its belly and the doors were underground
parkedHeli.rotation.y = 0.6;
(function () {
  var pad = new THREE.Mesh(new THREE.CircleGeometry(5.5, 24), new THREE.MeshLambertMaterial({ color: 0x3a3a4a }));
  pad.rotation.x = -Math.PI / 2; pad.position.set(24, 0.05, 165); scene.add(pad);
  var padRing = new THREE.Mesh(new THREE.RingGeometry(4.9, 5.5, 24), new THREE.MeshBasicMaterial({ color: 0xffd23f, side: THREE.DoubleSide }));
  padRing.rotation.x = -Math.PI / 2; padRing.position.set(24, 0.06, 165); scene.add(padRing);
  var hBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 2.6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  hBar1.position.set(23.1, 0.07, 165); scene.add(hBar1);
  var hBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 2.6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  hBar2.position.set(24.9, 0.07, 165); scene.add(hBar2);
  var hBar3 = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.02, 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  hBar3.position.set(24, 0.07, 165); scene.add(hBar3);
})();

/**
 * Original educational fundus schematics for SOS.
 * Canvas illustrations — not clinical photographs.
 */
(function (global) {
  "use strict";

  var CASES = [
    { id: "NORMAL", title: "Normal fundus", note: "Orange-rød nethinde med skarp papil, fysiologisk ekskavation og intakt makula med foveal refleks. Arteriolernes kaliber er ca. 2/3 af venerne. Ingen blødninger, eksudater eller druser." },
    { id: "DRY_AMD", title: "Tør AMD (druser)", note: "Gullige, runde subretinale aflejringer (druser) samlet i makula. Papil og kar er upåfaldende. Ingen hæmoragi eller grågrønt neovaskulært membran." },
    { id: "WET_AMD", title: "Våd AMD", note: "Makulær subretinal hæmoragi og hårde eksudater ved et grågrønt CNV-membran. Synet er typisk akut nedsat. Papillen er normal." },
    { id: "NPDR", title: "Non-proliferativ diabetisk retinopati", note: "Mikroaneurismer, plet- og pletblødninger samt hårde eksudater. Ingen neovaskularisation. Cotton-wool-spots kan ses ved iskæmi." },
    { id: "PDR", title: "Proliferativ diabetisk retinopati", note: "Neovaskularisation på papillen (NVD) eller andetsteds (NVE) samt præretinale eller vitreale blødninger. Fibrovaskulær proliferation kan trække i nethinden." },
    { id: "PAPILLEDEMA", title: "Papilødem", note: "Bilateralt i ægte stase, men her vist på ét øje: hævet papil med slørede rande, hyperæmi, peripapillære flammehæmoragier og udslettet ekskavation." },
    { id: "GLAUCOMA", title: "Glaukom (ekskaveret papil)", note: "Forstørret, bleg ekskavation med tynd neuroretinal rand (højt cup/disc-ratio). Karne bajonetknækkes ved randen. Makula er upåfaldende." },
    { id: "CRVO", title: "Centralveneokklusion (CRVO)", note: "«Blood and thunder»: udbredte flamme- og pletblødninger i alle kvadranter, dilaterede tortuøse vener og ofte papilødem. Arterierne er relativt sparede." },
    { id: "ARTERY", title: "Arterioleokklusion (CRAO)", note: "Mælket, bleg nethinde pga. indre-lags-iskæmi og cherry-red spot i fovea, hvor choroidea skinner igennem. Arterierne er smalle. Akut, smertefrit synstab." },
    { id: "RD", title: "Amotio retinae", note: "Bulløst løftet, grålig nethinde med folder. Karene slanger sig over den løftede flade, og choroidaltegningen forsvinder i det amoverede område." }
  ];

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(s) {
    var h = 0, i;
    for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function discPos(W, H) {
    return { x: W * 0.68, y: H * 0.50, r: Math.min(W, H) * 0.09 };
  }
  function maculaPos(W, H) {
    return { x: W * 0.42, y: H * 0.52 };
  }

  function drawFundus(canvas, caseId, options) {
    var labeled = !options || options.labeled !== false;
    var kind = caseId || "NORMAL";
    var W = 820, H = 820;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var rng = mulberry32(hash(kind) + 7);
    var cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.46;
    var disc = discPos(W, H);
    var mac = maculaPos(W, H);

    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    var g = ctx.createRadialGradient(mac.x - 20, mac.y - 10, 30, cx, cy, R);
    if (kind === "ARTERY") {
      g.addColorStop(0, "#c4453a");
      g.addColorStop(0.07, "#e2d0a8");
      g.addColorStop(0.5, "#d4c199");
      g.addColorStop(1, "#b7a47a");
    } else {
      g.addColorStop(0, "#c44b38");
      g.addColorStop(0.28, "#d36a48");
      g.addColorStop(0.7, "#c45c3d");
      g.addColorStop(1, "#9a3d2c");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    /* texture */
    var i;
    for (i = 0; i < 1800; i++) {
      var px = cx + (rng() - 0.5) * 2 * R;
      var py = cy + (rng() - 0.5) * 2 * R;
      if ((px - cx) * (px - cx) + (py - cy) * (py - cy) > R * R) continue;
      ctx.fillStyle = "rgba(80,20,10," + (0.04 + rng() * 0.06) + ")";
      ctx.beginPath();
      ctx.arc(px, py, 0.8 + rng() * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    /* macula */
    if (kind !== "ARTERY") {
      var mg = ctx.createRadialGradient(mac.x, mac.y, 4, mac.x, mac.y, 70);
      mg.addColorStop(0, "rgba(90,20,16,0.18)");
      mg.addColorStop(1, "rgba(90,20,16,0)");
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mac.x, mac.y, 70, 0, Math.PI * 2);
      ctx.fill();
    }

    if (kind === "RD") drawRD(ctx, cx, cy, R, rng);
    if (kind === "DRY_AMD") drawDrusen(ctx, mac, rng);
    if (kind === "WET_AMD") drawWetAMD(ctx, mac, rng);
    if (kind === "NPDR") drawNPDR(ctx, mac, disc, rng, R, cx, cy);
    if (kind === "PDR") { drawNPDR(ctx, mac, disc, rng, R, cx, cy); drawPDR(ctx, disc, mac, rng); }
    if (kind === "CRVO") drawCRVO(ctx, disc, mac, rng, cx, cy, R);
    if (kind === "PAPILLEDEMA") drawPeripapillaryHe(ctx, disc, rng);

    drawVessels(ctx, disc, mac, rng, kind);
    drawDisc(ctx, disc, kind, rng);

    if (kind === "ARTERY") {
      ctx.fillStyle = "#c0392b";
      ctx.beginPath();
      ctx.arc(mac.x, mac.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,80,60,0.45)";
      ctx.beginPath();
      ctx.arc(mac.x, mac.y, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    if (kind === "NORMAL" || kind === "GLAUCOMA" || kind === "DRY_AMD") {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.arc(mac.x - 3, mac.y - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    /* camera rim */
    ctx.beginPath();
    ctx.arc(cx, cy, R + 8, 0, Math.PI * 2);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 16;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "600 14px Inter, system-ui, sans-serif";
    ctx.fillText("SOS · skematisk fundus · højre øje · undervisning", 24, 28);

    if (labeled) drawFundusLabels(ctx, kind, disc, mac, W, H);
  }

  function drawDisc(ctx, disc, kind, rng) {
    var swollen = kind === "PAPILLEDEMA" || kind === "CRVO" || kind === "PDR";
    var r = disc.r * (swollen && kind === "PAPILLEDEMA" ? 1.22 : 1);
    var grd = ctx.createRadialGradient(disc.x - 6, disc.y - 6, 4, disc.x, disc.y, r);
    if (kind === "PAPILLEDEMA") {
      grd.addColorStop(0, "#e07a6a");
      grd.addColorStop(1, "#c44b3a");
    } else if (kind === "GLAUCOMA") {
      grd.addColorStop(0, "#f0e0a8");
      grd.addColorStop(0.45, "#e6d08a");
      grd.addColorStop(1, "#d2b56a");
    } else {
      grd.addColorStop(0, "#f3e2b0");
      grd.addColorStop(1, "#e0c07a");
    }
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(disc.x, disc.y, r, 0, Math.PI * 2);
    ctx.fill();

    if (kind === "PAPILLEDEMA") {
      ctx.strokeStyle = "rgba(180,40,30,0.35)";
      ctx.lineWidth = 10;
      ctx.stroke();
    }

    var cupR = kind === "GLAUCOMA" ? r * 0.72 : r * 0.38;
    if (kind !== "PAPILLEDEMA") {
      ctx.fillStyle = kind === "GLAUCOMA" ? "#f7eec8" : "rgba(255,245,210,0.7)";
      ctx.beginPath();
      ctx.arc(disc.x + 2, disc.y, cupR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawVessels(ctx, disc, mac, rng, kind) {
    var thinA = kind === "ARTERY" ? 0.55 : 1;
    var fatV = kind === "CRVO" ? 1.7 : 1;
    var tort = kind === "CRVO" ? 18 : 0;
    var branches = [
      { a: -1.15, len: 1, vein: true },
      { a: -1.15, len: 1, vein: false },
      { a: 1.05, len: 1, vein: true },
      { a: 1.05, len: 1, vein: false },
      { a: -2.3, len: 0.72, vein: true },
      { a: -2.3, len: 0.72, vein: false },
      { a: 2.25, len: 0.72, vein: true },
      { a: 2.25, len: 0.72, vein: false }
    ];
    var b;
    for (b = 0; b < branches.length; b++) {
      var br = branches[b];
      var col = br.vein ? "#7a1828" : "#d4564a";
      var w = (br.vein ? 5.2 * fatV : 3.3 * thinA);
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(disc.x, disc.y);
      var steps = 18;
      var i;
      for (i = 1; i <= steps; i++) {
        var t = i / steps;
        var ang = br.a + (br.vein ? 0.04 : -0.04) + Math.sin(t * 6) * (0.05 + tort * 0.004);
        var dist = t * 280 * br.len;
        var x = disc.x + Math.cos(ang) * dist + Math.sin(t * 9) * tort * (br.vein ? 1 : 0.3);
        var y = disc.y + Math.sin(ang) * dist + Math.cos(t * 8) * tort * 0.35 * (br.vein ? 1 : 0.2);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    /* cilioretinal-like small vessel into macula */
    ctx.strokeStyle = "#d4564a";
    ctx.lineWidth = 2.2 * thinA;
    ctx.beginPath();
    ctx.moveTo(disc.x - disc.r, disc.y);
    ctx.quadraticCurveTo((disc.x + mac.x) / 2, mac.y - 20, mac.x + 28, mac.y);
    ctx.stroke();
  }

  function drawDrusen(ctx, mac, rng) {
    var i;
    for (i = 0; i < 28; i++) {
      var ang = rng() * Math.PI * 2;
      var rad = rng() * 62;
      var x = mac.x + Math.cos(ang) * rad;
      var y = mac.y + Math.sin(ang) * rad * 0.85;
      var rr = 3 + rng() * 5;
      ctx.fillStyle = "rgba(240,214,130,0.9)";
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(180,140,50,0.4)";
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }

  function drawWetAMD(ctx, mac, rng) {
    ctx.fillStyle = "rgba(90,16,20,0.88)";
    ctx.beginPath();
    ctx.ellipse(mac.x + 8, mac.y + 6, 42, 28, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(70,80,50,0.55)";
    ctx.beginPath();
    ctx.ellipse(mac.x - 6, mac.y - 4, 24, 16, 0.3, 0, Math.PI * 2);
    ctx.fill();
    var i;
    for (i = 0; i < 12; i++) {
      ctx.fillStyle = "#f0d56a";
      ctx.beginPath();
      ctx.arc(mac.x - 30 + rng() * 70, mac.y - 24 + rng() * 50, 2 + rng() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawNPDR(ctx, mac, disc, rng, R, cx, cy) {
    var i;
    for (i = 0; i < 40; i++) {
      var x = cx + (rng() - 0.5) * R * 1.5;
      var y = cy + (rng() - 0.5) * R * 1.5;
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > (R * 0.88) * (R * 0.88)) continue;
      ctx.fillStyle = "#6b1218";
      ctx.beginPath();
      ctx.ellipse(x, y, 2 + rng() * 5, 1.5 + rng() * 4, rng() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (i = 0; i < 18; i++) {
      ctx.fillStyle = "#f2d36a";
      ctx.beginPath();
      ctx.arc(mac.x + (rng() - 0.5) * 90, mac.y + (rng() - 0.5) * 70, 2 + rng() * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (i = 0; i < 4; i++) {
      ctx.fillStyle = "rgba(245,240,230,0.85)";
      ctx.beginPath();
      ctx.ellipse(cx + (rng() - 0.5) * 200, cy + (rng() - 0.5) * 200, 10, 7, rng(), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPDR(ctx, disc, mac, rng) {
    /* NVD mesh */
    ctx.strokeStyle = "rgba(180,30,40,0.85)";
    ctx.lineWidth = 1.1;
    var i;
    for (i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo(disc.x, disc.y);
      ctx.quadraticCurveTo(
        disc.x + (rng() - 0.5) * 50,
        disc.y + (rng() - 0.5) * 50,
        disc.x + (rng() - 0.5) * 70,
        disc.y + (rng() - 0.5) * 70
      );
      ctx.stroke();
    }
    /* boat-shaped preretinal hemorrhage */
    ctx.fillStyle = "rgba(90,10,16,0.9)";
    ctx.beginPath();
    ctx.ellipse(mac.x - 40, mac.y + 90, 55, 22, 0.1, 0, Math.PI * 2);
    ctx.fill();
    /* NVE */
    ctx.strokeStyle = "rgba(160,30,40,0.8)";
    for (i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(mac.x - 90, mac.y - 80);
      ctx.lineTo(mac.x - 90 + (rng() - 0.5) * 40, mac.y - 80 + (rng() - 0.5) * 40);
      ctx.stroke();
    }
  }

  function drawCRVO(ctx, disc, mac, rng, cx, cy, R) {
    var i;
    for (i = 0; i < 90; i++) {
      var ang = rng() * Math.PI * 2;
      var rad = 30 + rng() * (R - 40);
      var x = disc.x + Math.cos(ang) * rad * 0.85 + (rng() - 0.5) * 40;
      var y = disc.y + Math.sin(ang) * rad * 0.85 + (rng() - 0.5) * 40;
      ctx.fillStyle = "#5c1018";
      ctx.beginPath();
      ctx.ellipse(x, y, 4 + rng() * 9, 2 + rng() * 5, ang, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPeripapillaryHe(ctx, disc, rng) {
    var i;
    for (i = 0; i < 16; i++) {
      var a = rng() * Math.PI * 2;
      ctx.fillStyle = "#6b1218";
      ctx.beginPath();
      ctx.ellipse(
        disc.x + Math.cos(a) * (disc.r + 8 + rng() * 16),
        disc.y + Math.sin(a) * (disc.r + 8 + rng() * 16),
        8, 3, a, 0, Math.PI * 2
      );
      ctx.fill();
    }
  }

  function drawRD(ctx, cx, cy, R, rng) {
    ctx.fillStyle = "rgba(170,175,185,0.82)";
    ctx.beginPath();
    ctx.moveTo(cx - R, cy + 40);
    ctx.quadraticCurveTo(cx - 40, cy - 30, cx + 20, cy + 10);
    ctx.quadraticCurveTo(cx + 80, cy + 90, cx + R * 0.2, cy + R);
    ctx.lineTo(cx - R, cy + R);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(90,90,100,0.45)";
    ctx.lineWidth = 2;
    var i;
    for (i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - R + 40, cy + 50 + i * 22);
      ctx.quadraticCurveTo(cx - 20, cy + 20 + i * 18, cx + 10, cy + 40 + i * 20);
      ctx.stroke();
    }
  }

  function tag(ctx, text, x, y) {
    ctx.font = "600 13px Inter, system-ui, sans-serif";
    var tw = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(11,18,32,0.72)";
    ctx.fillRect(x - 6, y - 14, tw + 12, 20);
    ctx.fillStyle = "#ffd166";
    ctx.fillText(text, x, y);
  }

  function drawFundusLabels(ctx, kind, disc, mac, W, H) {
    tag(ctx, "Papil", disc.x - 20, disc.y - disc.r - 14);
    tag(ctx, "Makula", mac.x - 24, mac.y + 78);
    if (kind === "DRY_AMD") tag(ctx, "Druser", mac.x + 36, mac.y - 50);
    if (kind === "WET_AMD") {
      tag(ctx, "Hæmoragi", mac.x + 40, mac.y + 10);
      tag(ctx, "Eksudater", mac.x - 90, mac.y - 40);
    }
    if (kind === "NPDR") tag(ctx, "Mikroaneurismer / blødninger", 70, 70);
    if (kind === "PDR") {
      tag(ctx, "NVD", disc.x - 10, disc.y + disc.r + 24);
      tag(ctx, "Præretinal blødning", mac.x - 80, mac.y + 125);
    }
    if (kind === "PAPILLEDEMA") tag(ctx, "Slørede rande", disc.x - 90, disc.y - disc.r - 32);
    if (kind === "GLAUCOMA") tag(ctx, "Stor ekskavation", disc.x - 50, disc.y + 8);
    if (kind === "CRVO") tag(ctx, "Udbredte hæmoragier", 70, 70);
    if (kind === "ARTERY") tag(ctx, "Cherry-red spot", mac.x - 40, mac.y + 40);
    if (kind === "RD") tag(ctx, "Løftet nethinde", 80, H * 0.72);
  }

  global.SOS_FUNDUS = { CASES: CASES, drawFundus: drawFundus };
})(window);

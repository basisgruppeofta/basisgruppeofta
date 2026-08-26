/**
 * Original educational OCT B-scan schematics for SOS.
 * Greyscale macular scans drawn on canvas — not clinical photographs.
 */
(function (global) {
  "use strict";

  var CASES = [
    {
      id: "NORMAL",
      title: "Normal fovea",
      quizKey: "NORMAL",
      note: "Intakt foveal kontur med karakteristisk foveagrube. Alle retinale lag er ubrudte. Ingen væske, druser eller traktion. Ellipsoidzonen og RPE ligger an mod hinanden gennem hele makula."
    },
    {
      id: "DRUSEN",
      title: "Druser (tør AMD)",
      quizKey: "DRUSEN",
      note: "Multiple, afrundede elevationer af RPE forårsaget af sub-RPE-aflejringer (druser) mellem RPE og Bruchs membran. Ingen sub- eller intraretinal væske. Den foveale kontur er ofte bevaret i tidlige stadier."
    },
    {
      id: "CNV",
      title: "CNV / våd AMD",
      quizKey: "CNV",
      note: "Choroidal neovaskularisation med subretinalt hyperreflektivt materiale (SHRM), subretinal og/eller intraretinal væske og ofte RPE-løsning (PED). Foveal kontur er typisk udslukt, og de ydre lag er afbrudte."
    },
    {
      id: "DME",
      title: "Diabetisk makulaødem (DME)",
      quizKey: "DME",
      note: "Intraretinale cystiske, hyporeflektive rum (cystoidt ødem) især i INL og ONL samt nethindefortykkelse. Foveagruben udslukkes. Forandringerne relaterer til diabetisk retinopati og lækage."
    },
    {
      id: "HOLE",
      title: "Maculahul",
      quizKey: null,
      note: "Fuldt gennemgående defekt i alle neuroretinale lag ved fovea (fuldtykkelses-maculahul). Kanten kan have en cuff af subretinal væske, og der kan ses et operculum i vitreus."
    },
    {
      id: "ERM",
      title: "Epiretinal membran",
      quizKey: null,
      note: "Hyperreflektiv membran på den indre nethindeoverflade med rynkning af de indre lag. Foveagruben er ofte udslukt eller irregulær. Membranen kan give traktion og let fortykkelse."
    },
    {
      id: "CSC",
      title: "Central serøs chorioretinopati (CSC)",
      quizKey: null,
      note: "Serøs, kuppelformet løsning af neuroretina med homogen subretinal væske over et relativt intakt RPE. De indre lag er bevarede og «rider» på væskedomen."
    },
    {
      id: "VMT",
      title: "Vitreomakulær traktion",
      quizKey: null,
      note: "Den posteriore hyaloid hæfter stadig i fovea og trækker den indre nethinde opad, så fovea bliver spids eller teltformet. Der kan ses små cystiske rum under traktionspunktet."
    }
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

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function gauss(x, c, s) {
    var d = x - c;
    return Math.exp(-(d * d) / (2 * s * s));
  }

  function makeGeometry(kind, w, h, rng) {
    var cx = (w * 0.5) | 0;
    var sigma = w * 0.078;
    var n = w;
    var ilm = new Float32Array(n);
    var nfl = new Float32Array(n);
    var gcl = new Float32Array(n);
    var ipl = new Float32Array(n);
    var inl = new Float32Array(n);
    var opl = new Float32Array(n);
    var onl = new Float32Array(n);
    var ez = new Float32Array(n);
    var rpeTop = new Float32Array(n);
    var rpeBot = new Float32Array(n);
    var choBot = new Float32Array(n);
    var hole = new Uint8Array(n);
    var fluid = [];
    var cysts = [];
    var shrm = [];
    var ermY = null;
    var hyaloid = null;
    var operculum = null;

    var rpeMean = h * 0.695;
    var thicken = kind === "DME" ? 1.38 : kind === "CNV" ? 1.18 : 1;
    var flatFovea = kind === "DME" || kind === "CNV" || kind === "ERM" ? 0.35 : 1;

    var drusenCenters = [];
    if (kind === "DRUSEN") {
      drusenCenters = [
        { x: cx - w * 0.16, a: 11, s: w * 0.018 },
        { x: cx - w * 0.09, a: 16, s: w * 0.022 },
        { x: cx + w * 0.04, a: 13, s: w * 0.02 },
        { x: cx + w * 0.13, a: 18, s: w * 0.024 },
        { x: cx + w * 0.22, a: 9, s: w * 0.016 },
        { x: cx - w * 0.24, a: 8, s: w * 0.015 }
      ];
    }

    var i;
    for (i = 0; i < n; i++) {
      var g = gauss(i, cx, sigma);
      var inner = gauss(i, cx, sigma * 0.6) * flatFovea;
      var bowl = 0.016 * h * Math.pow((i / w - 0.5) * 2, 2);
      var rpeLift = 0;
      var d;
      for (d = 0; d < drusenCenters.length; d++) {
        rpeLift += drusenCenters[d].a * gauss(i, drusenCenters[d].x, drusenCenters[d].s);
      }
      if (kind === "CNV") {
        rpeLift += 22 * gauss(i, cx + w * 0.03, w * 0.07);
      }

      rpeTop[i] = rpeMean + bowl - rpeLift;
      rpeBot[i] = rpeTop[i] + 7 + rpeLift * 0.25;
      choBot[i] = rpeBot[i] + h * 0.18 + 8 * rng();

      var tEZ = 9;
      var tONL = (30 + 16 * inner) * (kind === "DME" ? 1.45 : 1);
      var tOPL = 11 * (1 - 0.45 * inner);
      var tINL = 15 * (1 - 0.88 * inner) * thicken;
      var tIPL = 13 * (1 - 0.92 * inner);
      var tGCL = 15 * (1 - 0.96 * inner);
      var tNFL = 9 * (1 - 0.88 * inner);

      ez[i] = rpeTop[i] - tEZ;
      onl[i] = ez[i] - tONL;
      opl[i] = onl[i] - tOPL;
      inl[i] = opl[i] - tINL;
      ipl[i] = inl[i] - tIPL;
      gcl[i] = ipl[i] - tGCL;
      nfl[i] = gcl[i] - tNFL;
      ilm[i] = nfl[i] - 2;
    }

    if (kind === "CSC") {
      for (i = 0; i < n; i++) {
        var dome = 58 * gauss(i, cx, w * 0.11);
        ilm[i] -= dome;
        nfl[i] -= dome;
        gcl[i] -= dome;
        ipl[i] -= dome;
        inl[i] -= dome;
        opl[i] -= dome;
        onl[i] -= dome;
        ez[i] -= dome;
      }
      fluid.push({ kind: "srf", y0: function (x) { return ez[x] + 2; }, y1: function (x) { return rpeTop[x] - 1; }, x0: cx - w * 0.28, x1: cx + w * 0.28 });
    }

    if (kind === "VMT") {
      hyaloid = new Float32Array(n);
      for (i = 0; i < n; i++) {
        var peak = 34 * gauss(i, cx, w * 0.032);
        ilm[i] -= peak;
        nfl[i] -= peak * 0.85;
        gcl[i] -= peak * 0.7;
        ipl[i] -= peak * 0.45;
        inl[i] -= peak * 0.25;
        var hx;
        if (i < cx) hx = h * 0.16 + (ilm[i] - h * 0.16) * Math.pow(i / cx, 1.6);
        else hx = h * 0.18 + (ilm[i] - h * 0.18) * Math.pow((n - 1 - i) / (n - 1 - cx), 1.6);
        hyaloid[i] = hx;
      }
      cysts.push({ x: cx, y: (inl[cx] + opl[cx]) / 2, rx: 9, ry: 11 });
      cysts.push({ x: cx - 16, y: (onl[cx] + ez[cx]) / 2, rx: 7, ry: 9 });
    }

    if (kind === "ERM") {
      ermY = new Float32Array(n);
      for (i = 0; i < n; i++) {
        var wr = 3.2 * Math.sin(i / 13) + 1.4 * Math.sin(i / 7);
        var flatten = 22 * gauss(i, cx, sigma * 1.1);
        ilm[i] = ilm[i] - flatten * 0.35 + wr;
        nfl[i] += wr * 0.4;
        ermY[i] = ilm[i] - 4 + 0.6 * Math.sin(i / 11);
      }
    }

    if (kind === "HOLE") {
      var gap = w * 0.042;
      for (i = 0; i < n; i++) {
        if (Math.abs(i - cx) < gap) {
          hole[i] = 1;
        } else {
          var edge = gauss(i, cx, gap * 1.8);
          var cuff = 10 * edge;
          ez[i] -= cuff * 0.4;
          onl[i] -= cuff * 0.2;
          if (Math.abs(i - cx) < gap * 2.2) {
            /* edge rounding already via hole mask */
          }
        }
      }
      operculum = { x: cx + 8, y: ilm[cx] - 42, rx: 16, ry: 6 };
      fluid.push({
        kind: "cuff",
        y0: function (x) { return ez[x] + 1; },
        y1: function (x) { return rpeTop[x] - 1; },
        x0: cx - gap * 2.4,
        x1: cx + gap * 2.4
      });
    }

    if (kind === "DME") {
      var j;
      for (j = 0; j < 14; j++) {
        var cx0 = cx + (rng() - 0.5) * w * 0.34;
        var layerPick = rng();
        var yMid = layerPick < 0.55 ? (inl[cx0 | 0] + opl[cx0 | 0]) / 2 : (onl[cx0 | 0] + ez[cx0 | 0]) / 2;
        cysts.push({
          x: cx0,
          y: yMid + (rng() - 0.5) * 8,
          rx: 7 + rng() * 12,
          ry: 8 + rng() * 14
        });
      }
      cysts.push({ x: cx, y: (onl[cx] + ez[cx]) / 2, rx: 16, ry: 20 });
      cysts.push({ x: cx - 28, y: (inl[cx] + opl[cx]) / 2, rx: 11, ry: 13 });
      cysts.push({ x: cx + 26, y: (inl[cx] + opl[cx]) / 2, rx: 10, ry: 12 });
    }

    if (kind === "CNV") {
      fluid.push({
        kind: "srf",
        y0: function (x) { return ez[x] + 2; },
        y1: function (x) { return rpeTop[x] - 10; },
        x0: cx - w * 0.18,
        x1: cx + w * 0.2
      });
      shrm.push({ x: cx + w * 0.02, y: (ez[cx] + rpeTop[cx]) / 2 + 4, rx: w * 0.08, ry: 16 });
      cysts.push({ x: cx - 18, y: (inl[cx] + opl[cx]) / 2, rx: 10, ry: 13 });
      cysts.push({ x: cx + 12, y: (onl[cx] + ez[cx]) / 2 - 6, rx: 9, ry: 11 });
      cysts.push({ x: cx + 36, y: (inl[cx] + opl[cx]) / 2, rx: 8, ry: 10 });
    }

    return {
      ilm: ilm, nfl: nfl, gcl: gcl, ipl: ipl, inl: inl, opl: opl, onl: onl, ez: ez,
      rpeTop: rpeTop, rpeBot: rpeBot, choBot: choBot, hole: hole,
      fluid: fluid, cysts: cysts, shrm: shrm, ermY: ermY, hyaloid: hyaloid, operculum: operculum,
      cx: cx, kind: kind
    };
  }

  function inEllipse(x, y, e) {
    var dx = (x - e.x) / e.rx;
    var dy = (y - e.y) / e.ry;
    return dx * dx + dy * dy <= 1;
  }

  function layerValue(y, geo, x, rng) {
    if (geo.hole[x]) {
      if (y < geo.rpeTop[x]) return 14 + rng() * 8;
    }
    if (y < geo.ilm[x] - 1) {
      return 10 + rng() * 7;
    }
    if (y < geo.nfl[x]) return 178 + rng() * 28;
    if (y < geo.gcl[x]) return 88 + rng() * 18;
    if (y < geo.ipl[x]) return 148 + rng() * 22;
    if (y < geo.inl[x]) return 70 + rng() * 16;
    if (y < geo.opl[x]) return 155 + rng() * 20;
    if (y < geo.onl[x]) return 50 + rng() * 14;
    if (y < geo.ez[x]) return 188 + rng() * 18;
    if (y < geo.rpeTop[x]) return 205 + rng() * 20;
    if (y < geo.rpeBot[x]) return 228 + rng() * 18;
    if (y < geo.choBot[x]) {
      var vessel = rng() < 0.045 ? -50 : 0;
      return 78 + rng() * 48 + vessel;
    }
    return 145 + rng() * 22;
  }

  function drawOctScan(canvas, caseId, options) {
    var labeled = !options || options.labeled !== false;
    var kind = caseId || "NORMAL";
    var found = CASES.filter(function (c) { return c.id === kind; })[0];
    if (!found) kind = "NORMAL";

    var W = 1000;
    var H = 480;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var rng = mulberry32(hash(kind) + 42);
    var geo = makeGeometry(kind, W, H, rng);

    var img = ctx.createImageData(W, H);
    var data = img.data;
    var x, y, i, v, idx;
    var shadow = new Float32Array(W);

    for (x = 0; x < W; x++) {
      for (y = 0; y < H; y++) {
        v = layerValue(y, geo, x, rng);

        var c;
        for (c = 0; c < geo.cysts.length; c++) {
          if (inEllipse(x, y, geo.cysts[c])) {
            v = 16 + rng() * 10;
            shadow[x] = Math.max(shadow[x], 0.22);
          }
        }
        for (c = 0; c < geo.fluid.length; c++) {
          var f = geo.fluid[c];
          if (x >= f.x0 && x <= f.x1 && y >= f.y0(x) && y <= f.y1(x) && !geo.hole[x]) {
            v = 18 + rng() * 8;
          }
        }
        for (c = 0; c < geo.shrm.length; c++) {
          if (inEllipse(x, y, geo.shrm[c])) v = 155 + rng() * 40;
        }
        if (geo.ermY && Math.abs(y - geo.ermY[x]) < 1.6 && y < geo.ilm[x] + 2) {
          v = 230;
        }
        if (geo.hyaloid && Math.abs(y - geo.hyaloid[x]) < 1.2 && y < geo.ilm[x] - 2) {
          v = 110 + rng() * 20;
        }
        if (geo.operculum && inEllipse(x, y, geo.operculum)) {
          v = 160 + rng() * 30;
        }
        if (y > geo.rpeBot[x]) v *= 1 - shadow[x] * 0.7;

        v = clamp(v, 0, 255);
        idx = (y * W + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = Math.min(255, v + 6);
        data[idx + 3] = 255;
      }
    }
    var tmp = document.createElement("canvas");
    tmp.width = W;
    tmp.height = H;
    tmp.getContext("2d").putImageData(img, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(tmp, 0, 0, W, H);

    drawOverlayLines(ctx, geo, W);
    if (labeled) drawLabels(ctx, geo, kind, W, H);

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillText("SOS · skematisk makula OCT B-scan · undervisning", 14, 18);
    ctx.fillStyle = "rgba(255,209,102,0.9)";
    ctx.fillRect(14, H - 18, 46, 5);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("200 µm", 64, H - 14);
  }

  function drawOverlayLines(ctx, geo, W) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    var x;
    for (x = 0; x < W; x++) {
      if (geo.hole[x]) continue;
      if (x === 0 || geo.hole[x - 1]) ctx.moveTo(x, geo.ilm[x]);
      else ctx.lineTo(x, geo.ilm[x]);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    for (x = 0; x < W; x++) {
      if (x === 0) ctx.moveTo(x, geo.rpeTop[x]);
      else ctx.lineTo(x, geo.rpeTop[x]);
    }
    ctx.stroke();
  }

  function label(ctx, text, x, y, side) {
    ctx.font = "600 13px Inter, system-ui, sans-serif";
    var tw = ctx.measureText(text).width;
    var lx = side === "left" ? 18 : x + 18;
    var tx = side === "left" ? 18 : Math.min(x + 22, 1000 - tw - 16);
    if (side === "left") {
      lx = 18;
      tx = 22;
      x = Math.max(x, 120);
    }
    ctx.strokeStyle = "rgba(255,209,102,0.85)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(side === "left" ? 110 : x + 16, y);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(tx - 4, y - 12, tw + 10, 18);
    ctx.fillStyle = "#ffd166";
    ctx.fillText(text, tx, y + 2);
  }

  function drawLabels(ctx, geo, kind, W, H) {
    var cx = geo.cx;
    var xL = (W * 0.18) | 0;
    label(ctx, "ILM", xL, geo.ilm[xL], "left");
    label(ctx, "RPE", xL, geo.rpeTop[xL] + 2, "left");
    if (kind === "NORMAL") {
      label(ctx, "Foveagrube", cx, geo.ilm[cx] - 8, "right");
      label(ctx, "EZ", (W * 0.72) | 0, geo.ez[(W * 0.72) | 0], "right");
    }
    if (kind === "DRUSEN") {
      label(ctx, "Druse", cx + W * 0.13, geo.rpeTop[(cx + W * 0.13) | 0] - 10, "right");
      label(ctx, "RPE-elevation", cx - W * 0.09, geo.rpeTop[(cx - W * 0.09) | 0] - 8, "left");
    }
    if (kind === "CNV") {
      label(ctx, "IRF (cyste)", cx - 18, geo.inl[cx] + 6, "left");
      label(ctx, "SHRM", cx + 20, (geo.ez[cx] + geo.rpeTop[cx]) / 2, "right");
      label(ctx, "SRF", cx + 80, geo.rpeTop[cx] - 18, "right");
      label(ctx, "PED", cx + 30, geo.rpeTop[cx] + 6, "right");
    }
    if (kind === "DME") {
      label(ctx, "Cystoidt ødem", cx, geo.onl[cx] + 8, "right");
      label(ctx, "Fortykkelse", (W * 0.22) | 0, geo.ilm[(W * 0.22) | 0] - 6, "left");
    }
    if (kind === "HOLE") {
      label(ctx, "Fuldt hul", cx, geo.rpeTop[cx] - 40, "right");
      label(ctx, "Operculum", cx + 8, geo.ilm[cx] - 42, "right");
      label(ctx, "Kantcuff", cx + 70, geo.rpeTop[cx] - 12, "right");
    }
    if (kind === "ERM") {
      label(ctx, "ERM", (W * 0.3) | 0, geo.ilm[(W * 0.3) | 0] - 10, "left");
      label(ctx, "Rynkning", (W * 0.62) | 0, geo.ilm[(W * 0.62) | 0] - 6, "right");
    }
    if (kind === "CSC") {
      label(ctx, "Subretinal væske", cx, (geo.ez[cx] + geo.rpeTop[cx]) / 2, "right");
      label(ctx, "Løftet neuroretina", cx, geo.ilm[cx] - 8, "right");
    }
    if (kind === "VMT") {
      label(ctx, "Hyaloid", (W * 0.22) | 0, geo.hyaloid[(W * 0.22) | 0], "left");
      label(ctx, "Foveal traktion", cx, geo.ilm[cx] - 10, "right");
    }
  }

  function hash(s) {
    var h = 0, i;
    for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  global.SOS_OCT = {
    CASES: CASES,
    drawOctScan: drawOctScan
  };
})(window);

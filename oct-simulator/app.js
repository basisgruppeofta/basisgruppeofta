(function () {
  "use strict";

  var NAMES = {
    NORMAL: "Normal",
    CNV: "CNV (våd AMD)",
    DME: "Diabetisk makulaødem",
    DRUSEN: "Druser (tør AMD)"
  };
  var DESCRIPTIONS = {
    NORMAL: "En normal OCT viser en intakt foveal kontur uden væske, druser eller nydannet karvæv. Alle retinale lag er ubrudte.",
    CNV: "Choroidal neovaskularisation (våd AMD). Typisk ses subretinal eller intraretinal væske samt et hyperreflektivt kompleks (SHRM) under retina.",
    DME: "Diabetisk makulaødem. Karakteriseret ved intraretinale cystiske rum og fortykkelse af retina relateret til diabetes.",
    DRUSEN: "Druser (tør AMD). Viser sig som bølgende elevationer af RPE uden tilstedeværelse af væske."
  };
  var SCHEMATIC_FOR = { NORMAL: "NORMAL", CNV: "CNV", DME: "DME", DRUSEN: "DRUSEN" };

  var mode = "atlas";
  var dataset = [];
  var currentIndex = 0;
  var score = 0;
  var streak = 0;
  var answered = false;
  var atlasId = "NORMAL";

  var imageEl = document.getElementById("oct-image");
  var fallbackEl = document.getElementById("oct-fallback");
  var scoreEl = document.getElementById("score-display");
  var streakEl = document.getElementById("streak-display");
  var progressEl = document.getElementById("progress-display");
  var buttons = document.querySelectorAll(".btn-choice");
  var feedbackPanel = document.getElementById("feedback-panel");
  var feedbackText = document.getElementById("feedback-text");
  var statusEl = document.getElementById("oct-status");
  var atlasCanvas = document.getElementById("oct-atlas-canvas");

  function shuffle(arr) {
    var i, j, t;
    for (i = arr.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function schematicDataset() {
    return SOS_OCT.CASES.filter(function (c) { return c.quizKey; }).map(function (c) {
      return { image_url: null, correct_answer: c.quizKey, schematic: true };
    });
  }

  function showStatus(msg) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("is-open", !!msg);
  }

  function setMode(next) {
    mode = next;
    var atlas = document.getElementById("panel-atlas");
    var test = document.getElementById("panel-test");
    var tabA = document.getElementById("tab-atlas");
    var tabT = document.getElementById("tab-test");
    var isAtlas = next === "atlas";
    atlas.classList.toggle("panel-hidden", !isAtlas);
    test.classList.toggle("panel-hidden", isAtlas);
    tabA.setAttribute("aria-selected", String(isAtlas));
    tabT.setAttribute("aria-selected", String(!isAtlas));
    if (isAtlas) renderAtlas();
  }

  function renderAtlas() {
    var list = document.getElementById("oct-atlas-list");
    list.innerHTML = "";
    SOS_OCT.CASES.forEach(function (c) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "atlas-item";
      btn.textContent = c.title;
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-current", c.id === atlasId ? "true" : "false");
      btn.addEventListener("click", function () {
        atlasId = c.id;
        renderAtlas();
      });
      list.appendChild(btn);
    });
    var current = SOS_OCT.CASES.filter(function (c) { return c.id === atlasId; })[0] || SOS_OCT.CASES[0];
    document.getElementById("oct-atlas-title").textContent = current.title;
    document.getElementById("oct-atlas-note").textContent = current.note;
    atlasCanvas.setAttribute("aria-label", "Skematisk OCT: " + current.title);
    SOS_OCT.drawOctScan(atlasCanvas, current.id, { labeled: true });
  }

  function showSchematic(diag) {
    imageEl.classList.add("panel-hidden");
    imageEl.removeAttribute("src");
    fallbackEl.classList.remove("panel-hidden");
    SOS_OCT.drawOctScan(fallbackEl, SCHEMATIC_FOR[diag] || "NORMAL", { labeled: false });
  }

  function loadNextImage() {
    if (!dataset.length) {
      showStatus("Ingen scans i datasættet. Viser skematiske eksempler i stedet.");
      dataset = schematicDataset();
    }
    if (currentIndex >= dataset.length) {
      currentIndex = 0;
      shuffle(dataset);
    }
    answered = false;
    buttons.forEach(function (btn) {
      btn.classList.remove("correct", "wrong", "missed");
      btn.disabled = false;
    });
    feedbackPanel.classList.remove("is-open");
    feedbackPanel.style.display = "none";

    var current = dataset[currentIndex];
    if (!current) {
      showStatus("Datasættet er tomt.");
      return;
    }
    progressEl.textContent = (currentIndex + 1) + " / " + dataset.length;

    fallbackEl.classList.add("panel-hidden");
    imageEl.classList.remove("panel-hidden");
    imageEl.alt = "OCT-scan af makula. Stil diagnosen.";

    if (!current.image_url) {
      showSchematic(current.correct_answer);
      return;
    }
    imageEl.onerror = function () {
      showStatus("Et scan kunne ikke indlæses. Viser skematisk eksempel for samme diagnose, så quizzen ikke står blank.");
      showSchematic(current.correct_answer);
    };
    imageEl.onload = function () {
      imageEl.classList.remove("panel-hidden");
      fallbackEl.classList.add("panel-hidden");
    };
    imageEl.src = current.image_url;
  }

  function handleGuess(selected, clicked) {
    if (answered) return;
    var current = dataset[currentIndex];
    if (!current) return;
    answered = true;
    var correct = current.correct_answer;
    buttons.forEach(function (btn) { btn.disabled = true; });

    if (selected === correct) {
      clicked.classList.add("correct");
      score += 1;
      streak += 1;
      feedbackText.innerHTML = "<strong>Korrekt!</strong> " + NAMES[correct] + ".<br><br>" + DESCRIPTIONS[correct];
    } else {
      clicked.classList.add("wrong");
      streak = 0;
      buttons.forEach(function (btn) {
        if (btn.getAttribute("data-diag") === correct) btn.classList.add("missed");
      });
      feedbackText.innerHTML = "<strong>Forkert.</strong> Det korrekte svar var <strong>" + NAMES[correct] + "</strong>.<br><br>" + DESCRIPTIONS[correct];
    }
    scoreEl.textContent = String(score);
    streakEl.textContent = String(streak);
    feedbackPanel.classList.add("is-open");
    feedbackPanel.style.display = "block";
    currentIndex += 1;
  }

  function setupButtons() {
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        handleGuess(btn.getAttribute("data-diag"), btn);
      });
    });
    document.getElementById("btn-next").addEventListener("click", loadNextImage);
  }

  function initTest() {
    fetch("data.json")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data) || data.length === 0) throw new Error("empty");
        dataset = data.filter(function (item) {
          return item && item.correct_answer && SCHEMATIC_FOR[item.correct_answer];
        });
        if (!dataset.length) throw new Error("empty");
        shuffle(dataset);
        loadNextImage();
      })
      .catch(function () {
        dataset = schematicDataset();
        showStatus("Kunne ikke indlæse data.json. Quizzen kører med skematiske OCT-scans.");
        loadNextImage();
      });
  }

  document.getElementById("tab-atlas").addEventListener("click", function () { setMode("atlas"); });
  document.getElementById("tab-test").addEventListener("click", function () { setMode("test"); });

  document.addEventListener("keydown", function (e) {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (mode === "atlas") {
      var ids = SOS_OCT.CASES.map(function (c) { return c.id; });
      var i = ids.indexOf(atlasId);
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        atlasId = ids[(i + 1) % ids.length];
        renderAtlas();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        atlasId = ids[(i - 1 + ids.length) % ids.length];
        renderAtlas();
      }
      return;
    }
    if (e.key === "Enter" || e.key === "n" || e.key === "N") {
      if (answered) loadNextImage();
      return;
    }
    var map = { "1": 0, "2": 1, "3": 2, "4": 3 };
    if (map[e.key] != null && !answered) {
      var btn = buttons[map[e.key]];
      if (btn) handleGuess(btn.getAttribute("data-diag"), btn);
    }
  });

  setupButtons();
  renderAtlas();
  initTest();
})();

(function () {
  "use strict";

  var mode = "atlas";
  var atlasId = "NORMAL";
  var queue = [];
  var qIndex = 0;
  var score = 0;
  var streak = 0;
  var answered = false;
  var current = null;
  var choices = [];

  var atlasCanvas = document.getElementById("fund-atlas-canvas");
  var quizCanvas = document.getElementById("fund-quiz-canvas");
  var scoreEl = document.getElementById("score-display");
  var streakEl = document.getElementById("streak-display");
  var progressEl = document.getElementById("progress-display");
  var grid = document.getElementById("button-grid");
  var feedbackPanel = document.getElementById("feedback-panel");
  var feedbackText = document.getElementById("feedback-text");

  function shuffle(arr) {
    var i, j, t;
    for (i = arr.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
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
    else if (!current) loadNext();
    else SOS_FUNDUS.drawFundus(quizCanvas, current.id, { labeled: false });
  }

  function renderAtlas() {
    var list = document.getElementById("fund-atlas-list");
    list.innerHTML = "";
    SOS_FUNDUS.CASES.forEach(function (c) {
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
    var cur = SOS_FUNDUS.CASES.filter(function (c) { return c.id === atlasId; })[0] || SOS_FUNDUS.CASES[0];
    document.getElementById("fund-atlas-title").textContent = cur.title;
    document.getElementById("fund-atlas-note").textContent = cur.note;
    atlasCanvas.setAttribute("aria-label", "Skematisk fundus: " + cur.title);
    SOS_FUNDUS.drawFundus(atlasCanvas, cur.id, { labeled: true });
  }

  function buildQueue() {
    queue = SOS_FUNDUS.CASES.slice();
    shuffle(queue);
    qIndex = 0;
  }

  function pickChoices(correct) {
    var others = SOS_FUNDUS.CASES.filter(function (c) { return c.id !== correct.id; });
    shuffle(others);
    var opts = [correct].concat(others.slice(0, 3));
    return shuffle(opts);
  }

  function loadNext() {
    if (!queue.length || qIndex >= queue.length) buildQueue();
    current = queue[qIndex];
    answered = false;
    choices = pickChoices(current);
    progressEl.textContent = (qIndex + 1) + " / " + queue.length;
    feedbackPanel.classList.remove("is-open");
    feedbackPanel.style.display = "none";
    quizCanvas.setAttribute("aria-label", "Skematisk fundus. Stil diagnosen.");
    SOS_FUNDUS.drawFundus(quizCanvas, current.id, { labeled: false });

    grid.innerHTML = "";
    choices.forEach(function (c, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-choice";
      btn.setAttribute("data-id", c.id);
      btn.innerHTML = c.title + " <kbd>" + (i + 1) + "</kbd>";
      btn.addEventListener("click", function () { handleGuess(c.id, btn); });
      grid.appendChild(btn);
    });
  }

  function handleGuess(selectedId, clicked) {
    if (answered || !current) return;
    answered = true;
    var btns = grid.querySelectorAll(".btn-choice");
    btns.forEach(function (b) { b.disabled = true; });
    if (selectedId === current.id) {
      clicked.classList.add("correct");
      score += 1;
      streak += 1;
      feedbackText.innerHTML = "<strong>Korrekt!</strong> " + current.title + ".<br><br>" + current.note;
    } else {
      clicked.classList.add("wrong");
      streak = 0;
      btns.forEach(function (b) {
        if (b.getAttribute("data-id") === current.id) b.classList.add("missed");
      });
      feedbackText.innerHTML = "<strong>Forkert.</strong> Det korrekte svar var <strong>" + current.title + "</strong>.<br><br>" + current.note;
    }
    scoreEl.textContent = String(score);
    streakEl.textContent = String(streak);
    feedbackPanel.classList.add("is-open");
    feedbackPanel.style.display = "block";
    qIndex += 1;
  }

  document.getElementById("tab-atlas").addEventListener("click", function () { setMode("atlas"); });
  document.getElementById("tab-test").addEventListener("click", function () { setMode("test"); });
  document.getElementById("btn-next").addEventListener("click", loadNext);

  document.addEventListener("keydown", function (e) {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (mode === "atlas") {
      var ids = SOS_FUNDUS.CASES.map(function (c) { return c.id; });
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
      if (answered) loadNext();
      return;
    }
    var map = { "1": 0, "2": 1, "3": 2, "4": 3 };
    if (map[e.key] != null && !answered) {
      var btn = grid.querySelectorAll(".btn-choice")[map[e.key]];
      if (btn) handleGuess(btn.getAttribute("data-id"), btn);
    }
  });

  renderAtlas();
  buildQueue();
})();

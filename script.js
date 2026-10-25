(() => {
  "use strict";

  // ---------- icon drawing (shared by sidebar previews and canvas markers) ----------

  function drawSmoke(ctx, x, y, s) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#b9bec6";
    ctx.strokeStyle = "#6e737c";
    ctx.lineWidth = Math.max(1, s * 0.06);
    const puffs = [
      [0, s * 0.15, s * 0.62],
      [-s * 0.45, s * 0.3, s * 0.42],
      [s * 0.45, s * 0.3, s * 0.42],
      [-s * 0.2, -s * 0.25, s * 0.48],
      [s * 0.22, -s * 0.22, s * 0.46],
    ];
    puffs.forEach(([dx, dy, r]) => {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawGrenade(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#4a5a33";
    ctx.strokeStyle = "#1c2314";
    ctx.lineWidth = Math.max(1, s * 0.08);

    // body
    ctx.beginPath();
    ctx.ellipse(0, s * 0.08, s * 0.5, s * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // grid lines (pineapple texture)
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, s * 0.08);
    ctx.lineTo(s * 0.5, s * 0.08);
    ctx.moveTo(0, -s * 0.5);
    ctx.lineTo(0, s * 0.66);
    ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.stroke();

    // top lever + pin
    ctx.fillStyle = "#2c2c2c";
    ctx.fillRect(-s * 0.1, -s * 0.62, s * 0.2, s * 0.22);
    ctx.beginPath();
    ctx.arc(s * 0.18, -s * 0.58, s * 0.16, 0, Math.PI * 2);
    ctx.strokeStyle = "#8a8a8a";
    ctx.lineWidth = Math.max(1, s * 0.07);
    ctx.stroke();

    ctx.restore();
  }

  function drawEnemy(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(214, 48, 49, 0.9)";
    ctx.strokeStyle = "#3a0a0a";
    ctx.lineWidth = Math.max(1, s * 0.08);

    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // crosshair ticks
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = Math.max(1, s * 0.09);
    const o = s * 0.42, i = s * 0.2;
    [0, 90, 180, 270].forEach((deg) => {
      const rad = (deg * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(Math.cos(rad) * i, Math.sin(rad) * i);
      ctx.lineTo(Math.cos(rad) * o, Math.sin(rad) * o);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawCover(ctx, x, y, s, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.fillStyle = "#b08a52";
    ctx.strokeStyle = "#4a3620";
    ctx.lineWidth = Math.max(1, s * 0.09);

    const r = s * 0.6;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.87, r * 0.5);
    ctx.lineTo(-r * 0.87, r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // hatch to indicate solid cover
    ctx.strokeStyle = "rgba(74, 54, 32, 0.6)";
    ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.35);
    ctx.lineTo(0, r * 0.5);
    ctx.stroke();

    ctx.restore();
  }

  function drawPath(ctx, points, s, finished) {
    if (points.length < 2) {
      if (points.length === 1) {
        ctx.save();
        ctx.fillStyle = "#4da3ff";
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, s * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }
    ctx.save();
    ctx.strokeStyle = "#4da3ff";
    ctx.lineWidth = Math.max(2, s * 0.14);
    ctx.setLineDash([s * 0.35, s * 0.3]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // start dot
    ctx.fillStyle = "#4da3ff";
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, s * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // arrowhead at end
    const p1 = points[points.length - 2];
    const p2 = points[points.length - 1];
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const headLen = s * 0.5;
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(
      p2.x - headLen * Math.cos(angle - Math.PI / 7),
      p2.y - headLen * Math.sin(angle - Math.PI / 7)
    );
    ctx.lineTo(
      p2.x - headLen * Math.cos(angle + Math.PI / 7),
      p2.y - headLen * Math.sin(angle + Math.PI / 7)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const ICON_DRAW = { smoke: drawSmoke, grenade: drawGrenade, enemy: drawEnemy };

  // ---------- sidebar icon previews ----------

  document.querySelectorAll("canvas[data-icon]").forEach((c) => {
    const ctx = c.getContext("2d");
    const cx = c.width / 2, cy = c.height / 2, s = c.width * 0.8;
    const type = c.dataset.icon;
    if (ICON_DRAW[type]) ICON_DRAW[type](ctx, cx, cy, s);
    else if (type === "cover") drawCover(ctx, cx, cy, s, 0);
    else if (type === "path") drawPath(ctx, [{ x: cx - s * 0.35, y: cy + s * 0.3 }, { x: cx + s * 0.35, y: cy - s * 0.3 }], s);
    else if (type === "select") {
      ctx.save();
      ctx.strokeStyle = "#e7e9ee";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.3, cy - s * 0.35);
      ctx.lineTo(cx - s * 0.3, cy + s * 0.4);
      ctx.lineTo(cx - s * 0.05, cy + s * 0.2);
      ctx.lineTo(cx + s * 0.12, cy + s * 0.38);
      ctx.lineTo(cx + s * 0.22, cy + s * 0.28);
      ctx.lineTo(cx + s * 0.02, cy + s * 0.08);
      ctx.lineTo(cx + s * 0.3, cy + s * 0.05);
      ctx.closePath();
      ctx.fillStyle = "#e7e9ee";
      ctx.fill();
      ctx.restore();
    }
  });

  // ---------- app state ----------

  const canvas = document.getElementById("mapCanvas");
  const ctx = canvas.getContext("2d");
  const canvasWrap = document.getElementById("canvasWrap");
  const emptyState = document.getElementById("emptyState");
  const exportBtn = document.getElementById("exportBtn");
  const hint = document.getElementById("hint");
  const pathToolbar = document.getElementById("pathToolbar");

  let mapImage = null;
  let markers = []; // {id, type, x, y, rotation?, points?}
  let currentTool = "select";
  let nextId = 1;

  let coverDraft = null; // {x, y, angle}
  let pathDraft = null;  // {points: [{x,y}]}
  let hoverPoint = null;

  const HINTS = {
    select: "마커를 클릭하면 삭제됩니다.",
    smoke: "지도를 클릭해 연막탄 위치를 표시하세요.",
    grenade: "지도를 클릭해 투척 지점을 표시하세요.",
    enemy: "지도를 클릭해 적 위치를 표시하세요.",
    cover: "클릭 후 드래그해 엄폐물 방향을 지정하세요.",
    path: "클릭으로 경로 점을 추가하세요.",
  };

  function markerSize() {
    return Math.max(16, Math.min(canvas.width, canvas.height) * 0.028);
  }

  function setTool(tool) {
    currentTool = tool;
    pathDraft = null;
    coverDraft = null;
    pathToolbar.hidden = tool !== "path";
    document.querySelectorAll(".tool-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.tool === tool);
    });
    canvas.classList.toggle("tool-select", tool === "select");
    hint.textContent = mapImage ? HINTS[tool] : "지도를 먼저 불러와 주세요.";
    redraw();
  }

  document.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => setTool(btn.dataset.tool));
  });

  // ---------- image loading ----------

  const mapInput = document.getElementById("mapInput");
  mapInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (markers.length && !confirm("새 지도를 불러오면 현재 표시가 모두 사라집니다. 계속할까요?")) {
      mapInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        mapImage = img;
        markers = [];
        const maxW = 2200;
        const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        emptyState.style.display = "none";
        exportBtn.disabled = false;
        setTool("select");
        redraw();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    mapInput.value = "";
  });

  // ---------- rendering ----------

  function redraw() {
    if (!mapImage) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

    const s = markerSize();
    markers.forEach((m) => {
      if (m.type === "cover") drawCover(ctx, m.x, m.y, s, m.rotation);
      else if (m.type === "path") drawPath(ctx, m.points, s, true);
      else if (ICON_DRAW[m.type]) ICON_DRAW[m.type](ctx, m.x, m.y, s);
    });

    if (coverDraft) {
      drawCover(ctx, coverDraft.x, coverDraft.y, s, coverDraft.angle);
    }

    if (pathDraft) {
      const pts = hoverPoint ? [...pathDraft.points, hoverPoint] : pathDraft.points;
      drawPath(ctx, pts, s, false);
      pathDraft.points.forEach((p) => {
        ctx.save();
        ctx.fillStyle = "#4da3ff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, s * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
  }

  // ---------- coordinate helpers ----------

  function getPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY,
    };
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function distToSegment(p, a, b) {
    const l2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    if (l2 === 0) return dist(p, a);
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
  }

  function hitTest(p) {
    const s = markerSize();
    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i];
      if (m.type === "path") {
        for (let j = 0; j < m.points.length - 1; j++) {
          if (distToSegment(p, m.points[j], m.points[j + 1]) < s * 0.5) return i;
        }
        if (m.points.length === 1 && dist(p, m.points[0]) < s * 0.6) return i;
      } else {
        if (dist(p, { x: m.x, y: m.y }) < s * 0.75) return i;
      }
    }
    return -1;
  }

  // ---------- interaction ----------

  let pointerDownInfo = null;

  canvas.addEventListener("pointerdown", (e) => {
    if (!mapImage) return;
    const p = getPos(e);

    if (currentTool === "select") {
      const idx = hitTest(p);
      if (idx >= 0) {
        markers.splice(idx, 1);
        redraw();
      }
      return;
    }

    if (currentTool === "cover") {
      coverDraft = { x: p.x, y: p.y, angle: 0 };
      pointerDownInfo = p;
      redraw();
      return;
    }

    if (currentTool === "path") {
      if (!pathDraft) pathDraft = { points: [] };
      pathDraft.points.push(p);
      redraw();
      return;
    }

    if (["smoke", "grenade", "enemy"].includes(currentTool)) {
      markers.push({ id: nextId++, type: currentTool, x: p.x, y: p.y });
      redraw();
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!mapImage) return;
    const p = getPos(e);

    if (currentTool === "cover" && coverDraft) {
      const dx = p.x - coverDraft.x;
      const dy = p.y - coverDraft.y;
      if (Math.hypot(dx, dy) > 3) {
        coverDraft.angle = Math.atan2(dy, dx) + Math.PI / 2;
      }
      redraw();
      return;
    }

    if (currentTool === "path" && pathDraft) {
      hoverPoint = p;
      redraw();
    }
  });

  window.addEventListener("pointerup", () => {
    if (currentTool === "cover" && coverDraft) {
      markers.push({ id: nextId++, type: "cover", x: coverDraft.x, y: coverDraft.y, rotation: coverDraft.angle });
      coverDraft = null;
      pointerDownInfo = null;
      redraw();
    }
  });

  canvas.addEventListener("dblclick", () => finishPath());

  function finishPath() {
    if (pathDraft && pathDraft.points.length >= 2) {
      markers.push({ id: nextId++, type: "path", points: pathDraft.points });
    }
    pathDraft = null;
    hoverPoint = null;
    redraw();
  }

  function cancelPath() {
    pathDraft = null;
    hoverPoint = null;
    redraw();
  }

  document.getElementById("pathFinishBtn").addEventListener("click", finishPath);
  document.getElementById("pathCancelBtn").addEventListener("click", cancelPath);

  window.addEventListener("keydown", (e) => {
    if (currentTool !== "path") return;
    if (e.key === "Enter") finishPath();
    else if (e.key === "Escape") cancelPath();
  });

  // ---------- undo / clear ----------

  document.getElementById("undoBtn").addEventListener("click", () => {
    markers.pop();
    redraw();
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    if (!markers.length) return;
    if (confirm("모든 표시를 지울까요?")) {
      markers = [];
      redraw();
    }
  });

  // ---------- export ----------

  exportBtn.addEventListener("click", () => {
    if (!mapImage) return;
    const link = document.createElement("a");
    link.download = "pubg-feedback-map.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  setTool("select");
})();

(() => {
  "use strict";

  // ---------- shared drawing helpers ----------

  function roundedRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ---------- icon drawing (shared by sidebar previews and canvas markers) ----------
  // All of these draw in "world" coordinates (image pixel space). The view
  // transform (pan/zoom) is applied once via ctx.setTransform before any of
  // this runs, so these never need to know the current zoom level - they stay
  // crisp vector paths at any zoom instead of a stretched bitmap.

  function drawSmoke(ctx, x, y, s) {
    ctx.save();
    ctx.globalAlpha = ctx.globalAlpha * 0.9;
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
    ctx.fillStyle = "#6f9a1b";
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
    ctx.strokeStyle = "#a8a8a8";
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

  function drawVehicle(ctx, x, y, s, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    const w = s * 0.56, h = s * 0.9;

    ctx.fillStyle = "#ffcc00";
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = Math.max(1, s * 0.07);
    roundedRectPath(ctx, -w / 2, -h / 2, w, h, s * 0.16);
    ctx.fill();
    ctx.stroke();

    // windshield / cabin
    ctx.fillStyle = "#2b2b2b";
    roundedRectPath(ctx, -w * 0.32, -h * 0.14, w * 0.64, h * 0.3, s * 0.05);
    ctx.fill();

    // wheels
    ctx.fillStyle = "#111";
    const wheelW = s * 0.12, wheelH = s * 0.22;
    [
      [-w / 2 - wheelW * 0.35, -h * 0.32],
      [w / 2 - wheelW * 0.65, -h * 0.32],
      [-w / 2 - wheelW * 0.35, h * 0.1],
      [w / 2 - wheelW * 0.65, h * 0.1],
    ].forEach(([wx, wy]) => ctx.fillRect(wx, wy, wheelW, wheelH));

    ctx.restore();
  }

  function drawFlare(ctx, x, y, s, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.fillStyle = "#ff2e17";
    ctx.strokeStyle = "#5c0a02";
    ctx.lineWidth = Math.max(1, s * 0.09);

    const half = s * 0.46;
    ctx.beginPath();
    ctx.rect(-half, -half, half * 2, half * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function drawRock(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#8d8378";
    ctx.strokeStyle = "#3f3a33";
    ctx.lineWidth = Math.max(1, s * 0.08);

    const pts = [
      [0, -s * 0.5], [s * 0.38, -s * 0.3], [s * 0.48, s * 0.12],
      [s * 0.2, s * 0.48], [-s * 0.22, s * 0.46], [-s * 0.46, s * 0.08],
      [-s * 0.34, -s * 0.32],
    ];
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach(([px, py]) => ctx.lineTo(px, py));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(63, 58, 51, 0.5)";
    ctx.lineWidth = Math.max(1, s * 0.04);
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.2);
    ctx.lineTo(s * 0.15, s * 0.1);
    ctx.moveTo(s * 0.05, -s * 0.3);
    ctx.lineTo(-s * 0.05, s * 0.2);
    ctx.stroke();

    ctx.restore();
  }

  function drawTree(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#2f6b2f";
    ctx.strokeStyle = "#1a3d1a";
    ctx.lineWidth = Math.max(1, s * 0.07);

    ctx.beginPath();
    ctx.arc(0, 0, s * 0.52, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#3f8a3f";
    ctx.beginPath();
    ctx.arc(-s * 0.12, -s * 0.12, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.16, s * 0.1, s * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  const PATH_COLORS = {
    blue: "#1f7aff",
    red: "#ff2d2d",
    yellow: "#ffdd00",
    green: "#19c23e",
  };

  // jagged debris burst for the impact point
  function drawImpactBurst(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = "round";

    const frags = [
      [-2.6, 0.5], [-2.15, 0.72], [-1.6, 0.4], [-1.05, 0.62],
      [-0.5, 0.78], [0.0, 0.48], [0.5, 0.66], [1.0, 0.42],
      [1.5, 0.74], [2.0, 0.5], [2.5, 0.64], [3.0, 0.38],
    ];
    frags.forEach(([ang, len]) => {
      const x2 = Math.cos(ang) * s * len;
      const y2 = Math.sin(ang) * s * len;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = Math.max(2, s * 0.09);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "#ffd77a";
      ctx.lineWidth = Math.max(1, s * 0.045);
      ctx.stroke();

      // fragment chip at the tip
      ctx.beginPath();
      ctx.arc(x2, y2, s * 0.05, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = Math.max(1, s * 0.03);
      ctx.fill();
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = Math.max(2, s * 0.09);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // high-visibility straight line for "who is shooting whom": thick black
  // outline under a white line, and a debris burst at the impact point.
  // strokeScale compensates for the current map zoom so the line itself
  // always looks the same thickness on screen; the impact burst is a
  // regular resizable icon (scale) and zooms with the map like any other.
  function drawFireLine(ctx, points, s, scale, strokeScale) {
    if (!points || points.length < 2) return;
    const ss = strokeScale || 1;
    const pN = points[points.length - 1];

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = Math.max(4, s * 0.28) / ss;
    ctx.stroke();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(2, s * 0.14) / ss;
    ctx.stroke();

    drawImpactBurst(ctx, pN.x, pN.y, s * (scale || 1));

    ctx.restore();
  }

  const TEAM_COLORS = {
    1: { fill: "#ffdd00", text: "#1a1a1a" },
    2: { fill: "#ff2d2d", text: "#ffffff" },
    3: { fill: "#1f7aff", text: "#ffffff" },
    4: { fill: "#19c23e", text: "#ffffff" },
  };

  function drawTeammate(ctx, x, y, s, num) {
    const c = TEAM_COLORS[num];
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = c.fill;
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = Math.max(1, s * 0.09);
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = c.text;
    ctx.font = `bold ${Math.round(s * 0.58)}px "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(num), 0, s * 0.02);
    ctx.restore();
  }

  // smooths a raw point list (e.g. freehand mouse samples) into quadratic
  // curve segments through each pair's midpoint, so dashed lines flow
  // naturally instead of kinking at every tiny mouse-jitter vertex.
  function tracePolylineSmooth(ctx, points) {
    ctx.moveTo(points[0].x, points[0].y);
    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
      return;
    }
    for (let i = 1; i < points.length - 1; i++) {
      const cur = points[i];
      const next = points[i + 1];
      const midX = (cur.x + next.x) / 2;
      const midY = (cur.y + next.y) / 2;
      ctx.quadraticCurveTo(cur.x, cur.y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  // strokeScale compensates for the current map zoom so the line, its dash
  // pattern, the start dot, and the arrowhead always look the same size on
  // screen regardless of zoom level (defaults to 1 for export/previews).
  function drawPath(ctx, points, s, style, color, strokeScale) {
    const ss = strokeScale || 1;
    const strokeColor = PATH_COLORS[color] || PATH_COLORS.blue;
    if (!points || points.length < 2) {
      if (points && points.length === 1) {
        ctx.save();
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, (s * 0.18) / ss, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(2, s * 0.15) / ss;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (style === "solid") ctx.setLineDash([]);
    else ctx.setLineDash([(s * 0.35) / ss, (s * 0.3) / ss]);

    ctx.beginPath();
    tracePolylineSmooth(ctx, points);
    ctx.stroke();
    ctx.setLineDash([]);

    // start dot
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, (s * 0.16) / ss, 0, Math.PI * 2);
    ctx.fill();

    // arrowhead at end
    const p1 = points[points.length - 2];
    const p2 = points[points.length - 1];
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const headLen = (s * 0.5) / ss;
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

  // dashed throw trajectory from the throw origin to where the smoke/grenade
  // actually lands, so it's clear where it was thrown from and to.
  function drawThrowTrail(ctx, from, to, s, strokeScale) {
    if (dist(from, to) < 1) return;
    const ss = strokeScale || 1;
    ctx.save();
    ctx.strokeStyle = "#e8e8e8";
    ctx.lineWidth = Math.max(1.5, s * 0.08) / ss;
    ctx.lineCap = "round";
    ctx.setLineDash([(s * 0.22) / ss, (s * 0.2) / ss]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#e8e8e8";
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = Math.max(1, s * 0.04) / ss;
    ctx.beginPath();
    ctx.arc(from.x, from.y, (s * 0.12) / ss, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function freehandPreviewPoints(cx, cy, s) {
    const pts = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push({
        x: cx - s * 0.38 + t * s * 0.76,
        y: cy + Math.sin(t * Math.PI * 1.6) * s * 0.22,
      });
    }
    return pts;
  }

  const ICON_DRAW = {
    smoke: drawSmoke,
    grenade: drawGrenade,
    enemy: drawEnemy,
    vehicle: drawVehicle,
    rock: drawRock,
    tree: drawTree,
    team1: (ctx, x, y, s) => drawTeammate(ctx, x, y, s, 1),
    team2: (ctx, x, y, s) => drawTeammate(ctx, x, y, s, 2),
    team3: (ctx, x, y, s) => drawTeammate(ctx, x, y, s, 3),
    team4: (ctx, x, y, s) => drawTeammate(ctx, x, y, s, 4),
  };

  // ---------- sidebar icon previews ----------

  document.querySelectorAll("canvas[data-icon]").forEach((c) => {
    const ctx = c.getContext("2d");
    const cx = c.width / 2, cy = c.height / 2, s = c.width * 0.8;
    const type = c.dataset.icon;
    if (ICON_DRAW[type]) ICON_DRAW[type](ctx, cx, cy, s);
    else if (type === "flare") drawFlare(ctx, cx, cy, s, 0);
    else if (type === "path-straight") {
      drawPath(ctx, [{ x: cx - s * 0.35, y: cy + s * 0.3 }, { x: cx + s * 0.35, y: cy - s * 0.3 }], s, "dashed", "blue");
    } else if (type === "path-free") {
      drawPath(ctx, freehandPreviewPoints(cx, cy, s), s, "dashed", "blue");
    } else if (type === "fireline") {
      drawFireLine(ctx, [{ x: cx - s * 0.35, y: cy + s * 0.3 }, { x: cx + s * 0.35, y: cy - s * 0.3 }], s);
    } else if (type === "select") {
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

  // ---------- key guide modal ----------

  const guideBtn = document.getElementById("guideBtn");
  const guideModal = document.getElementById("guideModal");
  const guideCloseBtn = document.getElementById("guideCloseBtn");

  function openGuide() {
    guideModal.hidden = false;
  }
  function closeGuide() {
    guideModal.hidden = true;
  }

  guideBtn.addEventListener("click", openGuide);
  guideCloseBtn.addEventListener("click", closeGuide);
  guideModal.addEventListener("click", (e) => {
    if (e.target === guideModal) closeGuide();
  });

  // ---------- app state ----------

  const canvas = document.getElementById("mapCanvas");
  const ctx = canvas.getContext("2d");
  const canvasWrap = document.getElementById("canvasWrap");
  const emptyState = document.getElementById("emptyState");
  const exportBtn = document.getElementById("exportBtn");
  const upscaleBtn = document.getElementById("upscaleBtn");
  const hint = document.getElementById("hint");
  const pathStyleSelect = document.getElementById("pathStyleSelect");
  const pathColorSelect = document.getElementById("pathColorSelect");
  const mapInput = document.getElementById("mapInput");
  const opacitySlider = document.getElementById("opacitySlider");
  const opacityValue = document.getElementById("opacityValue");
  const resizeToggle = document.getElementById("resizeToggle");

  let mapImage = null;
  let originalImage = null; // untouched upload, kept at full natural resolution for upscaling
  let worldWidth = 0;
  let worldHeight = 0;
  let markers = []; // {id, type, x, y, rotation?, points?, style?, color?, from?, scale?}
  let currentTool = "select";
  let nextId = 1;
  let markerOpacity = 1;
  let resizeModeEnabled = false;

  opacitySlider.addEventListener("input", () => {
    markerOpacity = Number(opacitySlider.value) / 100;
    opacityValue.textContent = `${opacitySlider.value}%`;
    redraw();
  });

  resizeToggle.addEventListener("change", () => {
    resizeModeEnabled = resizeToggle.checked;
  });

  let rotateDraft = null; // {tool: 'flare'|'vehicle', x, y, angle}
  let throwDraft = null;  // {tool: 'smoke'|'grenade', from: {x,y}, to: {x,y}}
  let lineDraft = null;   // {tool: 'path-straight'|'path-free'|'fireline', points: [{x,y}], style, color}

  // pan / zoom view transform, in CSS-pixel space: screenPx = view{X,Y} + viewScale * worldPx
  let viewScale = 1;
  let viewX = 0;
  let viewY = 0;
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 12;

  const POINT_TOOLS = ["enemy", "rock", "tree", "team1", "team2", "team3", "team4"];
  const ROTATE_TOOLS = ["flare", "vehicle"];
  const THROW_TOOLS = ["smoke", "grenade"];

  const HINTS = {
    select: "마커를 클릭하면 삭제됩니다.",
    smoke: "클릭한 채로 드래그해서 연막탄을 투척하세요 (뗀 지점에 생성됩니다).",
    grenade: "클릭한 채로 드래그해서 수류탄을 투척하세요 (뗀 지점에 생성됩니다).",
    enemy: "지도를 클릭해 적 위치를 표시하세요.",
    vehicle: "클릭 후 드래그해 차량 방향을 지정하세요.",
    rock: "지도를 클릭해 바위 위치를 표시하세요.",
    tree: "지도를 클릭해 나무 위치를 표시하세요.",
    flare: "클릭 후 드래그해 신호 방향을 지정하세요.",
    team1: "지도를 클릭해 팀원 1(노랑) 위치를 표시하세요.",
    team2: "지도를 클릭해 팀원 2(빨강) 위치를 표시하세요.",
    team3: "지도를 클릭해 팀원 3(파랑) 위치를 표시하세요.",
    team4: "지도를 클릭해 팀원 4(초록) 위치를 표시하세요.",
    "path-straight": "클릭한 채로 드래그해서 직선 이동 동선을 그리세요.",
    "path-free": "클릭한 채로 드래그해서 자유 곡선 이동 동선을 그리세요.",
    fireline: "클릭한 채로 드래그해서 사격선을 그리세요.",
  };

  function markerSize() {
    return Math.max(16, Math.min(worldWidth, worldHeight) * 0.028);
  }

  function setTool(tool) {
    currentTool = tool;
    rotateDraft = null;
    throwDraft = null;
    lineDraft = null;
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

  // ---------- canvas buffer sizing (always matches on-screen size * DPR, so
  // drawing is never a stretched bitmap - this is what keeps zoom crisp) ----------

  function resizeCanvasBuffer() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvasWrap.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function fitToView() {
    const rect = canvasWrap.getBoundingClientRect();
    const scale = Math.min(rect.width / worldWidth, rect.height / worldHeight, 1) || 1;
    viewScale = scale;
    viewX = (rect.width - worldWidth * scale) / 2;
    viewY = (rect.height - worldHeight * scale) / 2;
  }

  const resizeObserver = new ResizeObserver(() => {
    resizeCanvasBuffer();
    redraw();
  });
  resizeObserver.observe(canvasWrap);

  // ---------- view transform (zoom / pan) ----------

  canvas.addEventListener(
    "wheel",
    (e) => {
      if (!mapImage) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (resizeModeEnabled && e.shiftKey) {
        const worldP = { x: (mx - viewX) / viewScale, y: (my - viewY) / viewScale };
        const hovered = pointMarkerAt(worldP);
        if (hovered) {
          e.preventDefault();
          const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
          hovered.scale = Math.min(4, Math.max(0.3, (hovered.scale || 1) * factor));
          redraw();
          return;
        }
      }

      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, viewScale * factor));

      const worldX = (mx - viewX) / viewScale;
      const worldY = (my - viewY) / viewScale;
      viewX = mx - worldX * newScale;
      viewY = my - worldY * newScale;
      viewScale = newScale;
      redraw();
    },
    { passive: false }
  );

  canvasWrap.addEventListener("contextmenu", (e) => e.preventDefault());

  let panState = null;

  canvasWrap.addEventListener("pointerdown", (e) => {
    if (e.button === 2 && mapImage) {
      panState = { startX: e.clientX, startY: e.clientY, viewX, viewY };
      canvasWrap.setPointerCapture(e.pointerId);
    }
  });

  canvasWrap.addEventListener("pointermove", (e) => {
    if (panState) {
      viewX = panState.viewX + (e.clientX - panState.startX);
      viewY = panState.viewY + (e.clientY - panState.startY);
      redraw();
    }
  });

  window.addEventListener("pointerup", () => {
    panState = null;
  });

  // ---------- image loading (file picker + clipboard paste) ----------

  function loadMapImageFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    if (markers.length && !confirm("새 지도를 불러오면 현재 표시가 모두 사라집니다. 계속할까요?")) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        mapImage = img;
        originalImage = img;
        markers = [];
        const maxW = 4000;
        const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
        worldWidth = Math.round(img.naturalWidth * scale);
        worldHeight = Math.round(img.naturalHeight * scale);
        emptyState.style.display = "none";
        exportBtn.disabled = false;
        upscaleBtn.disabled = false;
        resizeCanvasBuffer();
        fitToView();
        setTool("select");
        redraw();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  mapInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) loadMapImageFile(file);
    mapInput.value = "";
  });

  window.addEventListener("paste", (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          loadMapImageFile(file);
        }
        break;
      }
    }
  });

  // ---------- rendering ----------
  // drawSceneContent draws everything in plain world coordinates with no
  // knowledge of zoom/pan - the caller sets up the transform (or uses the
  // identity transform, as the PNG export does).

  function drawSceneContent(targetCtx, includeDrafts, strokeScale) {
    const ss = strokeScale || 1;
    targetCtx.globalAlpha = 1;
    targetCtx.drawImage(mapImage, 0, 0, worldWidth, worldHeight);
    const s = markerSize();

    targetCtx.save();
    targetCtx.globalAlpha = markerOpacity;
    markers.forEach((m) => {
      const ms = s * (m.scale || 1);
      if (m.type === "flare") drawFlare(targetCtx, m.x, m.y, ms, m.rotation);
      else if (m.type === "vehicle") drawVehicle(targetCtx, m.x, m.y, ms, m.rotation);
      else if (m.type === "path") drawPath(targetCtx, m.points, s, m.style, m.color, ss);
      else if (m.type === "fireline") drawFireLine(targetCtx, m.points, s, m.scale, ss);
      else if (m.type === "smoke" || m.type === "grenade") {
        if (m.from) drawThrowTrail(targetCtx, m.from, { x: m.x, y: m.y }, s, ss);
        ICON_DRAW[m.type](targetCtx, m.x, m.y, ms);
      } else if (ICON_DRAW[m.type]) ICON_DRAW[m.type](targetCtx, m.x, m.y, ms);
    });
    if (includeDrafts) {
      if (rotateDraft) {
        if (rotateDraft.tool === "flare") drawFlare(targetCtx, rotateDraft.x, rotateDraft.y, s, rotateDraft.angle);
        else if (rotateDraft.tool === "vehicle") drawVehicle(targetCtx, rotateDraft.x, rotateDraft.y, s, rotateDraft.angle);
      }
      if (throwDraft) {
        drawThrowTrail(targetCtx, throwDraft.from, throwDraft.to, s, ss);
        ICON_DRAW[throwDraft.tool](targetCtx, throwDraft.to.x, throwDraft.to.y, s);
      }
      if (lineDraft) {
        if (lineDraft.tool === "fireline") drawFireLine(targetCtx, lineDraft.points, s, null, ss);
        else drawPath(targetCtx, lineDraft.points, s, lineDraft.style, lineDraft.color, ss);
      }
    }
    targetCtx.restore();
  }

  function redraw() {
    if (!mapImage) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(viewScale * dpr, 0, 0, viewScale * dpr, viewX * dpr, viewY * dpr);
    drawSceneContent(ctx, true, viewScale);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // ---------- coordinate helpers ----------

  function getPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const cssX = evt.clientX - rect.left;
    const cssY = evt.clientY - rect.top;
    return {
      x: (cssX - viewX) / viewScale,
      y: (cssY - viewY) / viewScale,
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

  function pointRadius(m, s) {
    return s * (m.scale || 1) * 0.75;
  }

  function hitTest(p) {
    const s = markerSize();
    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i];
      if (m.type === "path" || m.type === "fireline") {
        for (let j = 0; j < m.points.length - 1; j++) {
          if (distToSegment(p, m.points[j], m.points[j + 1]) < s * 0.5) return i;
        }
        if (m.points.length === 1 && dist(p, m.points[0]) < s * 0.6) return i;
      } else {
        if (dist(p, { x: m.x, y: m.y }) < pointRadius(m, s)) return i;
      }
    }
    return -1;
  }

  // used by scroll-to-resize: only point-shaped markers, never lines
  function pointMarkerAt(p) {
    const s = markerSize();
    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i];
      if (m.type === "path") continue;
      if (m.type === "fireline") {
        // only the impact-point icon is resizable, not the line itself
        const end = m.points[m.points.length - 1];
        if (dist(p, end) < pointRadius(m, s)) return m;
        continue;
      }
      if (dist(p, { x: m.x, y: m.y }) < pointRadius(m, s)) return m;
    }
    return null;
  }

  // ---------- drawing-tool interaction ----------

  const LINE_TOOLS = ["path-straight", "path-free", "fireline"];
  const STRAIGHT_LINE_TOOLS = ["path-straight", "fireline"];
  const MIN_FREE_SEGMENT = 3; // world px, keeps freehand point count sane

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return; // right/middle click reserved for panning
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

    if (ROTATE_TOOLS.includes(currentTool)) {
      rotateDraft = { tool: currentTool, x: p.x, y: p.y, angle: 0 };
      canvas.setPointerCapture(e.pointerId);
      redraw();
      return;
    }

    if (THROW_TOOLS.includes(currentTool)) {
      throwDraft = { tool: currentTool, from: p, to: p };
      canvas.setPointerCapture(e.pointerId);
      redraw();
      return;
    }

    if (LINE_TOOLS.includes(currentTool)) {
      lineDraft =
        currentTool === "fireline"
          ? { tool: currentTool, points: [p] }
          : { tool: currentTool, points: [p], style: pathStyleSelect.value, color: pathColorSelect.value };
      canvas.setPointerCapture(e.pointerId);
      redraw();
      return;
    }

    if (POINT_TOOLS.includes(currentTool)) {
      markers.push({ id: nextId++, type: currentTool, x: p.x, y: p.y });
      redraw();
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!mapImage) return;
    const p = getPos(e);

    if (rotateDraft) {
      const dx = p.x - rotateDraft.x;
      const dy = p.y - rotateDraft.y;
      if (Math.hypot(dx, dy) > 3) {
        rotateDraft.angle = Math.atan2(dy, dx) + Math.PI / 2;
      }
      redraw();
      return;
    }

    if (throwDraft) {
      throwDraft.to = p;
      redraw();
      return;
    }

    if (lineDraft) {
      if (STRAIGHT_LINE_TOOLS.includes(lineDraft.tool)) {
        lineDraft.points = [lineDraft.points[0], p];
      } else {
        const last = lineDraft.points[lineDraft.points.length - 1];
        if (dist(last, p) >= MIN_FREE_SEGMENT) lineDraft.points.push(p);
      }
      redraw();
    }
  });

  function finishLineDraft() {
    if (lineDraft && lineDraft.points.length >= 2) {
      if (lineDraft.tool === "fireline") {
        markers.push({ id: nextId++, type: "fireline", points: lineDraft.points });
      } else {
        markers.push({
          id: nextId++,
          type: "path",
          points: lineDraft.points,
          style: lineDraft.style,
          color: lineDraft.color,
        });
      }
    }
    lineDraft = null;
    redraw();
  }

  window.addEventListener("pointerup", () => {
    if (rotateDraft) {
      markers.push({ id: nextId++, type: rotateDraft.tool, x: rotateDraft.x, y: rotateDraft.y, rotation: rotateDraft.angle });
      rotateDraft = null;
      redraw();
    }
    if (throwDraft) {
      markers.push({ id: nextId++, type: throwDraft.tool, from: throwDraft.from, x: throwDraft.to.x, y: throwDraft.to.y });
      throwDraft = null;
      redraw();
    }
    if (lineDraft) {
      finishLineDraft();
    }
  });

  // ---------- undo / clear ----------

  function undo() {
    markers.pop();
    redraw();
  }

  document.getElementById("undoBtn").addEventListener("click", undo);

  document.getElementById("clearBtn").addEventListener("click", () => {
    if (!markers.length) return;
    if (confirm("모든 표시를 지울까요?")) {
      markers = [];
      redraw();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !guideModal.hidden) {
      closeGuide();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo();
      return;
    }
    if (e.key === "Escape" && (rotateDraft || throwDraft || lineDraft)) {
      rotateDraft = null;
      throwDraft = null;
      lineDraft = null;
      redraw();
    }
  });

  // ---------- canvas-based upscale (manual, off by default - only runs on click) ----------
  // Not real super-resolution: progressively redraws the original upload at a
  // larger size with high-quality smoothing, which can look a bit less harsh
  // than one big jump, but it cannot recover detail that was never captured.

  const UPSCALE_MAX_DIM = 8000;

  function renderUpscaledCanvas(source, targetW, targetH) {
    let w = source.naturalWidth || source.width;
    let h = source.naturalHeight || source.height;
    let current = source;
    while (w < targetW || h < targetH) {
      const stepW = Math.min(targetW, Math.round(w * 2));
      const stepH = Math.min(targetH, Math.round(h * 2));
      const stepCanvas = document.createElement("canvas");
      stepCanvas.width = stepW;
      stepCanvas.height = stepH;
      const sctx = stepCanvas.getContext("2d");
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = "high";
      sctx.drawImage(current, 0, 0, stepW, stepH);
      current = stepCanvas;
      w = stepW;
      h = stepH;
    }
    return current;
  }

  function rescaleMarkers(sx, sy) {
    markers.forEach((m) => {
      if (m.points) m.points = m.points.map((p) => ({ x: p.x * sx, y: p.y * sy }));
      if (typeof m.x === "number") m.x *= sx;
      if (typeof m.y === "number") m.y *= sy;
      if (m.from) m.from = { x: m.from.x * sx, y: m.from.y * sy };
    });
  }

  upscaleBtn.addEventListener("click", () => {
    if (!mapImage || !originalImage) return;
    if (Math.max(worldWidth, worldHeight) >= UPSCALE_MAX_DIM) {
      alert("이미 최대 해상도까지 확대되어 더 이상 업스케일할 수 없습니다.");
      return;
    }
    let targetW = worldWidth * 2;
    let targetH = worldHeight * 2;
    if (Math.max(targetW, targetH) > UPSCALE_MAX_DIM) {
      const clamp = UPSCALE_MAX_DIM / Math.max(targetW, targetH);
      targetW *= clamp;
      targetH *= clamp;
    }
    targetW = Math.round(targetW);
    targetH = Math.round(targetH);

    const sx = targetW / worldWidth;
    const sy = targetH / worldHeight;
    mapImage = renderUpscaledCanvas(originalImage, targetW, targetH);
    rescaleMarkers(sx, sy);
    worldWidth = targetW;
    worldHeight = targetH;
    fitToView();
    redraw();
  });

  // ---------- export (always full-resolution, independent of current zoom/pan) ----------

  exportBtn.addEventListener("click", () => {
    if (!mapImage) return;
    const out = document.createElement("canvas");
    out.width = worldWidth;
    out.height = worldHeight;
    drawSceneContent(out.getContext("2d"), false);
    const link = document.createElement("a");
    link.download = "pubg-feedback-map.png";
    link.href = out.toDataURL("image/png");
    link.click();
  });

  resizeCanvasBuffer();
  setTool("select");
})();

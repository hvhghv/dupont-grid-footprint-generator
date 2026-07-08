const CELL_SIZE = 52;
const EE_ORIGIN = { x: 400, y: 300 };

const DEFAULT_LAYERS = [
  "1~TopLayer~#FF0000~true~true~true",
  "2~BottomLayer~#0000FF~true~false~true",
  "3~TopSilkLayer~#FFFF00~true~false~true",
  "4~BottomSilkLayer~#808000~true~false~true",
  "5~TopPasterLayer~#808080~false~false~false",
  "6~BottomPasterLayer~#800000~false~false~false",
  "7~TopSolderLayer~#800080~false~false~false",
  "8~BottomSolderLayer~#AA00FF~false~false~false",
  "9~Ratlines~#6464FF~true~false~true",
  "10~BoardOutline~#FF00FF~true~false~true",
  "11~Multi-Layer~#C0C0C0~true~false~true",
  "12~Document~#FFFFFF~true~false~true"
];

let state = createState(3, 8);

const dom = {
  partName: document.querySelector("#partName"),
  rows: document.querySelector("#rowsInput"),
  cols: document.querySelector("#colsInput"),
  pitch: document.querySelector("#pitchInput"),
  pad: document.querySelector("#padInput"),
  drill: document.querySelector("#drillInput"),
  silkWidth: document.querySelector("#silkWidthInput"),
  outline: document.querySelector("#outlineInput"),
  pinNameSilk: document.querySelector("#pinNameSilkInput"),
  buildGrid: document.querySelector("#buildGridButton"),
  enableAll: document.querySelector("#enableAllButton"),
  disableAll: document.querySelector("#disableAllButton"),
  autoNumber: document.querySelector("#autoNumberButton"),
  clearNames: document.querySelector("#clearNamesButton"),
  saveProject: document.querySelector("#saveProjectButton"),
  projectFile: document.querySelector("#projectFileInput"),
  cellGrid: document.querySelector("#cellGrid"),
  gridSurface: document.querySelector("#gridSurface"),
  silkSvg: document.querySelector("#silkSvg"),
  silkText: document.querySelector("#silkTextInput"),
  undoSilk: document.querySelector("#undoSilkButton"),
  modeButtons: Array.from(document.querySelectorAll(".mode-button")),
  emptySelection: document.querySelector("#emptySelection"),
  cellInspector: document.querySelector("#cellInspector"),
  selectedCellTitle: document.querySelector("#selectedCellTitle"),
  pinNumber: document.querySelector("#pinNumberInput"),
  pinName: document.querySelector("#pinNameInput"),
  cellEnabled: document.querySelector("#cellEnabledInput"),
  totalCells: document.querySelector("#totalCellsStat"),
  activeCells: document.querySelector("#activeCellsStat"),
  silkStat: document.querySelector("#silkStat"),
  validationBox: document.querySelector("#validationBox"),
  projectStatus: document.querySelector("#projectStatus"),
  downloadLcedaFootprint: document.querySelector("#downloadLcedaFootprint"),
  downloadLcedaSymbol: document.querySelector("#downloadLcedaSymbol"),
  downloadKicadMod: document.querySelector("#downloadKicadMod"),
  downloadKicadSym: document.querySelector("#downloadKicadSym")
};

function createState(rows, cols) {
  return {
    rows,
    cols,
    pitchMm: 2.54,
    padMm: 1.8,
    drillMm: 1.0,
    silkWidthMm: 0.15,
    partName: "DUPONT_GRID",
    includeOutline: true,
    includePinNameSilk: false,
    mode: "select",
    drawStart: null,
    selectedKey: null,
    cells: Array.from({ length: rows * cols }, (_, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      return {
        row,
        col,
        enabled: false,
        pinNumber: "",
        pinName: ""
      };
    }),
    silkscreen: []
  };
}

function keyFor(row, col) {
  return `${row}:${col}`;
}

function findCell(row, col) {
  return state.cells.find((cell) => cell.row === row && cell.col === col);
}

function selectedCell() {
  if (!state.selectedKey) return null;
  const [row, col] = state.selectedKey.split(":").map(Number);
  return findCell(row, col);
}

function syncInputsFromState() {
  dom.partName.value = state.partName;
  dom.rows.value = state.rows;
  dom.cols.value = state.cols;
  dom.pitch.value = state.pitchMm;
  dom.pad.value = state.padMm;
  dom.drill.value = state.drillMm;
  dom.silkWidth.value = state.silkWidthMm;
  dom.outline.checked = state.includeOutline;
  dom.pinNameSilk.checked = state.includePinNameSilk;
}

function readSettings() {
  state.partName = normalizeName(dom.partName.value || "DUPONT_GRID");
  state.pitchMm = positiveNumber(dom.pitch.value, 2.54);
  state.padMm = positiveNumber(dom.pad.value, 1.8);
  state.drillMm = positiveNumber(dom.drill.value, 1.0);
  state.silkWidthMm = positiveNumber(dom.silkWidth.value, 0.15);
  state.includeOutline = dom.outline.checked;
  state.includePinNameSilk = dom.pinNameSilk.checked;
}

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeName(value) {
  return String(value)
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64) || "DUPONT_GRID";
}

function rebuildGrid() {
  readSettings();
  const rows = clampInt(dom.rows.value, 1, 40);
  const cols = clampInt(dom.cols.value, 1, 40);
  const oldCells = new Map(state.cells.map((cell) => [keyFor(cell.row, cell.col), cell]));
  state.rows = rows;
  state.cols = cols;
  state.selectedKey = null;
  state.cells = Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const old = oldCells.get(keyFor(row, col));
    return old ? { ...old } : { row, col, enabled: false, pinNumber: "", pinName: "" };
  });
  render();
}

function clampInt(value, min, max) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function render() {
  readSettings();
  renderGrid();
  renderSilkscreen();
  renderInspector();
  renderStats();
  renderMode();
}

function renderGrid() {
  dom.cellGrid.style.gridTemplateColumns = `repeat(${state.cols}, var(--cell))`;
  dom.cellGrid.innerHTML = "";
  for (const cell of state.cells) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cell";
    button.dataset.row = cell.row;
    button.dataset.col = cell.col;
    button.setAttribute("aria-label", `第 ${cell.row + 1} 行第 ${cell.col + 1} 列`);
    if (cell.enabled) button.classList.add("enabled");
    if (state.selectedKey === keyFor(cell.row, cell.col)) button.classList.add("selected");
    button.innerHTML = `<span class="cell-number">${escapeHtml(cell.pinNumber)}</span><span class="cell-name">${escapeHtml(cell.pinName)}</span>`;
    dom.cellGrid.appendChild(button);
  }
}

function renderSilkscreen() {
  const width = state.cols * CELL_SIZE;
  const height = state.rows * CELL_SIZE;
  dom.silkSvg.setAttribute("width", width);
  dom.silkSvg.setAttribute("height", height);
  dom.silkSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  dom.silkSvg.classList.toggle("active", state.mode !== "select");
  dom.silkSvg.innerHTML = "";

  for (const item of state.silkscreen) {
    if (item.type === "line") {
      const line = svgEl("line", {
        class: "silk-line",
        x1: mmToUiX(item.x1Mm),
        y1: mmToUiY(item.y1Mm),
        x2: mmToUiX(item.x2Mm),
        y2: mmToUiY(item.y2Mm)
      });
      dom.silkSvg.appendChild(line);
    }
    if (item.type === "rect") {
      const x1 = mmToUiX(Math.min(item.x1Mm, item.x2Mm));
      const y1 = mmToUiY(Math.min(item.y1Mm, item.y2Mm));
      const x2 = mmToUiX(Math.max(item.x1Mm, item.x2Mm));
      const y2 = mmToUiY(Math.max(item.y1Mm, item.y2Mm));
      const rect = svgEl("rect", {
        class: "silk-rect",
        x: x1,
        y: y1,
        width: Math.max(1, x2 - x1),
        height: Math.max(1, y2 - y1)
      });
      dom.silkSvg.appendChild(rect);
    }
    if (item.type === "text") {
      const text = svgEl("text", {
        class: "silk-text",
        x: mmToUiX(item.xMm),
        y: mmToUiY(item.yMm)
      });
      text.textContent = item.value;
      dom.silkSvg.appendChild(text);
    }
  }

  if (state.drawStart && (state.mode === "line" || state.mode === "rect")) {
    const marker = svgEl("circle", {
      class: "silk-line preview",
      cx: mmToUiX(state.drawStart.xMm),
      cy: mmToUiY(state.drawStart.yMm),
      r: 4
    });
    dom.silkSvg.appendChild(marker);
  }
}

function renderInspector() {
  const cell = selectedCell();
  dom.emptySelection.classList.toggle("hidden", Boolean(cell));
  dom.cellInspector.classList.toggle("hidden", !cell);
  if (!cell) return;
  dom.selectedCellTitle.textContent = `第 ${cell.row + 1} 行，第 ${cell.col + 1} 列`;
  dom.pinNumber.value = cell.pinNumber;
  dom.pinName.value = cell.pinName;
  dom.cellEnabled.checked = cell.enabled;
}

function renderStats() {
  const active = getActiveCells();
  dom.totalCells.textContent = String(state.rows * state.cols);
  dom.activeCells.textContent = String(active.length);
  dom.silkStat.textContent = String(state.silkscreen.length + (state.includeOutline ? 1 : 0));
  const validation = validateModel();
  dom.validationBox.textContent = validation.message;
  dom.validationBox.className = `validation-box ${validation.level}`;
  dom.projectStatus.textContent = active.length ? `${active.length} 个焊孔` : "未生成";
}

function renderMode() {
  dom.modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svgEl(name, attrs) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function uiToMmX(x) {
  return (x / CELL_SIZE - 0.5) * state.pitchMm;
}

function uiToMmY(y) {
  return (y / CELL_SIZE - 0.5) * state.pitchMm;
}

function mmToUiX(mm) {
  return (mm / state.pitchMm + 0.5) * CELL_SIZE;
}

function mmToUiY(mm) {
  return (mm / state.pitchMm + 0.5) * CELL_SIZE;
}

function toggleCell(row, col) {
  const cell = findCell(row, col);
  if (!cell) return;
  cell.enabled = !cell.enabled;
  if (cell.enabled && !cell.pinNumber) {
    cell.pinNumber = nextPinNumber();
  }
  state.selectedKey = keyFor(row, col);
  render();
}

function nextPinNumber() {
  const used = new Set(getActiveCells().map((cell) => cell.pinNumber).filter(Boolean));
  let index = 1;
  while (used.has(String(index))) index += 1;
  return String(index);
}

function getActiveCells() {
  return state.cells.filter((cell) => cell.enabled).sort((a, b) => a.row - b.row || a.col - b.col);
}

function validateModel() {
  const active = getActiveCells();
  if (!active.length) return { level: "warn", message: "至少启用一个格子后再导出。" };
  if (state.drillMm >= state.padMm) return { level: "danger", message: "钻孔直径必须小于焊盘直径。" };
  const emptyNumbers = active.filter((cell) => !String(cell.pinNumber).trim());
  if (emptyNumbers.length) return { level: "warn", message: "存在未编号引脚，导出时会按行列顺序自动补号。" };
  const seen = new Set();
  const duplicates = new Set();
  for (const cell of active) {
    const number = String(cell.pinNumber).trim();
    if (!number) continue;
    if (seen.has(number)) duplicates.add(number);
    seen.add(number);
  }
  if (duplicates.size) return { level: "danger", message: `引脚编号重复：${Array.from(duplicates).join(", ")}` };
  return { level: "ok", message: "可以导出立创 EDA 标准版器件与封装。" };
}

function buildModel() {
  readSettings();
  const active = getActiveCells();
  const used = new Set();
  let autoIndex = 1;
  const pads = active.map((cell) => {
    let number = String(cell.pinNumber).trim();
    if (!number) {
      while (used.has(String(autoIndex))) autoIndex += 1;
      number = String(autoIndex);
    }
    used.add(number);
    return {
      row: cell.row,
      col: cell.col,
      number,
      name: sanitizeField(cell.pinName || `PIN_${number}`)
    };
  });

  return {
    name: state.partName,
    rows: state.rows,
    cols: state.cols,
    pitchMm: state.pitchMm,
    padMm: state.padMm,
    drillMm: state.drillMm,
    silkWidthMm: state.silkWidthMm,
    includeOutline: state.includeOutline,
    includePinNameSilk: state.includePinNameSilk,
    pads,
    silkscreen: state.silkscreen.map((item) => ({ ...item }))
  };
}

function sanitizeField(value) {
  return String(value)
    .replace(/[~`#@$^]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assertExportable() {
  const result = validateModel();
  renderStats();
  if (result.level === "danger") {
    alert(result.message);
    return false;
  }
  if (!getActiveCells().length) {
    alert("至少启用一个格子后再导出。");
    return false;
  }
  return true;
}

function setAllCells(enabled) {
  state.cells.forEach((cell) => {
    cell.enabled = enabled;
    if (enabled && !cell.pinNumber) cell.pinNumber = nextPinNumber();
  });
  if (!enabled) {
    state.cells.forEach((cell) => {
      cell.pinNumber = "";
      cell.pinName = "";
    });
  }
  autoNumberPins();
  render();
}

function autoNumberPins() {
  getActiveCells().forEach((cell, index) => {
    cell.pinNumber = String(index + 1);
  });
  render();
}

function clearNames() {
  state.cells.forEach((cell) => {
    cell.pinName = "";
  });
  render();
}

function addSilkscreenPoint(point) {
  if (state.mode === "text") {
    const value = sanitizeField(dom.silkText.value || "TEXT");
    state.silkscreen.push({
      type: "text",
      value,
      xMm: point.xMm,
      yMm: point.yMm
    });
    render();
    return;
  }

  if (!state.drawStart) {
    state.drawStart = point;
    renderSilkscreen();
    return;
  }

  if (state.mode === "line") {
    state.silkscreen.push({
      type: "line",
      x1Mm: state.drawStart.xMm,
      y1Mm: state.drawStart.yMm,
      x2Mm: point.xMm,
      y2Mm: point.yMm
    });
  }

  if (state.mode === "rect") {
    state.silkscreen.push({
      type: "rect",
      x1Mm: state.drawStart.xMm,
      y1Mm: state.drawStart.yMm,
      x2Mm: point.xMm,
      y2Mm: point.yMm
    });
  }

  state.drawStart = null;
  render();
}

function svgPointerToPoint(event) {
  const rect = dom.silkSvg.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
  const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
  return {
    xMm: snapMm(uiToMmX(x)),
    yMm: snapMm(uiToMmY(y))
  };
}

function snapMm(value) {
  const step = state.pitchMm / 10;
  return Math.round(value / step) * step;
}

function mmToEe(mm) {
  return round(mm / 0.254, 4);
}

function round(value, places = 3) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function footprintPoint(model, xMm, yMm) {
  const centerX = ((model.cols - 1) * model.pitchMm) / 2;
  const centerY = ((model.rows - 1) * model.pitchMm) / 2;
  return {
    x: round(EE_ORIGIN.x + mmToEe(xMm - centerX), 4),
    y: round(EE_ORIGIN.y + mmToEe(yMm - centerY), 4)
  };
}

function generateEasyEdaFootprint(model) {
  let id = 1;
  const nextId = () => `gge${id++}`;
  const shapes = [];
  const padSize = mmToEe(model.padMm);
  const holeRadius = mmToEe(model.drillMm / 2);
  const silkWidth = Math.max(0.1, mmToEe(model.silkWidthMm));

  for (const pad of model.pads) {
    const point = footprintPoint(model, pad.col * model.pitchMm, pad.row * model.pitchMm);
    shapes.push(`PAD~ELLIPSE~${point.x}~${point.y}~${padSize}~${padSize}~11~~${sanitizeField(pad.number)}~${holeRadius}~~0~${nextId()}`);
  }

  if (model.includeOutline) {
    const margin = model.pitchMm / 2;
    addEasyEdaRectTrack(shapes, model, -margin, -margin, (model.cols - 1) * model.pitchMm + margin, (model.rows - 1) * model.pitchMm + margin, silkWidth, nextId());
  }

  if (model.includePinNameSilk) {
    for (const pad of model.pads) {
      const base = footprintPoint(model, pad.col * model.pitchMm + 0.35, pad.row * model.pitchMm - 0.95);
      shapes.push(`TEXT~L~${base.x}~${base.y}~0.6~0~none~3~~4~${sanitizeField(pad.name)}~~~${nextId()}`);
    }
  }

  for (const item of model.silkscreen) {
    if (item.type === "line") {
      const p1 = footprintPoint(model, item.x1Mm, item.y1Mm);
      const p2 = footprintPoint(model, item.x2Mm, item.y2Mm);
      shapes.push(`TRACK~${silkWidth}~3~~${p1.x} ${p1.y} ${p2.x} ${p2.y}~${nextId()}`);
    }
    if (item.type === "rect") {
      addEasyEdaRectTrack(shapes, model, item.x1Mm, item.y1Mm, item.x2Mm, item.y2Mm, silkWidth, nextId());
    }
    if (item.type === "text") {
      const point = footprintPoint(model, item.xMm, item.yMm);
      shapes.push(`TEXT~L~${point.x}~${point.y}~0.8~0~none~3~~6~${sanitizeField(item.value)}~~~${nextId()}`);
    }
  }

  return {
    title: model.name,
    head: `4~1.7.5~${EE_ORIGIN.x}~${EE_ORIGIN.y}~package\`${model.name}\`name\`${model.name}\`pre\`J?\`Contributor\`LocalWeb`,
    canvas: "CA~2400~2400~#000000~yes~#FFFFFF~10~1200~1200~line~1~mil~1~45~visible~0.5~400~300",
    layers: DEFAULT_LAYERS,
    shape: shapes,
    objects: [],
    DRCRULE: {
      trackWidth: 0.7,
      track2Track: 0.7,
      pad2Pad: 0.8,
      track2Pad: 0.8,
      hole2Hole: 1,
      holeSize: round(mmToEe(model.drillMm), 3)
    },
    preference: {
      hideFootprints: "",
      hideNets: ""
    }
  };
}

function addEasyEdaRectTrack(shapes, model, x1Mm, y1Mm, x2Mm, y2Mm, width, id) {
  const left = Math.min(x1Mm, x2Mm);
  const right = Math.max(x1Mm, x2Mm);
  const top = Math.min(y1Mm, y2Mm);
  const bottom = Math.max(y1Mm, y2Mm);
  const p1 = footprintPoint(model, left, top);
  const p2 = footprintPoint(model, right, top);
  const p3 = footprintPoint(model, right, bottom);
  const p4 = footprintPoint(model, left, bottom);
  shapes.push(`TRACK~${width}~3~~${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y} ${p4.x} ${p4.y} ${p1.x} ${p1.y}~${id}`);
}

function generateEasyEdaSymbol(model) {
  let id = 1;
  const nextId = () => `gge${id++}`;
  const pins = model.pads;
  const leftCount = Math.ceil(pins.length / 2);
  const rightPins = pins.slice(leftCount);
  const leftPins = pins.slice(0, leftCount);
  const rowGap = 30;
  const body = {
    x: 400,
    y: 250,
    width: 170,
    height: Math.max(leftPins.length, rightPins.length, 1) * rowGap + 20
  };
  const shapes = [
    `R~${body.x}~${body.y}~~~${body.width}~${body.height}~#000000~1~0~none~${nextId()}`,
    `T~N~${body.x + body.width / 2}~${body.y - 14}~0~#000000~~9pt~normal~normal~~comment~${model.name}~1~middle~${nextId()}`,
    `T~P~${body.x + body.width / 2}~${body.y + body.height + 18}~0~#000000~~9pt~normal~normal~~comment~J?~1~middle~${nextId()}`
  ];

  leftPins.forEach((pin, index) => {
    shapes.push(makeEasyEdaPin(pin, "left", body, body.y + 20 + index * rowGap, nextId()));
  });
  rightPins.forEach((pin, index) => {
    shapes.push(makeEasyEdaPin(pin, "right", body, body.y + 20 + index * rowGap, nextId()));
  });

  return {
    title: model.name,
    head: `7~1.7.5~400~300~package\`${model.name}\`nameDisplay\`0\`nameAlias\`Model\`Model\`${model.name}\`name\`${model.name}\`pre\`J?\`spicePre\`\`Contributor\`LocalWeb`,
    canvas: "CA~1200~1200~#FFFFFF~yes~#CCCCCC~10~1200~1200~line~10~pixel~5~400~300",
    shape: shapes
  };
}

function makeEasyEdaPin(pin, side, body, y, id) {
  const length = 24;
  const isLeft = side === "left";
  const dotX = isLeft ? body.x - length : body.x + body.width + length;
  const path = isLeft ? `M ${dotX} ${y} h ${length}` : `M ${dotX} ${y} h -${length}`;
  const nameX = isLeft ? body.x + 5 : body.x + body.width - 5;
  const nameAnchor = isLeft ? "start" : "end";
  const numberX = isLeft ? dotX + 4 : dotX - 4;
  const numberAnchor = isLeft ? "start" : "end";
  const bubbleX = isLeft ? dotX + 17 : dotX - 17;
  const clockPath = isLeft
    ? `M ${body.x - 6} ${y - 4} L ${body.x - 1} ${y} L ${body.x - 6} ${y + 4}`
    : `M ${body.x + body.width + 6} ${y - 4} L ${body.x + body.width + 1} ${y} L ${body.x + body.width + 6} ${y + 4}`;

  return [
    `P~show~0~${sanitizeField(pin.number)}~${dotX}~${y}~~${id}`,
    `${dotX}~${y}`,
    `${path}~#880000`,
    `1~${nameX}~${y + 4}~0~${sanitizeField(pin.name)}~${nameAnchor}~~9pt`,
    `1~${numberX}~${y - 5}~0~${sanitizeField(pin.number)}~${numberAnchor}~~9pt`,
    `0~${bubbleX}~${y}`,
    `0~${clockPath}`
  ].join("^^");
}

function generateKicadFootprint(model) {
  const lines = [];
  const halfW = ((model.cols - 1) * model.pitchMm) / 2;
  const halfH = ((model.rows - 1) * model.pitchMm) / 2;
  const outlineX = halfW + model.pitchMm / 2;
  const outlineY = halfH + model.pitchMm / 2;
  lines.push(`(footprint "${model.name}"`);
  lines.push(`  (version 20240108)`);
  lines.push(`  (generator "dupont-grid-local-web")`);
  lines.push(`  (layer "F.Cu")`);
  lines.push(`  (descr "Generated Dupont female header grid")`);
  lines.push(`  (attr through_hole)`);
  lines.push(`  (fp_text reference "J?" (at 0 ${round(-outlineY - 1.5, 3)} 0) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))`);
  lines.push(`  (fp_text value "${model.name}" (at 0 ${round(outlineY + 1.5, 3)} 0) (layer "F.Fab") (effects (font (size 1 1) (thickness 0.15))))`);
  if (model.includeOutline) {
    lines.push(kicadLine(-outlineX, -outlineY, outlineX, -outlineY, model.silkWidthMm));
    lines.push(kicadLine(outlineX, -outlineY, outlineX, outlineY, model.silkWidthMm));
    lines.push(kicadLine(outlineX, outlineY, -outlineX, outlineY, model.silkWidthMm));
    lines.push(kicadLine(-outlineX, outlineY, -outlineX, -outlineY, model.silkWidthMm));
  }
  for (const item of model.silkscreen) {
    if (item.type === "line") lines.push(kicadLine(item.x1Mm - halfW, item.y1Mm - halfH, item.x2Mm - halfW, item.y2Mm - halfH, model.silkWidthMm));
    if (item.type === "rect") {
      const x1 = Math.min(item.x1Mm, item.x2Mm) - halfW;
      const y1 = Math.min(item.y1Mm, item.y2Mm) - halfH;
      const x2 = Math.max(item.x1Mm, item.x2Mm) - halfW;
      const y2 = Math.max(item.y1Mm, item.y2Mm) - halfH;
      lines.push(kicadLine(x1, y1, x2, y1, model.silkWidthMm));
      lines.push(kicadLine(x2, y1, x2, y2, model.silkWidthMm));
      lines.push(kicadLine(x2, y2, x1, y2, model.silkWidthMm));
      lines.push(kicadLine(x1, y2, x1, y1, model.silkWidthMm));
    }
    if (item.type === "text") {
      lines.push(`  (fp_text user "${escapeKicad(item.value)}" (at ${round(item.xMm - halfW, 3)} ${round(item.yMm - halfH, 3)} 0) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))`);
    }
  }
  for (const pad of model.pads) {
    const x = pad.col * model.pitchMm - halfW;
    const y = pad.row * model.pitchMm - halfH;
    lines.push(`  (pad "${escapeKicad(pad.number)}" thru_hole circle (at ${round(x, 3)} ${round(y, 3)}) (size ${round(model.padMm, 3)} ${round(model.padMm, 3)}) (drill ${round(model.drillMm, 3)}) (layers "*.Cu" "*.Mask"))`);
  }
  lines.push(")");
  return `${lines.join("\n")}\n`;
}

function kicadLine(x1, y1, x2, y2, width) {
  return `  (fp_line (start ${round(x1, 3)} ${round(y1, 3)}) (end ${round(x2, 3)} ${round(y2, 3)}) (stroke (width ${round(width, 3)}) (type solid)) (layer "F.SilkS"))`;
}

function generateKicadSymbol(model) {
  const pins = model.pads;
  const leftCount = Math.ceil(pins.length / 2);
  const bodyHalfH = Math.max(leftCount, pins.length - leftCount, 1) * 2.54 / 2 + 1.27;
  const bodyHalfW = 8;
  const pinLength = 5.08;
  const lines = [];
  lines.push("(kicad_symbol_lib");
  lines.push("  (version 20231120)");
  lines.push("  (generator \"dupont-grid-local-web\")");
  lines.push(`  (symbol "${model.name}"`);
  lines.push("    (pin_names (offset 1.016))");
  lines.push("    (exclude_from_sim no)");
  lines.push("    (in_bom yes)");
  lines.push("    (on_board yes)");
  lines.push(`    (property "Reference" "J" (at 0 ${round(-bodyHalfH - 2.54, 3)} 0) (effects (font (size 1.27 1.27))))`);
  lines.push(`    (property "Value" "${model.name}" (at 0 ${round(bodyHalfH + 2.54, 3)} 0) (effects (font (size 1.27 1.27))))`);
  lines.push("    (symbol \"body\"");
  lines.push(`      (rectangle (start ${-bodyHalfW} ${-bodyHalfH}) (end ${bodyHalfW} ${bodyHalfH}) (stroke (width 0.254) (type default)) (fill (type none)))`);
  pins.forEach((pin, index) => {
    const side = index < leftCount ? "left" : "right";
    const sideIndex = side === "left" ? index : index - leftCount;
    const y = round(bodyHalfH - 1.27 - sideIndex * 2.54, 3);
    const x = side === "left" ? -bodyHalfW - pinLength : bodyHalfW + pinLength;
    const angle = side === "left" ? 0 : 180;
    lines.push(`      (pin passive line (at ${round(x, 3)} ${y} ${angle}) (length ${pinLength}) (name "${escapeKicad(pin.name)}" (effects (font (size 1.27 1.27)))) (number "${escapeKicad(pin.number)}" (effects (font (size 1.27 1.27)))))`);
  });
  lines.push("    )");
  lines.push("  )");
  lines.push(")");
  return `${lines.join("\n")}\n`;
}

function escapeKicad(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

function exportFile(kind) {
  if (!assertExportable()) return;
  const model = buildModel();
  if (kind === "lceda-footprint") {
    downloadText(`${model.name}.lceda-footprint.json`, JSON.stringify(generateEasyEdaFootprint(model), null, 2), "application/json");
  }
  if (kind === "lceda-symbol") {
    downloadText(`${model.name}.lceda-symbol.json`, JSON.stringify(generateEasyEdaSymbol(model), null, 2), "application/json");
  }
  if (kind === "kicad-mod") {
    downloadText(`${model.name}.kicad_mod`, generateKicadFootprint(model), "text/plain");
  }
  if (kind === "kicad-sym") {
    downloadText(`${model.name}.kicad_sym`, generateKicadSymbol(model), "text/plain");
  }
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function saveProject() {
  readSettings();
  const payload = {
    version: 1,
    ...state,
    drawStart: null,
    mode: "select"
  };
  downloadText(`${state.partName}.dupont-grid-project.json`, JSON.stringify(payload, null, 2), "application/json");
}

function loadProject(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result));
      if (!payload || !Array.isArray(payload.cells)) throw new Error("项目文件缺少 cells");
      state = {
        ...createState(clampInt(payload.rows, 1, 40), clampInt(payload.cols, 1, 40)),
        ...payload,
        rows: clampInt(payload.rows, 1, 40),
        cols: clampInt(payload.cols, 1, 40),
        mode: "select",
        drawStart: null,
        selectedKey: null,
        silkscreen: Array.isArray(payload.silkscreen) ? payload.silkscreen : []
      };
      syncInputsFromState();
      render();
    } catch (error) {
      alert(`项目文件无法导入：${error.message}`);
    }
  };
  reader.readAsText(file);
}

dom.buildGrid.addEventListener("click", rebuildGrid);
dom.enableAll.addEventListener("click", () => setAllCells(true));
dom.disableAll.addEventListener("click", () => setAllCells(false));
dom.autoNumber.addEventListener("click", autoNumberPins);
dom.clearNames.addEventListener("click", clearNames);
dom.saveProject.addEventListener("click", saveProject);
dom.projectFile.addEventListener("change", (event) => loadProject(event.target.files[0]));

dom.cellGrid.addEventListener("click", (event) => {
  if (state.mode !== "select") return;
  const button = event.target.closest(".cell");
  if (!button) return;
  toggleCell(Number(button.dataset.row), Number(button.dataset.col));
});

dom.modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    state.drawStart = null;
    renderMode();
    renderSilkscreen();
  });
});

dom.silkSvg.addEventListener("pointerdown", (event) => {
  if (state.mode === "select") return;
  addSilkscreenPoint(svgPointerToPoint(event));
});

dom.undoSilk.addEventListener("click", () => {
  if (state.drawStart) {
    state.drawStart = null;
  } else {
    state.silkscreen.pop();
  }
  render();
});

dom.pinNumber.addEventListener("input", () => {
  const cell = selectedCell();
  if (!cell) return;
  cell.pinNumber = sanitizeField(dom.pinNumber.value);
  renderGrid();
  renderStats();
});

dom.pinName.addEventListener("input", () => {
  const cell = selectedCell();
  if (!cell) return;
  cell.pinName = sanitizeField(dom.pinName.value);
  renderGrid();
});

dom.cellEnabled.addEventListener("change", () => {
  const cell = selectedCell();
  if (!cell) return;
  cell.enabled = dom.cellEnabled.checked;
  if (cell.enabled && !cell.pinNumber) cell.pinNumber = nextPinNumber();
  render();
});

[
  dom.partName,
  dom.pitch,
  dom.pad,
  dom.drill,
  dom.silkWidth,
  dom.outline,
  dom.pinNameSilk
].forEach((input) => {
  input.addEventListener("input", render);
  input.addEventListener("change", render);
});

dom.downloadLcedaFootprint.addEventListener("click", () => exportFile("lceda-footprint"));
dom.downloadLcedaSymbol.addEventListener("click", () => exportFile("lceda-symbol"));
dom.downloadKicadMod.addEventListener("click", () => exportFile("kicad-mod"));
dom.downloadKicadSym.addEventListener("click", () => exportFile("kicad-sym"));

syncInputsFromState();
render();

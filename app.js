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

const SYMBOL_SIDES = ["top", "bottom", "left", "right"];
const CACHE_COOKIE_META = "dupont_grid_project_cache_meta";
const CACHE_COOKIE_CHUNK_PREFIX = "dupont_grid_project_cache_";
const CACHE_LOCAL_STORAGE_KEY = "dupont_grid_project_cache_v2";
const CACHE_COOKIE_DAYS = 180;
const CACHE_CHUNK_SIZE = 3500;
const DEFAULT_LAYOUT_COLUMNS = { left: 300, center: 0, right: 300 };
const MIN_LAYOUT_COLUMNS = { left: 240, center: 420, right: 260 };
const PIN_NAME_SILK_POSITIONS = ["none", "top", "bottom", "left", "right"];

let state = createState(3, 8);
let cacheSaveTimer = null;

const dom = {
  appLayout: document.querySelector("#appLayout"),
  partName: document.querySelector("#partName"),
  nameSilkFontSize: document.querySelector("#nameSilkFontSizeInput"),
  rows: document.querySelector("#rowsInput"),
  cols: document.querySelector("#colsInput"),
  gridAdjustButtons: Array.from(document.querySelectorAll(".grid-adjust-button")),
  pitch: document.querySelector("#pitchInput"),
  pad: document.querySelector("#padInput"),
  drill: document.querySelector("#drillInput"),
  silkWidth: document.querySelector("#silkWidthInput"),
  outline: document.querySelector("#outlineInput"),
  pinNameSilkPosition: document.querySelector("#pinNameSilkPositionInput"),
  pinNameSilkFontSize: document.querySelector("#pinNameSilkFontSizeInput"),
  pinNameSilkOffsetX: document.querySelector("#pinNameSilkOffsetXInput"),
  pinNameSilkOffsetY: document.querySelector("#pinNameSilkOffsetYInput"),
  outlineMargin: document.querySelector("#outlineMarginInput"),
  outlineCustomMargins: document.querySelector("#outlineCustomMarginsInput"),
  outlineMarginsPanel: document.querySelector("#outlineMarginsPanel"),
  outlineMargins: {
    top: document.querySelector("#outlineTopMarginInput"),
    bottom: document.querySelector("#outlineBottomMarginInput"),
    left: document.querySelector("#outlineLeftMarginInput"),
    right: document.querySelector("#outlineRightMarginInput")
  },
  symbolRows: document.querySelector("#symbolRowsInput"),
  symbolPinsPerRow: document.querySelector("#symbolPinsPerRowInput"),
  symbolMirror: document.querySelector("#symbolMirrorInput"),
  symbolFlip: document.querySelector("#symbolFlipInput"),
  symbolFourOptions: document.querySelector("#symbolFourOptions"),
  symbolSidePins: {
    top: document.querySelector("#symbolTopPinsInput"),
    bottom: document.querySelector("#symbolBottomPinsInput"),
    left: document.querySelector("#symbolLeftPinsInput"),
    right: document.querySelector("#symbolRightPinsInput")
  },
  enableAll: document.querySelector("#enableAllButton"),
  disableAll: document.querySelector("#disableAllButton"),
  autoNumber: document.querySelector("#autoNumberButton"),
  clearNames: document.querySelector("#clearNamesButton"),
  bulkPinStylePins: document.querySelector("#bulkPinStylePinsInput"),
  bulkPinNameSilkPosition: document.querySelector("#bulkPinNameSilkPositionInput"),
  bulkPinNameSilkFontSize: document.querySelector("#bulkPinNameSilkFontSizeInput"),
  bulkPinNameSilkOffsetX: document.querySelector("#bulkPinNameSilkOffsetXInput"),
  bulkPinNameSilkOffsetY: document.querySelector("#bulkPinNameSilkOffsetYInput"),
  useSelectedPinStyle: document.querySelector("#useSelectedPinStyleButton"),
  applyPinStyle: document.querySelector("#applyPinStyleButton"),
  saveProject: document.querySelector("#saveProjectButton"),
  projectFile: document.querySelector("#projectFileInput"),
  cellGrid: document.querySelector("#cellGrid"),
  gridSurface: document.querySelector("#gridSurface"),
  silkSvg: document.querySelector("#silkSvg"),
  silkText: document.querySelector("#silkTextInput"),
  undoSilk: document.querySelector("#undoSilkButton"),
  columnResizers: Array.from(document.querySelectorAll(".column-resizer")),
  modeButtons: Array.from(document.querySelectorAll(".mode-button")),
  emptySelection: document.querySelector("#emptySelection"),
  cellInspector: document.querySelector("#cellInspector"),
  selectedCellTitle: document.querySelector("#selectedCellTitle"),
  pinNumber: document.querySelector("#pinNumberInput"),
  pinName: document.querySelector("#pinNameInput"),
  cellPinNameSilkPosition: document.querySelector("#cellPinNameSilkPositionInput"),
  cellPinNameSilkFontSize: document.querySelector("#cellPinNameSilkFontSizeInput"),
  cellPinNameSilkOffsetX: document.querySelector("#cellPinNameSilkOffsetXInput"),
  cellPinNameSilkOffsetY: document.querySelector("#cellPinNameSilkOffsetYInput"),
  cellEnabled: document.querySelector("#cellEnabledInput"),
  totalCells: document.querySelector("#totalCellsStat"),
  activeCells: document.querySelector("#activeCellsStat"),
  silkStat: document.querySelector("#silkStat"),
  symbolPreview: document.querySelector("#symbolPreview"),
  pcbPreview: document.querySelector("#pcbPreview"),
  projectStatus: document.querySelector("#projectStatus"),
  downloadKicadZip: document.querySelector("#downloadKicadZip"),
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
    nameSilkFontSizeMm: 1,
    partName: "DUPONT_GRID",
    includeOutline: true,
    includePinNameSilk: false,
    pinNameSilkPosition: "none",
    pinNameSilkFontSizeMm: 0.8,
    pinNameSilkOffsetXMm: 0,
    pinNameSilkOffsetYMm: 0,
    outlineMarginMm: 1.27,
    outlineCustomMargins: false,
    outlineMargins: createOutlineMargins(),
    symbolRows: 2,
    symbolPinsPerRow: 0,
    symbolMirror: false,
    symbolFlip: false,
    symbolSidePins: createSymbolSidePins(),
    mode: "select",
    drawStart: null,
    selectedKey: null,
    layoutColumns: createLayoutColumns(),
    cells: Array.from({ length: rows * cols }, (_, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      return createGridCell(row, col);
    }),
    silkscreen: []
  };
}

function createGridCell(row, col, source = {}) {
  const values = source || {};
  return {
    row,
    col,
    enabled: Boolean(values.enabled),
    pinNumber: String(values.pinNumber ?? ""),
    pinName: String(values.pinName ?? ""),
    pinNameSilkPosition: normalizeCellPinNameSilkPosition(values.pinNameSilkPosition ?? ""),
    pinNameSilkFontSizeMm: clampPinNameSilkFontSizeOrZero(values.pinNameSilkFontSizeMm ?? 0),
    pinNameSilkOffsetXMm: normalizeCellPinNameSilkOffset(values.pinNameSilkOffsetXMm),
    pinNameSilkOffsetYMm: normalizeCellPinNameSilkOffset(values.pinNameSilkOffsetYMm)
  };
}

function normalizeGridCells(cells, rows, cols) {
  const cellMap = new Map(Array.isArray(cells)
    ? cells.map((cell) => [keyFor(Number(cell.row), Number(cell.col)), cell])
    : []);
  return Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return createGridCell(row, col, cellMap.get(keyFor(row, col)));
  });
}

function createSymbolSidePins(source = {}) {
  const values = source || {};
  return {
    top: clampIntOrZero(values.top ?? "", 1, 200),
    bottom: clampIntOrZero(values.bottom ?? "", 1, 200),
    left: clampIntOrZero(values.left ?? "", 1, 200),
    right: clampIntOrZero(values.right ?? "", 1, 200)
  };
}

function createOutlineMargins(source = {}, fallback = 1.27) {
  const values = source || {};
  return {
    top: nonNegativeNumber(values.top, fallback),
    bottom: nonNegativeNumber(values.bottom, fallback),
    left: nonNegativeNumber(values.left, fallback),
    right: nonNegativeNumber(values.right, fallback)
  };
}

function createLayoutColumns(source = {}) {
  const values = source || {};
  return {
    left: clampNumber(values.left ?? DEFAULT_LAYOUT_COLUMNS.left, MIN_LAYOUT_COLUMNS.left, 900),
    center: clampNumber(values.center ?? DEFAULT_LAYOUT_COLUMNS.center, 0, 2000),
    right: clampNumber(values.right ?? DEFAULT_LAYOUT_COLUMNS.right, MIN_LAYOUT_COLUMNS.right, 900)
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
  dom.nameSilkFontSize.value = state.nameSilkFontSizeMm;
  dom.rows.value = state.rows;
  dom.cols.value = state.cols;
  dom.pitch.value = state.pitchMm;
  dom.pad.value = state.padMm;
  dom.drill.value = state.drillMm;
  dom.silkWidth.value = state.silkWidthMm;
  dom.outline.checked = state.includeOutline;
  dom.pinNameSilkPosition.value = state.pinNameSilkPosition;
  dom.pinNameSilkFontSize.value = state.pinNameSilkFontSizeMm;
  dom.pinNameSilkOffsetX.value = state.pinNameSilkOffsetXMm;
  dom.pinNameSilkOffsetY.value = state.pinNameSilkOffsetYMm;
  dom.bulkPinNameSilkPosition.value = state.pinNameSilkPosition === "none" ? "top" : state.pinNameSilkPosition;
  dom.bulkPinNameSilkFontSize.value = state.pinNameSilkFontSizeMm;
  dom.bulkPinNameSilkOffsetX.value = state.pinNameSilkOffsetXMm;
  dom.bulkPinNameSilkOffsetY.value = state.pinNameSilkOffsetYMm;
  dom.outlineMargin.value = state.outlineMarginMm;
  dom.outlineCustomMargins.checked = Boolean(state.outlineCustomMargins);
  syncOutlineMarginInputs();
  dom.symbolRows.value = String(state.symbolRows || 2);
  dom.symbolPinsPerRow.value = state.symbolPinsPerRow ? String(state.symbolPinsPerRow) : "";
  dom.symbolMirror.checked = Boolean(state.symbolMirror);
  dom.symbolFlip.checked = Boolean(state.symbolFlip);
  for (const side of SYMBOL_SIDES) {
    dom.symbolSidePins[side].value = state.symbolSidePins?.[side] ? String(state.symbolSidePins[side]) : "";
  }
}

function syncOutlineMarginInputs() {
  for (const side of SYMBOL_SIDES) {
    dom.outlineMargins[side].value = state.outlineMargins?.[side] ?? "";
  }
}

function readSettings() {
  const wasOutlineCustomMargins = state.outlineCustomMargins;
  state.partName = normalizeName(dom.partName.value || "DUPONT_GRID");
  state.nameSilkFontSizeMm = positiveNumber(dom.nameSilkFontSize.value, 1);
  state.pitchMm = positiveNumber(dom.pitch.value, 2.54);
  state.padMm = positiveNumber(dom.pad.value, 1.8);
  state.drillMm = positiveNumber(dom.drill.value, 1.0);
  state.silkWidthMm = positiveNumber(dom.silkWidth.value, 0.15);
  state.includeOutline = dom.outline.checked;
  state.pinNameSilkPosition = normalizePinNameSilkPosition(dom.pinNameSilkPosition.value, "none");
  state.pinNameSilkFontSizeMm = normalizePinNameSilkFontSize(dom.pinNameSilkFontSize.value);
  state.pinNameSilkOffsetXMm = normalizePinNameSilkOffset(dom.pinNameSilkOffsetX.value);
  state.pinNameSilkOffsetYMm = normalizePinNameSilkOffset(dom.pinNameSilkOffsetY.value);
  state.includePinNameSilk = state.pinNameSilkPosition !== "none";
  state.outlineMarginMm = nonNegativeNumber(dom.outlineMargin.value, 1.27);
  state.outlineCustomMargins = dom.outlineCustomMargins.checked;
  if (state.outlineCustomMargins && !wasOutlineCustomMargins) {
    state.outlineMargins = createOutlineMargins({}, state.outlineMarginMm);
    syncOutlineMarginInputs();
  } else if (state.outlineCustomMargins) {
    state.outlineMargins = createOutlineMargins({
      top: dom.outlineMargins.top.value,
      bottom: dom.outlineMargins.bottom.value,
      left: dom.outlineMargins.left.value,
      right: dom.outlineMargins.right.value
    }, state.outlineMarginMm);
  } else {
    state.outlineMargins = createOutlineMargins({}, state.outlineMarginMm);
  }
  state.symbolRows = normalizeSymbolRows(dom.symbolRows.value);
  state.symbolPinsPerRow = clampIntOrZero(dom.symbolPinsPerRow.value, 1, 200);
  state.symbolMirror = dom.symbolMirror.checked;
  state.symbolFlip = dom.symbolFlip.checked;
  state.symbolSidePins = createSymbolSidePins({
    top: dom.symbolSidePins.top.value,
    bottom: dom.symbolSidePins.bottom.value,
    left: dom.symbolSidePins.left.value,
    right: dom.symbolSidePins.right.value
  });
}

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function clampNumber(value, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeName(value) {
  return String(value)
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64) || "DUPONT_GRID";
}

function resizeGridFromInputs() {
  readSettings();
  const minimum = getMinimumGridSizeForActiveCells();
  const rows = Math.max(clampInt(dom.rows.value, 1, 40), minimum.rows);
  const cols = Math.max(clampInt(dom.cols.value, 1, 40), minimum.cols);
  const oldCells = new Map(state.cells.map((cell) => [keyFor(cell.row, cell.col), cell]));
  const currentSelection = selectedCell();
  state.rows = rows;
  state.cols = cols;
  dom.rows.value = rows;
  dom.cols.value = cols;
  state.selectedKey = currentSelection && currentSelection.row < rows && currentSelection.col < cols
    ? keyFor(currentSelection.row, currentSelection.col)
    : null;
  state.cells = Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const old = oldCells.get(keyFor(row, col));
    return createGridCell(row, col, old);
  });
  render();
}

function getMinimumGridSizeForActiveCells() {
  return getActiveCells().reduce((minimum, cell) => ({
    rows: Math.max(minimum.rows, cell.row + 1),
    cols: Math.max(minimum.cols, cell.col + 1)
  }), { rows: 1, cols: 1 });
}

function adjustGridEdge(edge, action) {
  readSettings();
  if (!["top", "bottom", "left", "right"].includes(edge)) return;
  if (!["add", "remove"].includes(action)) return;

  const isRowEdge = edge === "top" || edge === "bottom";
  const currentSize = isRowEdge ? state.rows : state.cols;
  if (action === "add") {
    if (currentSize >= 40) return;
    rebuildGridFromEdge(edge, true);
    return;
  }

  if (currentSize <= 1) return;
  if (gridEdgeHasEnabledCell(edge)) return;
  rebuildGridFromEdge(edge, false);
}

function gridEdgeHasEnabledCell(edge) {
  return state.cells.some((cell) => {
    if (!cell.enabled) return false;
    if (edge === "top") return cell.row === 0;
    if (edge === "bottom") return cell.row === state.rows - 1;
    if (edge === "left") return cell.col === 0;
    if (edge === "right") return cell.col === state.cols - 1;
    return false;
  });
}

function rebuildGridFromEdge(edge, isAdding) {
  const oldRows = state.rows;
  const oldCols = state.cols;
  const newRows = oldRows + (edge === "top" || edge === "bottom" ? (isAdding ? 1 : -1) : 0);
  const newCols = oldCols + (edge === "left" || edge === "right" ? (isAdding ? 1 : -1) : 0);
  const oldCells = new Map(state.cells.map((cell) => [keyFor(cell.row, cell.col), cell]));
  const currentSelection = selectedCell();
  const pitchShift = getGridEdgePitchShift(edge, isAdding);

  state.rows = newRows;
  state.cols = newCols;
  dom.rows.value = newRows;
  dom.cols.value = newCols;
  state.selectedKey = mapSelectedKeyAfterGridEdgeChange(currentSelection, edge, isAdding, newRows, newCols);
  state.cells = Array.from({ length: newRows * newCols }, (_, index) => {
    const row = Math.floor(index / newCols);
    const col = index % newCols;
    const oldRow = sourceRowForGridEdge(row, edge, isAdding);
    const oldCol = sourceColForGridEdge(col, edge, isAdding);
    const old = oldRow >= 0 && oldRow < oldRows && oldCol >= 0 && oldCol < oldCols
      ? oldCells.get(keyFor(oldRow, oldCol))
      : null;
    return createGridCell(row, col, old);
  });
  if (pitchShift.x || pitchShift.y) shiftSilkscreen(pitchShift.x, pitchShift.y);
  render();
}

function sourceRowForGridEdge(row, edge, isAdding) {
  if (edge === "top") return isAdding ? row - 1 : row + 1;
  return row;
}

function sourceColForGridEdge(col, edge, isAdding) {
  if (edge === "left") return isAdding ? col - 1 : col + 1;
  return col;
}

function mapSelectedKeyAfterGridEdgeChange(cell, edge, isAdding, rows, cols) {
  if (!cell) return null;
  let row = cell.row;
  let col = cell.col;
  if (isAdding) {
    if (edge === "top") row += 1;
    if (edge === "left") col += 1;
  } else {
    if (edge === "top") {
      if (row === 0) return null;
      row -= 1;
    }
    if (edge === "bottom" && row >= rows) return null;
    if (edge === "left") {
      if (col === 0) return null;
      col -= 1;
    }
    if (edge === "right" && col >= cols) return null;
  }
  return row >= 0 && row < rows && col >= 0 && col < cols ? keyFor(row, col) : null;
}

function getGridEdgePitchShift(edge, isAdding) {
  const amount = isAdding ? state.pitchMm : -state.pitchMm;
  if (edge === "top") return { x: 0, y: amount };
  if (edge === "left") return { x: amount, y: 0 };
  return { x: 0, y: 0 };
}

function shiftSilkscreen(dxMm, dyMm) {
  state.silkscreen = state.silkscreen.map((item) => {
    if (item.type === "line") {
      return {
        ...item,
        x1Mm: round(item.x1Mm + dxMm, 6),
        y1Mm: round(item.y1Mm + dyMm, 6),
        x2Mm: round(item.x2Mm + dxMm, 6),
        y2Mm: round(item.y2Mm + dyMm, 6)
      };
    }
    if (item.type === "rect") {
      return {
        ...item,
        x1Mm: round(item.x1Mm + dxMm, 6),
        y1Mm: round(item.y1Mm + dyMm, 6),
        x2Mm: round(item.x2Mm + dxMm, 6),
        y2Mm: round(item.y2Mm + dyMm, 6)
      };
    }
    if (item.type === "text") {
      return {
        ...item,
        xMm: round(item.xMm + dxMm, 6),
        yMm: round(item.yMm + dyMm, 6)
      };
    }
    return { ...item };
  });
  if (state.drawStart) {
    state.drawStart = {
      ...state.drawStart,
      xMm: round(state.drawStart.xMm + dxMm, 6),
      yMm: round(state.drawStart.yMm + dyMm, 6)
    };
  }
}

function clampInt(value, min, max) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function clampIntOrZero(value, min, max) {
  const text = String(value).trim();
  const parsed = Number(text);
  if (text === "" || !Number.isFinite(parsed) || parsed <= 0) return 0;
  return clampInt(parsed, min, max);
}

function normalizeSymbolRows(value) {
  const rows = clampInt(value, 1, 4);
  return rows >= 4 ? 4 : rows >= 2 ? 2 : 1;
}

function normalizePinNameSilkPosition(value, fallback = "none") {
  const normalized = String(value || "").trim().toLowerCase();
  return PIN_NAME_SILK_POSITIONS.includes(normalized) ? normalized : fallback;
}

function normalizeCellPinNameSilkPosition(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PIN_NAME_SILK_POSITIONS.includes(normalized) ? normalized : "";
}

function normalizePinNameSilkFontSize(value) {
  return clampNumber(value, 0.4, 5);
}

function clampPinNameSilkFontSizeOrZero(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return normalizePinNameSilkFontSize(parsed);
}

function normalizePinNameSilkOffset(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? round(parsed, 3) : fallback;
}

function normalizeCellPinNameSilkOffset(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  return normalizePinNameSilkOffset(value);
}

function getCellPinNameSilkPosition(cell) {
  return normalizePinNameSilkPosition(cell.pinNameSilkPosition || state.pinNameSilkPosition, state.pinNameSilkPosition);
}

function getCellPinNameSilkFontSize(cell) {
  return cell.pinNameSilkFontSizeMm > 0
    ? normalizePinNameSilkFontSize(cell.pinNameSilkFontSizeMm)
    : normalizePinNameSilkFontSize(state.pinNameSilkFontSizeMm);
}

function getCellPinNameSilkOffsetX(cell) {
  return cell.pinNameSilkOffsetXMm === null || cell.pinNameSilkOffsetXMm === undefined
    ? normalizePinNameSilkOffset(state.pinNameSilkOffsetXMm)
    : normalizePinNameSilkOffset(cell.pinNameSilkOffsetXMm);
}

function getCellPinNameSilkOffsetY(cell) {
  return cell.pinNameSilkOffsetYMm === null || cell.pinNameSilkOffsetYMm === undefined
    ? normalizePinNameSilkOffset(state.pinNameSilkOffsetYMm)
    : normalizePinNameSilkOffset(cell.pinNameSilkOffsetYMm);
}

function render() {
  readSettings();
  applyLayoutColumns();
  renderGrid();
  renderSilkscreen();
  renderInspector();
  renderStats();
  renderOutlineOptions();
  renderSymbolOptions();
  renderSymbolPreview();
  renderPcbPreview();
  renderMode();
  scheduleProjectCacheSave();
}

function renderOutlineOptions() {
  dom.outlineMarginsPanel.classList.toggle("hidden", !state.outlineCustomMargins);
}

function renderSymbolOptions() {
  dom.symbolFourOptions.classList.toggle("hidden", state.symbolRows !== 4);
}

function applyLayoutColumns() {
  if (!dom.appLayout) return;
  const columns = createLayoutColumns(state.layoutColumns);
  dom.appLayout.style.setProperty("--layout-left", `${round(columns.left, 1)}px`);
  if (columns.center > 0) {
    dom.appLayout.style.setProperty("--layout-center", `${round(columns.center, 1)}px`);
  } else {
    dom.appLayout.style.removeProperty("--layout-center");
  }
  dom.appLayout.style.setProperty("--layout-right", `${round(columns.right, 1)}px`);
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
  dom.cellPinNameSilkPosition.value = getCellPinNameSilkPosition(cell);
  dom.cellPinNameSilkFontSize.value = getCellPinNameSilkFontSize(cell);
  dom.cellPinNameSilkOffsetX.value = getCellPinNameSilkOffsetX(cell);
  dom.cellPinNameSilkOffsetY.value = getCellPinNameSilkOffsetY(cell);
  dom.cellEnabled.checked = cell.enabled;
}

function renderStats() {
  const active = getActiveCells();
  dom.totalCells.textContent = String(state.rows * state.cols);
  dom.activeCells.textContent = String(active.length);
  dom.silkStat.textContent = String(state.silkscreen.length + (state.includeOutline ? 1 : 0));
  dom.projectStatus.textContent = active.length ? `${active.length} 个焊孔` : "未生成";
}

function renderSymbolPreview() {
  const model = buildModel();
  const svg = dom.symbolPreview;
  svg.innerHTML = "";
  if (!model.pads.length) {
    svg.setAttribute("viewBox", "0 0 300 220");
    const text = svgEl("text", {
      x: 150,
      y: 110,
      fill: "#65717d",
      "font-size": 13,
      "text-anchor": "middle"
    });
    text.textContent = "启用格子后显示器件预览";
    svg.appendChild(text);
    return;
  }

  const layout = buildSymbolLayout(model);
  const pinLength = layout.pinLength;
  const minX = -layout.bodyHalfW - pinLength - 5;
  const maxX = layout.bodyHalfW + pinLength + 5;
  const minY = -layout.bodyHalfH - pinLength - 5;
  const maxY = layout.bodyHalfH + pinLength + 5;
  const scale = 16;
  const margin = 14;
  const width = Math.max(260, (maxX - minX) * scale + margin * 2);
  const height = Math.max(220, (maxY - minY) * scale + margin * 2);
  const toX = (x) => margin + (x - minX) * scale;
  const toY = (y) => margin + (maxY - y) * scale;
  const selected = selectedCell();

  svg.setAttribute("viewBox", `0 0 ${round(width, 2)} ${round(height, 2)}`);
  svg.setAttribute("height", Math.round(height));

  const title = svgEl("text", {
    class: "symbol-title",
    x: toX(0),
    y: toY(layout.bodyHalfH + 1.27)
  });
  title.textContent = model.name;
  svg.appendChild(title);

  const body = svgEl("rect", {
    class: "symbol-body",
    x: toX(-layout.bodyHalfW),
    y: toY(layout.bodyHalfH),
    width: layout.bodyHalfW * 2 * scale,
    height: layout.bodyHalfH * 2 * scale
  });
  svg.appendChild(body);

  for (const pin of layout.pins) {
    const group = svgEl("g", {
      class: `symbol-pin${selected && selected.enabled && selected.pinNumber === pin.pin.number ? " selected" : ""}`
    });
    const points = getPreviewPinPoints(layout, pin);
    const line = svgEl("line", {
      class: "symbol-pin-line",
      x1: toX(points.outsideX),
      y1: toY(points.outsideY),
      x2: toX(points.bodyX),
      y2: toY(points.bodyY)
    });
    const terminal = svgEl("circle", {
      class: "symbol-pin-terminal",
      cx: toX(points.outsideX),
      cy: toY(points.outsideY),
      r: 4
    });
    const number = svgEl("text", {
      class: "symbol-pin-number",
      x: toX(points.numberX),
      y: toY(points.numberY) - points.numberOffsetY,
      "text-anchor": "middle"
    });
    number.textContent = pin.pin.number;
    const name = svgEl("text", {
      class: "symbol-pin-name",
      x: toX(points.nameX),
      y: toY(points.nameY),
      "text-anchor": points.nameAnchor
    });
    name.textContent = pin.pin.name;
    group.append(line, terminal, number, name);
    svg.appendChild(group);
  }

  const ref = svgEl("text", {
    class: "symbol-ref",
    x: toX(0),
    y: toY(-layout.bodyHalfH - 1.27)
  });
  ref.textContent = "J?";
  svg.appendChild(ref);
}

function renderPcbPreview() {
  const model = buildModel();
  const svg = dom.pcbPreview;
  svg.innerHTML = "";
  if (!model.pads.length) {
    svg.setAttribute("viewBox", "0 0 300 220");
    svg.setAttribute("height", 220);
    const text = svgEl("text", {
      x: 150,
      y: 110,
      fill: "#65717d",
      "font-size": 13,
      "text-anchor": "middle"
    });
    text.textContent = "启用格子后显示 PCB 预览";
    svg.appendChild(text);
    return;
  }

  const bounds = getPcbPreviewBounds(model);
  const viewW = Math.max(1, bounds.maxX - bounds.minX);
  const viewH = Math.max(1, bounds.maxY - bounds.minY);
  const height = Math.round(Math.max(220, Math.min(420, viewH * 28)));
  const metrics = getFootprintMetrics(model);

  svg.setAttribute("viewBox", `${round(bounds.minX, 3)} ${round(bounds.minY, 3)} ${round(viewW, 3)} ${round(viewH, 3)}`);
  svg.setAttribute("height", height);

  if (model.includeOutline) {
    svg.appendChild(svgEl("rect", {
      class: "pcb-outline",
      x: metrics.leftX,
      y: metrics.topY,
      width: round(metrics.rightX - metrics.leftX, 3),
      height: round(metrics.bottomY - metrics.topY, 3)
    }));
  }

  const partNameText = getPartNameTextPlacement(model);
  const partName = svgEl("text", {
    class: "pcb-part-name",
    x: partNameText.x,
    y: partNameText.y,
    "font-size": partNameText.size,
    "text-anchor": "middle"
  });
  partName.textContent = model.name;
  svg.appendChild(partName);

  for (const item of model.silkscreen) {
    appendPcbSilkscreenItem(svg, model, item);
  }

  for (const pad of model.pads) {
    const pinText = getPinNameSilkPlacement(model, pad);
    if (pinText) {
      const text = svgEl("text", {
        class: "pcb-pin-name",
        x: pinText.x,
        y: pinText.y,
        "font-size": pinText.size,
        "text-anchor": pinText.anchor
      });
      text.textContent = pad.name;
      svg.appendChild(text);
    }
  }

  for (const pad of model.pads) {
    const point = padToFootprintPoint(model, pad);
    const group = svgEl("g", { class: "pcb-pad-group" });
    const copper = svgEl("circle", {
      class: "pcb-pad",
      cx: point.x,
      cy: point.y,
      r: round(model.padMm / 2, 3)
    });
    const drill = svgEl("circle", {
      class: "pcb-drill",
      cx: point.x,
      cy: point.y,
      r: round(model.drillMm / 2, 3)
    });
    const number = svgEl("text", {
      class: "pcb-pad-number",
      x: point.x,
      y: point.y
    });
    number.textContent = pad.number;
    group.append(copper, drill, number);
    svg.appendChild(group);
  }
}

function appendPcbSilkscreenItem(svg, model, item) {
  if (item.type === "line") {
    const p1 = footprintLocalPoint(model, item.x1Mm, item.y1Mm);
    const p2 = footprintLocalPoint(model, item.x2Mm, item.y2Mm);
    svg.appendChild(svgEl("line", {
      class: "pcb-silk",
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y
    }));
  }
  if (item.type === "rect") {
    const p1 = footprintLocalPoint(model, Math.min(item.x1Mm, item.x2Mm), Math.min(item.y1Mm, item.y2Mm));
    const p2 = footprintLocalPoint(model, Math.max(item.x1Mm, item.x2Mm), Math.max(item.y1Mm, item.y2Mm));
    svg.appendChild(svgEl("rect", {
      class: "pcb-silk",
      x: p1.x,
      y: p1.y,
      width: Math.max(0.1, p2.x - p1.x),
      height: Math.max(0.1, p2.y - p1.y)
    }));
  }
  if (item.type === "text") {
    const point = footprintLocalPoint(model, item.xMm, item.yMm);
    const text = svgEl("text", {
      class: "pcb-silk-text",
      x: point.x,
      y: point.y
    });
    text.textContent = item.value;
    svg.appendChild(text);
  }
}

function getPcbPreviewBounds(model) {
  const xs = [];
  const ys = [];
  const include = (x, y) => {
    xs.push(x);
    ys.push(y);
  };
  const metrics = getFootprintMetrics(model);
  const padRadius = model.padMm / 2;

  for (const pad of model.pads) {
    const point = padToFootprintPoint(model, pad);
    include(point.x - padRadius, point.y - padRadius);
    include(point.x + padRadius, point.y + padRadius);
    const pinText = getPinNameSilkPlacement(model, pad);
    if (pinText) includeTextBounds(include, pad.name, pinText);
  }

  if (model.includeOutline) {
    include(metrics.leftX, metrics.topY);
    include(metrics.rightX, metrics.bottomY);
  }

  const partNameText = getPartNameTextPlacement(model);
  const estimatedWidth = Math.max(partNameText.size, model.name.length * partNameText.size * 0.65);
  include(partNameText.x - estimatedWidth / 2, partNameText.y - partNameText.size);
  include(partNameText.x + estimatedWidth / 2, partNameText.y + partNameText.size);

  for (const item of model.silkscreen) {
    if (item.type === "line" || item.type === "rect") {
      const p1 = footprintLocalPoint(model, item.x1Mm, item.y1Mm);
      const p2 = footprintLocalPoint(model, item.x2Mm, item.y2Mm);
      include(p1.x, p1.y);
      include(p2.x, p2.y);
    }
    if (item.type === "text") {
      const point = footprintLocalPoint(model, item.xMm, item.yMm);
      include(point.x, point.y);
    }
  }

  if (!xs.length) {
    include(-metrics.halfW - padRadius, -metrics.halfH - padRadius);
    include(metrics.halfW + padRadius, metrics.halfH + padRadius);
  }

  const margin = Math.max(1.2, model.padMm / 2 + model.silkWidthMm + 0.5);
  return {
    minX: Math.min(...xs) - margin,
    minY: Math.min(...ys) - margin,
    maxX: Math.max(...xs) + margin,
    maxY: Math.max(...ys) + margin
  };
}

function getPartNameTextPlacement(model) {
  const metrics = getFootprintMetrics(model);
  const size = Math.max(0.4, model.nameSilkFontSizeMm || 1);
  return {
    x: 0,
    y: round(metrics.bottomY + Math.max(1.5, size * 1.5), 3),
    size,
    thickness: round(Math.max(0.1, size * 0.15), 3)
  };
}

function getPinNameSilkPlacement(model, pad) {
  const position = normalizePinNameSilkPosition(pad.pinNameSilkPosition, "none");
  if (position === "none") return null;

  const center = padToFootprintPoint(model, pad);
  const size = normalizePinNameSilkFontSize(pad.pinNameSilkFontSizeMm || model.pinNameSilkFontSizeMm || 0.8);
  const gap = Math.max(0.2, model.silkWidthMm * 2);
  const verticalOffset = model.padMm / 2 + gap + size * 0.45;
  const horizontalOffset = model.padMm / 2 + gap;
  const placement = {
    x: center.x,
    y: center.y,
    size,
    thickness: round(Math.max(0.1, size * 0.15), 3),
    anchor: "middle",
    justify: ""
  };

  if (position === "top") {
    placement.y = round(center.y - verticalOffset, 3);
  }
  if (position === "bottom") {
    placement.y = round(center.y + verticalOffset, 3);
  }
  if (position === "left") {
    placement.x = round(center.x - horizontalOffset, 3);
    placement.anchor = "end";
    placement.justify = "right";
  }
  if (position === "right") {
    placement.x = round(center.x + horizontalOffset, 3);
    placement.anchor = "start";
    placement.justify = "left";
  }
  placement.x = round(placement.x + normalizePinNameSilkOffset(pad.pinNameSilkOffsetXMm ?? model.pinNameSilkOffsetXMm), 3);
  placement.y = round(placement.y + normalizePinNameSilkOffset(pad.pinNameSilkOffsetYMm ?? model.pinNameSilkOffsetYMm), 3);
  return placement;
}

function includeTextBounds(include, text, placement) {
  const width = Math.max(placement.size, String(text).length * placement.size * 0.65);
  const height = placement.size;
  let left = placement.x - width / 2;
  let right = placement.x + width / 2;
  if (placement.anchor === "start") {
    left = placement.x;
    right = placement.x + width;
  }
  if (placement.anchor === "end") {
    left = placement.x - width;
    right = placement.x;
  }
  include(left, placement.y - height / 2);
  include(right, placement.y + height / 2);
}

function getPreviewPinPoints(layout, pin) {
  if (pin.side === "left" || pin.side === "right") {
    const bodyX = pin.side === "left" ? -layout.bodyHalfW : layout.bodyHalfW;
    const outsideX = pin.side === "left" ? -layout.bodyHalfW - layout.pinLength : layout.bodyHalfW + layout.pinLength;
    return {
      outsideX,
      outsideY: pin.y,
      bodyX,
      bodyY: pin.y,
      numberX: (outsideX + bodyX) / 2,
      numberY: pin.y,
      numberOffsetY: 9,
      nameX: pin.side === "left" ? -layout.bodyHalfW + 1.2 : layout.bodyHalfW - 1.2,
      nameY: pin.y,
      nameAnchor: pin.side === "left" ? "start" : "end"
    };
  }

  const bodyY = pin.side === "top" ? layout.bodyHalfH : -layout.bodyHalfH;
  const outsideY = pin.side === "top" ? layout.bodyHalfH + layout.pinLength : -layout.bodyHalfH - layout.pinLength;
  return {
    outsideX: pin.x,
    outsideY,
    bodyX: pin.x,
    bodyY,
    numberX: pin.x,
    numberY: (outsideY + bodyY) / 2,
    numberOffsetY: pin.side === "top" ? 4 : -13,
    nameX: pin.x,
    nameY: pin.side === "top" ? bodyY - 1.2 : bodyY + 1.2,
    nameAnchor: "middle"
  };
}

function buildSymbolLayout(model) {
  const pins = model.pads;
  const pinLength = 5.08;
  const rowPitch = 2.54;
  const configuredRows = normalizeSymbolRows(model.symbolRows || 2);
  const sidePins = assignPinsToSymbolSides(pins, model, configuredRows);
  const layoutPins = [];

  const horizontalCount = Math.max(sidePins.top.length, sidePins.bottom.length, 1);
  const verticalCount = Math.max(sidePins.left.length, sidePins.right.length, 1);
  const bodyHalfW = Math.max(7, ((horizontalCount - 1) * rowPitch) / 2 + 2.54);
  const bodyHalfH = Math.max(4, ((verticalCount - 1) * rowPitch) / 2 + 2.54);

  const addHorizontalPins = (side) => {
    const count = sidePins[side].length;
    const startX = -((count - 1) * rowPitch) / 2;
    sidePins[side].forEach((pin, index) => {
      layoutPins.push({
        pin,
        side,
        x: round(startX + index * rowPitch, 3),
        y: side === "top" ? round(bodyHalfH + pinLength, 3) : round(-bodyHalfH - pinLength, 3),
        angle: side === "top" ? 270 : 90
      });
    });
  };

  const addVerticalPins = (side) => {
    const count = sidePins[side].length;
    const startY = ((count - 1) * rowPitch) / 2;
    sidePins[side].forEach((pin, index) => {
      layoutPins.push({
        pin,
        side,
        x: side === "left" ? -bodyHalfW - pinLength : bodyHalfW + pinLength,
        y: round(startY - index * rowPitch, 3),
        angle: side === "left" ? 0 : 180
      });
    });
  };

  addHorizontalPins("top");
  addHorizontalPins("bottom");
  addVerticalPins("left");
  addVerticalPins("right");

  return {
    bodyHalfH,
    bodyHalfW,
    pinLength,
    pins: layoutPins
  };
}

function assignPinsToSymbolSides(pins, model, configuredRows) {
  const baseSidePins = createSymbolSideBuckets();
  const pinsPerRow = model.symbolPinsPerRow > 0
    ? Math.max(1, Math.floor(model.symbolPinsPerRow))
    : Math.max(1, Math.ceil(Math.max(pins.length, 1) / configuredRows));

  if (configuredRows === 4) {
    assignFourSidePins(baseSidePins, pins, model);
  } else if (configuredRows === 2) {
    assignInterleavedTwoSidePins(baseSidePins, pins);
  } else {
    const sideSequence = ["left"];
    const groupCount = Math.max(configuredRows, Math.ceil(Math.max(pins.length, 1) / pinsPerRow));
    for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
      const side = sideSequence[groupIndex % sideSequence.length];
      const start = groupIndex * pinsPerRow;
      baseSidePins[side].push(...pins.slice(start, start + pinsPerRow));
    }
  }

  return transformSymbolSidePins(baseSidePins, model);
}

function assignInterleavedTwoSidePins(sidePins, pins) {
  // Dual-row headers usually number pins in a left/right interleaved sequence.
  assignRoundRobinPins(sidePins, pins, ["left", "right"]);
}

function assignFourSidePins(sidePins, pins, model) {
  const sideCounts = createSymbolSidePins(model.symbolSidePins);
  const hasSideCounts = SYMBOL_SIDES.some((side) => sideCounts[side] > 0);

  if (!hasSideCounts) {
    assignRoundRobinPins(sidePins, pins, SYMBOL_SIDES);
    return;
  }

  const autoSides = SYMBOL_SIDES.filter((side) => sideCounts[side] === 0);
  const targets = {};
  let remaining = pins.length;

  for (const side of SYMBOL_SIDES) {
    const fixed = Math.min(sideCounts[side], remaining);
    targets[side] = fixed;
    remaining -= fixed;
  }

  if (remaining > 0 && autoSides.length) {
    for (let index = 0; index < remaining; index += 1) {
      const side = autoSides[index % autoSides.length];
      targets[side] += 1;
    }
  } else if (remaining > 0) {
    targets.right += remaining;
  }

  assignRoundRobinPinsWithTargets(sidePins, pins, SYMBOL_SIDES, targets);
}

function assignRoundRobinPins(sidePins, pins, sideOrder) {
  pins.forEach((pin, index) => {
    sidePins[sideOrder[index % sideOrder.length]].push(pin);
  });
}

function assignRoundRobinPinsWithTargets(sidePins, pins, sideOrder, targets) {
  const assigned = Object.fromEntries(sideOrder.map((side) => [side, 0]));
  let cursor = 0;

  pins.forEach((pin) => {
    let placed = false;
    for (let offset = 0; offset < sideOrder.length; offset += 1) {
      const side = sideOrder[(cursor + offset) % sideOrder.length];
      if ((assigned[side] || 0) >= (targets[side] || 0)) continue;
      sidePins[side].push(pin);
      assigned[side] += 1;
      cursor = (cursor + offset + 1) % sideOrder.length;
      placed = true;
      break;
    }

    if (!placed) {
      const fallbackSide = sideOrder[sideOrder.length - 1];
      sidePins[fallbackSide].push(pin);
      assigned[fallbackSide] += 1;
    }
  });
}

function createSymbolSideBuckets() {
  return {
    top: [],
    bottom: [],
    left: [],
    right: []
  };
}

function transformSymbolSidePins(sidePins, model) {
  const transformed = createSymbolSideBuckets();
  for (const side of SYMBOL_SIDES) {
    transformed[transformSymbolSide(side, model)].push(...sidePins[side]);
  }
  return transformed;
}

function transformSymbolSide(side, model) {
  let next = side;
  if (model.symbolMirror) {
    if (next === "left") next = "right";
    else if (next === "right") next = "left";
  }
  if (model.symbolFlip) {
    if (next === "top") next = "bottom";
    else if (next === "bottom") next = "top";
  }
  return next;
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
  return { level: "ok", message: "可以导出 KiCad 器件与封装。" };
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
      name: sanitizeField(cell.pinName || `PIN_${number}`),
      pinNameSilkPosition: getCellPinNameSilkPosition(cell),
      pinNameSilkFontSizeMm: getCellPinNameSilkFontSize(cell),
      pinNameSilkOffsetXMm: getCellPinNameSilkOffsetX(cell),
      pinNameSilkOffsetYMm: getCellPinNameSilkOffsetY(cell)
    };
  });
  const includePinNameSilk = pads.some((pad) => pad.pinNameSilkPosition !== "none");

  return {
    name: state.partName,
    rows: state.rows,
    cols: state.cols,
    pitchMm: state.pitchMm,
    padMm: state.padMm,
    drillMm: state.drillMm,
    silkWidthMm: state.silkWidthMm,
    nameSilkFontSizeMm: state.nameSilkFontSizeMm,
    pinNameSilkFontSizeMm: state.pinNameSilkFontSizeMm,
    pinNameSilkOffsetXMm: state.pinNameSilkOffsetXMm,
    pinNameSilkOffsetYMm: state.pinNameSilkOffsetYMm,
    includeOutline: state.includeOutline,
    includePinNameSilk,
    pinNameSilkPosition: state.pinNameSilkPosition,
    outlineMarginMm: state.outlineMarginMm,
    outlineCustomMargins: state.outlineCustomMargins,
    outlineMargins: createOutlineMargins(state.outlineMargins, state.outlineMarginMm),
    symbolRows: state.symbolRows,
    symbolPinsPerRow: state.symbolPinsPerRow,
    symbolMirror: state.symbolMirror,
    symbolFlip: state.symbolFlip,
    symbolSidePins: createSymbolSidePins(state.symbolSidePins),
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
  state.cells.forEach((cell) => {
    if (!cell.enabled) cell.pinNumber = "";
  });
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

function useSelectedPinAsBulkTemplate() {
  readSettings();
  const cell = selectedCell();
  if (!cell || !cell.enabled) {
    alert("请先选择一个已启用的引脚作为模版。");
    return;
  }

  dom.bulkPinNameSilkPosition.value = getCellPinNameSilkPosition(cell);
  dom.bulkPinNameSilkFontSize.value = getCellPinNameSilkFontSize(cell);
  dom.bulkPinNameSilkOffsetX.value = getCellPinNameSilkOffsetX(cell);
  dom.bulkPinNameSilkOffsetY.value = getCellPinNameSilkOffsetY(cell);
}

function applyBulkPinNameSilkStyle() {
  readSettings();
  const targets = parsePinSelector(dom.bulkPinStylePins.value);
  if (!targets.size) {
    alert("请填写要设置的引脚编号，例如 1,2,5-8。");
    return;
  }

  const position = normalizePinNameSilkPosition(dom.bulkPinNameSilkPosition.value, "none");
  const fontSize = normalizePinNameSilkFontSize(dom.bulkPinNameSilkFontSize.value);
  const offsetX = normalizePinNameSilkOffset(dom.bulkPinNameSilkOffsetX.value);
  const offsetY = normalizePinNameSilkOffset(dom.bulkPinNameSilkOffsetY.value);
  let changed = 0;
  for (const cell of getActiveCells()) {
    const pinNumber = String(cell.pinNumber).trim();
    if (!pinNumber || !targets.has(pinNumber)) continue;
    cell.pinNameSilkPosition = position;
    cell.pinNameSilkFontSizeMm = fontSize;
    cell.pinNameSilkOffsetXMm = offsetX;
    cell.pinNameSilkOffsetYMm = offsetY;
    changed += 1;
  }

  if (!changed) {
    alert("没有匹配到已启用的引脚编号。");
    return;
  }
  render();
}

function parsePinSelector(value) {
  const pins = new Set();
  String(value)
    .split(/[\s,;，；]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((token) => {
      const range = token.match(/^(\d+)\s*[-~]\s*(\d+)$/);
      if (range) {
        const start = Number(range[1]);
        const end = Number(range[2]);
        const step = start <= end ? 1 : -1;
        for (let pin = start; step > 0 ? pin <= end : pin >= end; pin += step) {
          pins.add(String(pin));
        }
        return;
      }
      pins.add(token);
    });
  return pins;
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

function getFootprintMetrics(model) {
  const halfW = ((model.cols - 1) * model.pitchMm) / 2;
  const halfH = ((model.rows - 1) * model.pitchMm) / 2;
  const margins = getOutlineMargins(model);
  return {
    halfW,
    halfH,
    outlineLeft: margins.left,
    outlineRight: margins.right,
    outlineTop: margins.top,
    outlineBottom: margins.bottom,
    leftX: round(-halfW - margins.left, 3),
    rightX: round(halfW + margins.right, 3),
    topY: round(-halfH - margins.top, 3),
    bottomY: round(halfH + margins.bottom, 3)
  };
}

function getOutlineMargins(model) {
  const unified = Math.max(0, model.outlineMarginMm ?? model.pitchMm / 2);
  if (!model.outlineCustomMargins) {
    return {
      top: unified,
      bottom: unified,
      left: unified,
      right: unified
    };
  }
  return createOutlineMargins(model.outlineMargins, unified);
}

function footprintLocalPoint(model, xMm, yMm) {
  const metrics = getFootprintMetrics(model);
  return {
    x: round(xMm - metrics.halfW, 3),
    y: round(yMm - metrics.halfH, 3)
  };
}

function padToFootprintPoint(model, pad, offsetX = 0, offsetY = 0) {
  return footprintLocalPoint(
    model,
    pad.col * model.pitchMm + offsetX,
    pad.row * model.pitchMm + offsetY
  );
}

function footprintPoint(model, xMm, yMm) {
  const centerX = ((model.cols - 1) * model.pitchMm) / 2;
  const centerY = ((model.rows - 1) * model.pitchMm) / 2;
  return {
    x: round(EE_ORIGIN.x + mmToEe(xMm - centerX), 4),
    y: round(EE_ORIGIN.y + mmToEe(yMm - centerY), 4)
  };
}

function generateEasyEdaPcbShapes(model, startId = 1) {
  let id = startId;
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
    const margins = getOutlineMargins(model);
    addEasyEdaRectTrack(shapes, model, -margins.left, -margins.top, (model.cols - 1) * model.pitchMm + margins.right, (model.rows - 1) * model.pitchMm + margins.bottom, silkWidth, nextId());
  }

  for (const pad of model.pads) {
    const pinText = getPinNameSilkPlacement(model, pad);
    if (pinText) {
      const base = footprintPoint(model, pinText.x + getFootprintMetrics(model).halfW, pinText.y + getFootprintMetrics(model).halfH);
      shapes.push(`TEXT~L~${base.x}~${base.y}~${round(pinText.size, 3)}~0~none~3~~4~${sanitizeField(pad.name)}~~~${nextId()}`);
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

  return shapes;
}

function generateEasyEdaPcbData(model) {
  const footprintId = "gge1";
  const boardOutlineId = "gge2";
  const shape = [
    generateEasyEdaBoardOutline(model, boardOutlineId),
    generateEasyEdaPcbLibShape(model, footprintId)
  ];
  return {
    head: {
      docType: "3",
      editorVersion: "6.5.22",
      newgId: true
    },
    canvas: "CA~2400~2400~#000000~yes~#FFFFFF~10~1200~1200~line~5~mil~9~45~visible~0.5",
    shape,
    layers: DEFAULT_LAYERS,
    objects: [],
    systemColor: "#000000~#FFFFFF~#FFFFFF~#000000~#FFFFFF",
    BBox: getEasyEdaPcbBBox(model),
    DRCRULE: {
      trackWidth: 0.7,
      track2Track: 0.7,
      pad2Pad: 0.8,
      track2Pad: 0.8,
      hole2Hole: 1,
      holeSize: round(mmToEe(model.drillMm), 3),
      isRealtime: false
    },
    preference: {
      hideFootprints: "",
      hideNets: ""
    }
  };
}

function generateEasyEdaPcbDocument(model) {
  const dataStr = generateEasyEdaPcbData(model);
  return {
    docType: "3",
    editorVersion: "6.5.22",
    title: model.name,
    description: "Generated by dupont-grid-footprint-generator",
    dataStr: JSON.stringify(dataStr)
  };
}

function generateEasyEdaFootprint(model) {
  const dataStr = {
    layers: DEFAULT_LAYERS,
    systemColor: "#000000~#FFFFFF~#FFFFFF~#000000~#FFFFFF",
    BBox: getEasyEdaPcbBBox(model),
    DRCRULE: {
      trackWidth: 0.7,
      track2Track: 0.7,
      pad2Pad: 0.8,
      track2Pad: 0.8,
      hole2Hole: 1,
      holeSize: round(mmToEe(model.drillMm), 3),
      isRealtime: false
    },
    preference: {
      hideFootprints: "",
      hideNets: ""
    }
  };
  return {
    docType: "4",
    editorVersion: "6.5.22",
    title: `${model.name}_FOOTPRINT`,
    description: "Generated by dupont-grid-footprint-generator",
    dataStr: JSON.stringify({
      head: {
        docType: "4",
        editorVersion: "6.5.22",
        newgId: true,
        x: EE_ORIGIN.x,
        y: EE_ORIGIN.y,
        c_para: {
          package: model.name,
          pre: "J?",
          Contributor: "LocalWeb"
        }
      },
      canvas: "CA~2400~2400~#000000~yes~#FFFFFF~10~1200~1200~line~5~mil~9~45~visible~0.5",
      shape: generateEasyEdaPcbShapes(model),
      ...dataStr
    })
  };
}

function generateEasyEdaPcbLibShape(model, id) {
  const center = footprintPoint(model, ((model.cols - 1) * model.pitchMm) / 2, ((model.rows - 1) * model.pitchMm) / 2);
  const attrs = `package\`${model.name}\`value\`${model.name}`;
  const shapes = generateEasyEdaPcbShapes(model, 10).join("#@$");
  return `LIB~${center.x}~${center.y}~${attrs}~~~${id}~1#@$${shapes}`;
}

function generateEasyEdaBoardOutline(model, id) {
  const shapes = [];
  const margins = getOutlineMargins(model);
  addEasyEdaRectTrackOnLayer(
    shapes,
    model,
    -margins.left,
    -margins.top,
    (model.cols - 1) * model.pitchMm + margins.right,
    (model.rows - 1) * model.pitchMm + margins.bottom,
    10,
    1,
    id
  );
  return shapes[0];
}

function getEasyEdaPcbBBox(model) {
  const margins = getOutlineMargins(model);
  const p1 = footprintPoint(model, -margins.left, -margins.top);
  const p2 = footprintPoint(model, (model.cols - 1) * model.pitchMm + margins.right, (model.rows - 1) * model.pitchMm + margins.bottom);
  return {
    x: round(Math.min(p1.x, p2.x), 3),
    y: round(Math.min(p1.y, p2.y), 3),
    width: round(Math.abs(p2.x - p1.x), 3),
    height: round(Math.abs(p2.y - p1.y), 3)
  };
}

function addEasyEdaRectTrack(shapes, model, x1Mm, y1Mm, x2Mm, y2Mm, width, id) {
  addEasyEdaRectTrackOnLayer(shapes, model, x1Mm, y1Mm, x2Mm, y2Mm, 3, width, id);
}

function addEasyEdaRectTrackOnLayer(shapes, model, x1Mm, y1Mm, x2Mm, y2Mm, layer, width, id) {
  const left = Math.min(x1Mm, x2Mm);
  const right = Math.max(x1Mm, x2Mm);
  const top = Math.min(y1Mm, y2Mm);
  const bottom = Math.max(y1Mm, y2Mm);
  const p1 = footprintPoint(model, left, top);
  const p2 = footprintPoint(model, right, top);
  const p3 = footprintPoint(model, right, bottom);
  const p4 = footprintPoint(model, left, bottom);
  shapes.push(`TRACK~${width}~${layer}~~${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y} ${p4.x} ${p4.y} ${p1.x} ${p1.y}~${id}`);
}

function generateEasyEdaSymbol(model, startId = 1) {
  let id = startId;
  const nextId = () => `gge${id++}`;
  const geometry = buildEasyEdaSymbolGeometry(model);
  const { body } = geometry;
  const shapes = [
    `R~${body.x}~${body.y}~~~${body.width}~${body.height}~#000000~1~0~none~${nextId()}`,
    `T~N~${body.x + body.width / 2}~${body.y - 14}~0~#000000~~9pt~normal~normal~~comment~${model.name}~1~middle~${nextId()}`,
    `T~P~${body.x + body.width / 2}~${body.y + body.height + 18}~0~#000000~~9pt~normal~normal~~comment~J?~1~middle~${nextId()}`
  ];

  geometry.layout.pins.forEach((pinEntry) => {
    shapes.push(makeEasyEdaPin(pinEntry, geometry, nextId()));
  });

  return {
    docType: "2",
    title: model.name,
    description: "Generated by dupont-grid-footprint-generator",
    head: {
      docType: "2",
      editorVersion: "6.5.22",
      title: model.name,
      description: "Generated by dupont-grid-footprint-generator",
      x: 400,
      y: 300,
      c_para: {
        package: model.name,
        name: model.name,
        pre: "J?",
        spicePre: "",
        Contributor: "LocalWeb"
      }
    },
    canvas: "CA~1200~1200~#FFFFFF~yes~#CCCCCC~10~1200~1200~line~10~pixel~5~400~300",
    shape: shapes,
    dataStr: {}
  };
}

function generateEasyEdaSchematicData(model) {
  return {
    head: {
      docType: "1",
      editorVersion: "6.5.22",
      newgId: true,
      c_para: {
        "Prefix Start": "1"
      }
    },
    canvas: "CA~1200~1200~#FFFFFF~yes~#CCCCCC~10~1200~1200~line~5~pixel~5",
    shape: [generateEasyEdaSchematicLibShape(model, "gge1")],
    colors: {},
    BBox: getEasyEdaSchematicBBox(model)
  };
}

function generateEasyEdaSchematicDocument(model) {
  return {
    docType: "5",
    editorVersion: "6.5.22",
    title: `${model.name}_Schematic`,
    description: "Generated by dupont-grid-footprint-generator",
    colors: {},
    schematics: [
      {
        docType: "1",
        title: "Sheet_1",
        description: "",
        dataStr: JSON.stringify(generateEasyEdaSchematicData(model))
      }
    ]
  };
}

function generateEasyEdaSchematicLibShape(model, id) {
  const symbol = generateEasyEdaSymbol(model, 10);
  const attrs = `package\`${model.name}\`nameAlias\`Model\`Model\`${model.name}\`name\`${model.name}\`pre\`J?\`spicePre\`J`;
  return `LIB~400~300~${attrs}~~0~${id}#@$${symbol.shape.join("#@$")}`;
}

function getEasyEdaSchematicBBox(model) {
  const geometry = buildEasyEdaSymbolGeometry(model);
  return {
    x: round(geometry.body.x - 70, 3),
    y: round(geometry.body.y - 70, 3),
    width: round(geometry.body.width + 140, 3),
    height: round(geometry.body.height + 140, 3)
  };
}

function buildEasyEdaSymbolGeometry(model) {
  const layout = buildSymbolLayout(model);
  const scale = 12;
  const centerX = 400;
  const centerY = 300;
  const bodyHalfW = layout.bodyHalfW * scale;
  const bodyHalfH = layout.bodyHalfH * scale;
  return {
    layout,
    scale,
    centerX,
    centerY,
    body: {
      x: round(centerX - bodyHalfW, 3),
      y: round(centerY - bodyHalfH, 3),
      width: round(bodyHalfW * 2, 3),
      height: round(bodyHalfH * 2, 3)
    }
  };
}

function easyEdaSymbolPoint(geometry, xMm, yMm) {
  return {
    x: round(geometry.centerX + xMm * geometry.scale, 3),
    y: round(geometry.centerY - yMm * geometry.scale, 3)
  };
}

function makeEasyEdaPin(pinEntry, geometry, id) {
  const { pin, side } = pinEntry;
  const { layout, body } = geometry;
  const outside = easyEdaSymbolPoint(geometry, pinEntry.x, pinEntry.y);
  let path;
  let angle;
  let nameX;
  let nameY;
  let nameAnchor;
  let numberX;
  let numberY;
  let numberAnchor;
  let bubbleX;
  let bubbleY;
  let clockPath;

  if (side === "left") {
    const bodyPoint = easyEdaSymbolPoint(geometry, -layout.bodyHalfW, pinEntry.y);
    path = `M ${outside.x} ${outside.y} h ${round(bodyPoint.x - outside.x, 3)}`;
    angle = 180;
    nameX = body.x + 5;
    nameY = outside.y + 4;
    nameAnchor = "start";
    numberX = outside.x + 4;
    numberY = outside.y - 5;
    numberAnchor = "start";
    bubbleX = outside.x + 17;
    bubbleY = outside.y;
    clockPath = `M ${body.x - 6} ${outside.y - 4} L ${body.x - 1} ${outside.y} L ${body.x - 6} ${outside.y + 4}`;
  } else if (side === "right") {
    const bodyPoint = easyEdaSymbolPoint(geometry, layout.bodyHalfW, pinEntry.y);
    path = `M ${outside.x} ${outside.y} h ${round(bodyPoint.x - outside.x, 3)}`;
    angle = 0;
    nameX = body.x + body.width - 5;
    nameY = outside.y + 4;
    nameAnchor = "end";
    numberX = outside.x - 4;
    numberY = outside.y - 5;
    numberAnchor = "end";
    bubbleX = outside.x - 17;
    bubbleY = outside.y;
    clockPath = `M ${body.x + body.width + 6} ${outside.y - 4} L ${body.x + body.width + 1} ${outside.y} L ${body.x + body.width + 6} ${outside.y + 4}`;
  } else if (side === "top") {
    const bodyPoint = easyEdaSymbolPoint(geometry, pinEntry.x, layout.bodyHalfH);
    path = `M ${outside.x} ${outside.y} v ${round(bodyPoint.y - outside.y, 3)}`;
    angle = 270;
    nameX = outside.x;
    nameY = body.y + 12;
    nameAnchor = "middle";
    numberX = outside.x;
    numberY = outside.y + 12;
    numberAnchor = "middle";
    bubbleX = outside.x;
    bubbleY = outside.y + 17;
    clockPath = `M ${outside.x - 4} ${body.y - 6} L ${outside.x} ${body.y - 1} L ${outside.x + 4} ${body.y - 6}`;
  } else {
    const bodyPoint = easyEdaSymbolPoint(geometry, pinEntry.x, -layout.bodyHalfH);
    path = `M ${outside.x} ${outside.y} v ${round(bodyPoint.y - outside.y, 3)}`;
    angle = 90;
    nameX = outside.x;
    nameY = body.y + body.height - 6;
    nameAnchor = "middle";
    numberX = outside.x;
    numberY = outside.y - 8;
    numberAnchor = "middle";
    bubbleX = outside.x;
    bubbleY = outside.y - 17;
    clockPath = `M ${outside.x - 4} ${body.y + body.height + 6} L ${outside.x} ${body.y + body.height + 1} L ${outside.x + 4} ${body.y + body.height + 6}`;
  }

  return [
    `P~show~0~${sanitizeField(pin.number)}~${outside.x}~${outside.y}~${angle}~${id}`,
    `${outside.x}~${outside.y}`,
    `${path}~#880000`,
    `1~${nameX}~${nameY}~0~${sanitizeField(pin.name)}~${nameAnchor}~~9pt`,
    `1~${numberX}~${numberY}~0~${sanitizeField(pin.number)}~${numberAnchor}~~9pt`,
    `0~${bubbleX}~${bubbleY}`,
    `0~${clockPath}`
  ].join("^^");
}

function generateKicadFootprint(model) {
  const lines = [];
  const metrics = getFootprintMetrics(model);
  const { halfW, halfH, leftX, rightX, topY, bottomY } = metrics;
  const partNameText = getPartNameTextPlacement(model);
  lines.push(`(footprint "${model.name}"`);
  lines.push(`  (version 20240108)`);
  lines.push(`  (generator "dupont-grid-local-web")`);
  lines.push(`  (layer "F.Cu")`);
  lines.push(`  (descr "Generated Dupont female header grid")`);
  lines.push(`  (attr through_hole)`);
  lines.push(`  (fp_text reference "J?" (at 0 ${round(topY - 1.5, 3)} 0) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))`);
  lines.push(`  (fp_text value "${model.name}" (at ${partNameText.x} ${partNameText.y} 0) (layer "F.SilkS") (effects (font (size ${round(partNameText.size, 3)} ${round(partNameText.size, 3)}) (thickness ${partNameText.thickness}))))`);
  if (model.includeOutline) {
    lines.push(kicadLine(leftX, topY, rightX, topY, model.silkWidthMm));
    lines.push(kicadLine(rightX, topY, rightX, bottomY, model.silkWidthMm));
    lines.push(kicadLine(rightX, bottomY, leftX, bottomY, model.silkWidthMm));
    lines.push(kicadLine(leftX, bottomY, leftX, topY, model.silkWidthMm));
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
    const pinText = getPinNameSilkPlacement(model, pad);
    if (!pinText) continue;
    const justify = pinText.justify ? ` (justify ${pinText.justify})` : "";
    lines.push(`  (fp_text user "${escapeKicad(pad.name)}" (at ${pinText.x} ${pinText.y} 0) (layer "F.SilkS") (effects (font (size ${round(pinText.size, 3)} ${round(pinText.size, 3)}) (thickness ${pinText.thickness}))${justify}))`);
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
  const layout = buildSymbolLayout(model);
  const bodyHalfH = layout.bodyHalfH;
  const bodyHalfW = layout.bodyHalfW;
  const propertyFontSize = 1;
  const symbolName = escapeKicad(model.name);
  const commonUnitName = escapeKicad(`${model.name}_0_1`);
  const pinUnitName = escapeKicad(`${model.name}_1_1`);
  const lines = [];
  lines.push("(kicad_symbol_lib");
  lines.push("  (version 20211014)");
  lines.push("  (generator \"dupont-grid-local-web\")");
  lines.push(`  (symbol "${symbolName}"`);
  lines.push("    (pin_names (offset 1.016))");
  lines.push("    (exclude_from_sim no)");
  lines.push("    (in_bom yes)");
  lines.push("    (on_board yes)");
  lines.push(`    (property "Reference" "J" (id 0) (at 0 ${round(-bodyHalfH - 1.27, 3)} 0) (effects (font (size ${propertyFontSize} ${propertyFontSize}))))`);
  lines.push(`    (property "Value" "${symbolName}" (id 1) (at 0 ${round(bodyHalfH + 1.27, 3)} 0) (effects (font (size ${propertyFontSize} ${propertyFontSize}))))`);
  lines.push(`    (property "Footprint" "" (id 2) (at 0 0 0) (effects (font (size ${propertyFontSize} ${propertyFontSize})) hide))`);
  lines.push(`    (property "Datasheet" "" (id 3) (at 0 0 0) (effects (font (size ${propertyFontSize} ${propertyFontSize})) hide))`);
  lines.push(`    (symbol "${commonUnitName}"`);
  lines.push(`      (rectangle (start ${-bodyHalfW} ${round(bodyHalfH, 3)}) (end ${bodyHalfW} ${round(-bodyHalfH, 3)}) (stroke (width 0.254) (type default) (color 0 0 0 0)) (fill (type none)))`);
  lines.push("    )");
  lines.push(`    (symbol "${pinUnitName}"`);
  layout.pins.forEach((entry) => {
    lines.push(`      (pin passive line (at ${round(entry.x, 3)} ${entry.y} ${entry.angle}) (length ${layout.pinLength}) (name "${escapeKicad(entry.pin.name)}" (effects (font (size 1.27 1.27)))) (number "${escapeKicad(entry.pin.number)}" (effects (font (size 1.27 1.27)))))`);
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
  if (kind === "kicad-zip") {
    const files = [
      {
        name: `${model.name}.kicad_sym`,
        content: generateKicadSymbol(model)
      },
      {
        name: `${model.name}.pretty/${model.name}.kicad_mod`,
        content: generateKicadFootprint(model)
      }
    ];
    downloadBlob(`${model.name}.kicad-source.zip`, createZipBlob(files), "application/zip");
  }
  if (kind === "lceda-zip") {
    const files = [
      {
        name: `${model.name}_Schematic.json`,
        content: JSON.stringify(generateEasyEdaSchematicDocument(model), null, 2)
      },
      {
        name: `${model.name}_PCB.json`,
        content: JSON.stringify(generateEasyEdaPcbDocument(model), null, 2)
      }
    ];
    downloadBlob(`${model.name}.lceda-standard.zip`, createZipBlob(files), "application/zip");
  }
  if (kind === "lceda-pcb") {
    downloadText(`${model.name}.lceda-pcb.json`, JSON.stringify(generateEasyEdaPcbDocument(model), null, 2), "application/json");
  }
  if (kind === "lceda-schematic") {
    downloadText(`${model.name}.lceda-schematic.json`, JSON.stringify(generateEasyEdaSchematicDocument(model), null, 2), "application/json");
  }
  if (kind === "kicad-mod") {
    downloadText(`${model.name}.kicad_mod`, generateKicadFootprint(model), "text/plain");
  }
  if (kind === "kicad-sym") {
    downloadText(`${model.name}.kicad_sym`, generateKicadSymbol(model), "text/plain");
  }
}

function downloadText(filename, text, type) {
  downloadBlob(filename, new Blob([text], { type: `${type};charset=utf-8` }), type);
}

function downloadBlob(filename, blob, type) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createZipBlob(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const now = new Date();
  const { time, date } = toDosDateTime(now);

  for (const file of files) {
    const filename = file.name.replace(/\\/g, "/");
    const nameBytes = encoder.encode(filename);
    const data = typeof file.content === "string" ? encoder.encode(file.content) : file.content;
    const crc = crc32(data);

    const local = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, time, true);
    localView.setUint16(12, date, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    localParts.push(local, data);

    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, time, true);
    centralView.setUint16(14, date, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);

    offset += local.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}

function toDosDateTime(value) {
  const year = Math.max(1980, value.getFullYear());
  const month = value.getMonth() + 1;
  const day = value.getDate();
  const hours = value.getHours();
  const minutes = value.getMinutes();
  const seconds = Math.floor(value.getSeconds() / 2);
  return {
    time: (hours << 11) | (minutes << 5) | seconds,
    date: ((year - 1980) << 9) | (month << 5) | day
  };
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function createProjectPayload() {
  readSettings();
  return {
    version: 5,
    ...state,
    drawStart: null,
    mode: "select"
  };
}

function saveProject() {
  const payload = createProjectPayload();
  downloadText(`${state.partName}.dupont-grid-project.json`, JSON.stringify(payload, null, 2), "application/json");
}

function applyProjectPayload(payload) {
  if (!payload || !Array.isArray(payload.cells)) throw new Error("项目文件缺少 cells");
  const hasPinNameSilkPosition = Object.prototype.hasOwnProperty.call(payload, "pinNameSilkPosition");
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
  state.outlineMarginMm = nonNegativeNumber(state.outlineMarginMm, 1.27);
  state.outlineCustomMargins = Boolean(state.outlineCustomMargins);
  state.outlineMargins = state.outlineCustomMargins
    ? createOutlineMargins(state.outlineMargins, state.outlineMarginMm)
    : createOutlineMargins({}, state.outlineMarginMm);
  state.nameSilkFontSizeMm = positiveNumber(state.nameSilkFontSizeMm, 1);
  state.pinNameSilkPosition = normalizePinNameSilkPosition(
    hasPinNameSilkPosition ? state.pinNameSilkPosition : (state.includePinNameSilk ? "top" : "none"),
    "none"
  );
  state.pinNameSilkFontSizeMm = normalizePinNameSilkFontSize(state.pinNameSilkFontSizeMm || 0.8);
  state.pinNameSilkOffsetXMm = normalizePinNameSilkOffset(state.pinNameSilkOffsetXMm);
  state.pinNameSilkOffsetYMm = normalizePinNameSilkOffset(state.pinNameSilkOffsetYMm);
  state.includePinNameSilk = state.pinNameSilkPosition !== "none";
  state.symbolRows = normalizeSymbolRows(state.symbolRows || 2);
  state.symbolPinsPerRow = clampIntOrZero(state.symbolPinsPerRow, 1, 200);
  state.symbolMirror = Boolean(state.symbolMirror);
  state.symbolFlip = Boolean(state.symbolFlip);
  state.symbolSidePins = createSymbolSidePins(state.symbolSidePins);
  state.layoutColumns = createLayoutColumns(state.layoutColumns);
  state.cells = normalizeGridCells(state.cells, state.rows, state.cols);
  syncInputsFromState();
  render();
}

function loadProject(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result));
      applyProjectPayload(payload);
    } catch (error) {
      alert(`项目文件无法导入：${error.message}`);
    }
  };
  reader.readAsText(file);
}

function scheduleProjectCacheSave() {
  if (cacheSaveTimer) clearTimeout(cacheSaveTimer);
  cacheSaveTimer = setTimeout(() => {
    cacheSaveTimer = null;
    saveProjectCache();
  }, 250);
}

function saveProjectCache() {
  const payload = createProjectPayload();
  const json = JSON.stringify(payload);
  writeLocalProjectCache(json);
  writeCookieProjectCache(json);
}

function restoreProjectCache() {
  const payload = readCookieProjectCache() || readLocalProjectCache();
  if (!payload) return false;
  try {
    applyProjectPayload(payload);
    return true;
  } catch (error) {
    console.warn("Project cache could not be restored.", error);
    return false;
  }
}

function writeLocalProjectCache(json) {
  try {
    localStorage.setItem(CACHE_LOCAL_STORAGE_KEY, json);
  } catch (error) {
    console.warn("Local project cache could not be written.", error);
  }
}

function readLocalProjectCache() {
  try {
    const json = localStorage.getItem(CACHE_LOCAL_STORAGE_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.warn("Local project cache could not be read.", error);
    return null;
  }
}

function writeCookieProjectCache(json) {
  try {
    const encoded = encodeURIComponent(json);
    const chunks = [];
    for (let index = 0; index < encoded.length; index += CACHE_CHUNK_SIZE) {
      chunks.push(encoded.slice(index, index + CACHE_CHUNK_SIZE));
    }
    deleteCookieProjectCache(chunks.length);
    chunks.forEach((chunk, index) => {
      setCookie(`${CACHE_COOKIE_CHUNK_PREFIX}${index}`, chunk, CACHE_COOKIE_DAYS);
    });
    setCookie(CACHE_COOKIE_META, encodeURIComponent(JSON.stringify({
      version: 2,
      chunks: chunks.length,
      updatedAt: Date.now()
    })), CACHE_COOKIE_DAYS);
  } catch (error) {
    console.warn("Cookie project cache could not be written.", error);
  }
}

function readCookieProjectCache() {
  try {
    const metaText = getCookie(CACHE_COOKIE_META);
    if (!metaText) return null;
    const meta = JSON.parse(decodeURIComponent(metaText));
    const chunkCount = clampInt(meta.chunks, 1, 256);
    let encoded = "";
    for (let index = 0; index < chunkCount; index += 1) {
      const chunk = getCookie(`${CACHE_COOKIE_CHUNK_PREFIX}${index}`);
      if (!chunk) return null;
      encoded += chunk;
    }
    return JSON.parse(decodeURIComponent(encoded));
  } catch (error) {
    console.warn("Cookie project cache could not be read.", error);
    return null;
  }
}

function deleteCookieProjectCache(nextChunkCount = 0) {
  let oldChunkCount = 0;
  try {
    const metaText = getCookie(CACHE_COOKIE_META);
    if (metaText) oldChunkCount = clampInt(JSON.parse(decodeURIComponent(metaText)).chunks, 1, 256);
  } catch {}
  const limit = Math.max(oldChunkCount, nextChunkCount, 64);
  deleteCookie(CACHE_COOKIE_META);
  for (let index = 0; index < limit; index += 1) {
    deleteCookie(`${CACHE_COOKIE_CHUNK_PREFIX}${index}`);
  }
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length) || "";
}

function getCurrentLayoutColumnWidths() {
  return {
    left: dom.appLayout.querySelector(".setup-panel").getBoundingClientRect().width,
    center: dom.appLayout.querySelector(".workspace").getBoundingClientRect().width,
    right: dom.appLayout.querySelector(".inspector-panel").getBoundingClientRect().width
  };
}

function beginColumnResize(event) {
  if (window.matchMedia("(max-width: 1100px)").matches) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.preventDefault();

  const target = event.currentTarget;
  const side = target.dataset.resizer;
  const startX = event.clientX;
  const start = getCurrentLayoutColumnWidths();
  dom.appLayout.classList.add("resizing");
  try {
    target.setPointerCapture(event.pointerId);
  } catch {}

  const onMove = (moveEvent) => {
    const dx = moveEvent.clientX - startX;
    const next = { ...start };
    if (side === "left") {
      const total = start.left + start.center;
      next.left = clampNumber(start.left + dx, MIN_LAYOUT_COLUMNS.left, total - MIN_LAYOUT_COLUMNS.center);
      next.center = total - next.left;
    }
    if (side === "right") {
      const total = start.center + start.right;
      next.center = clampNumber(start.center + dx, MIN_LAYOUT_COLUMNS.center, total - MIN_LAYOUT_COLUMNS.right);
      next.right = total - next.center;
    }
    state.layoutColumns = createLayoutColumns(next);
    applyLayoutColumns();
  };

  const onEnd = () => {
    dom.appLayout.classList.remove("resizing");
    target.removeEventListener("pointermove", onMove);
    target.removeEventListener("pointerup", onEnd);
    target.removeEventListener("pointercancel", onEnd);
    scheduleProjectCacheSave();
  };

  target.addEventListener("pointermove", onMove);
  target.addEventListener("pointerup", onEnd);
  target.addEventListener("pointercancel", onEnd);
}

dom.columnResizers.forEach((resizer) => {
  resizer.addEventListener("pointerdown", beginColumnResize);
});

dom.gridAdjustButtons.forEach((button) => {
  button.addEventListener("click", () => {
    adjustGridEdge(button.dataset.gridEdge, button.dataset.gridAction);
  });
});

[
  dom.rows,
  dom.cols
].forEach((input) => {
  input.addEventListener("input", resizeGridFromInputs);
  input.addEventListener("change", resizeGridFromInputs);
});

dom.enableAll.addEventListener("click", () => setAllCells(true));
dom.disableAll.addEventListener("click", () => setAllCells(false));
dom.autoNumber.addEventListener("click", autoNumberPins);
dom.clearNames.addEventListener("click", clearNames);
dom.useSelectedPinStyle.addEventListener("click", useSelectedPinAsBulkTemplate);
dom.applyPinStyle.addEventListener("click", applyBulkPinNameSilkStyle);
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
  renderSymbolPreview();
  renderPcbPreview();
  renderStats();
  scheduleProjectCacheSave();
});

dom.pinName.addEventListener("input", () => {
  const cell = selectedCell();
  if (!cell) return;
  cell.pinName = sanitizeField(dom.pinName.value);
  renderGrid();
  renderSymbolPreview();
  renderPcbPreview();
  scheduleProjectCacheSave();
});

dom.cellPinNameSilkPosition.addEventListener("change", () => {
  const cell = selectedCell();
  if (!cell) return;
  cell.pinNameSilkPosition = normalizePinNameSilkPosition(dom.cellPinNameSilkPosition.value, state.pinNameSilkPosition);
  renderPcbPreview();
  scheduleProjectCacheSave();
});

dom.cellPinNameSilkFontSize.addEventListener("input", () => {
  const cell = selectedCell();
  if (!cell) return;
  cell.pinNameSilkFontSizeMm = normalizePinNameSilkFontSize(dom.cellPinNameSilkFontSize.value);
  renderPcbPreview();
  scheduleProjectCacheSave();
});

dom.cellPinNameSilkOffsetX.addEventListener("input", () => {
  const cell = selectedCell();
  if (!cell) return;
  cell.pinNameSilkOffsetXMm = normalizePinNameSilkOffset(dom.cellPinNameSilkOffsetX.value);
  renderPcbPreview();
  scheduleProjectCacheSave();
});

dom.cellPinNameSilkOffsetY.addEventListener("input", () => {
  const cell = selectedCell();
  if (!cell) return;
  cell.pinNameSilkOffsetYMm = normalizePinNameSilkOffset(dom.cellPinNameSilkOffsetY.value);
  renderPcbPreview();
  scheduleProjectCacheSave();
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
  dom.nameSilkFontSize,
  dom.pitch,
  dom.pad,
  dom.drill,
  dom.silkWidth,
  dom.outline,
  dom.pinNameSilkPosition,
  dom.pinNameSilkFontSize,
  dom.pinNameSilkOffsetX,
  dom.pinNameSilkOffsetY,
  dom.outlineMargin,
  dom.outlineCustomMargins,
  ...Object.values(dom.outlineMargins),
  dom.symbolRows,
  dom.symbolPinsPerRow,
  dom.symbolMirror,
  dom.symbolFlip,
  ...Object.values(dom.symbolSidePins)
].forEach((input) => {
  input.addEventListener("input", render);
  input.addEventListener("change", render);
});

dom.downloadKicadZip.addEventListener("click", () => exportFile("kicad-zip"));
dom.downloadKicadMod.addEventListener("click", () => exportFile("kicad-mod"));
dom.downloadKicadSym.addEventListener("click", () => exportFile("kicad-sym"));

if (!restoreProjectCache()) {
  syncInputsFromState();
  render();
}

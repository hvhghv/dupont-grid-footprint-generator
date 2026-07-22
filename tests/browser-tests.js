const result = document.createElement("pre");
result.id = "browserTestResult";
result.dataset.status = "running";
result.textContent = "RUNNING";
document.body.appendChild(result);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function setInput(doc, id, value) {
  const input = doc.querySelector(`#${id}`);
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function enableCells(doc, count) {
  for (let index = 0; index < count; index += 1) {
    doc.querySelectorAll(".cell")[index].click();
  }
}

async function run() {
  const app = window;
  const doc = document;
  setInput(doc, "libraryNameInput", "Regression_Library");
  setInput(doc, "partName", "DEVICE_A");
  enableCells(doc, 2);

  app.addWorkspaceDevice();
  setInput(doc, "partName", "DEVICE_B");
  enableCells(doc, 3);

  app.addWorkspaceDevice();
  setInput(doc, "partName", "DEVICE_C");
  enableCells(doc, 4);

  const payload = app.createProjectPayload();
  assert(payload.devices.length === 3, "工作区没有保存三个器件");
  assert(payload.devices.map((device) => device.project.partName).join(",") === "DEVICE_A,DEVICE_B,DEVICE_C", "器件顺序或名称错误");
  assert(new Set(payload.devices.map((device) => device.professional.deviceId)).size === 3, "器件 UUID 重复");
  doc.querySelectorAll(".device-list-item")[0].click();
  assert(doc.querySelector("#partName").value === "DEVICE_A", "切换器件后没有恢复编辑状态");
  const migratedSingleProject = app.normalizeWorkspacePayload(payload.devices[0].project);
  assert(migratedSingleProject.devices.length === 1, "version 5 单器件项目迁移失败");

  const packageData = await app.generateEasyEdaProLibraryPackage(payload, "combined");
  const index = JSON.parse(packageData.files.find((file) => file.name === "device2.json").content);
  assert(Object.keys(index.devices).length === 3, "device2.json 器件数量错误");
  assert(Object.keys(index.symbols).length === 3, "device2.json 符号数量错误");
  assert(Object.keys(index.footprints).length === 3, "device2.json 封装数量错误");
  const elibu = packageData.files.find((file) => file.name.endsWith(".elibu")).content;
  assert((elibu.match(/\"type\":\"LAYER\"/g) || []).length === 270, "LAYER 记录数量错误");
  assert((elibu.match(/\"type\":\"LAYER_PHYS\"/g) || []).length === 24, "LAYER_PHYS 记录数量错误");

  const symbolPackage = await app.generateEasyEdaProLibraryPackage(payload, "symbol");
  const symbolIndex = JSON.parse(symbolPackage.files.find((file) => file.name === "symbol2.json").content);
  assert(Object.keys(symbolIndex.symbols).length === 3, "多器件符号库数量错误");
  const footprintPackage = await app.generateEasyEdaProLibraryPackage(payload, "footprint");
  const footprintIndex = JSON.parse(footprintPackage.files.find((file) => file.name === "footprint2.json").content);
  assert(Object.keys(footprintIndex.footprints).length === 3, "多器件封装库数量错误");

  const storeFile = new File([app.createZipBlob(packageData.files)], "Regression_Library.elibz2");
  const storeImport = await app.readElibz2(storeFile);
  assert(storeImport.workspace.devices.length === 3, "STORE ZIP 往返导入失败");

  const encoder = new TextEncoder();
  const compressedEntries = Object.fromEntries(packageData.files.map((file) => [file.name, encoder.encode(file.content)]));
  const deflateBytes = app.fflate.zipSync(compressedEntries, { level: 6 });
  const deflateFile = new File([deflateBytes], "Regression_Library_Deflate.elibz2");
  const deflateImport = await app.readElibz2(deflateFile);
  assert(deflateImport.workspace.devices.length === 3, "DEFLATE ZIP 导入失败");

  const stableIds = deflateImport.workspace.devices.map((device) => ({ ...device.professional }));
  deflateImport.workspace.devices[1].project.cells[0].pinName = "CHANGED";
  const modifiedPackage = await app.generateEasyEdaProLibraryPackage(deflateImport.workspace, "combined");
  const modifiedManifest = JSON.parse(modifiedPackage.files.find((file) => file.name === "dupont-grid-project.json").content);
  assert(modifiedManifest.workspace.devices.every((device, index) => device.professional.deviceId === stableIds[index].deviceId), "修改后器件 UUID 发生变化");
  assert(modifiedManifest.workspace.devices.every((device, index) => device.professional.symbolId === stableIds[index].symbolId), "修改后符号 UUID 发生变化");
  assert(modifiedManifest.workspace.devices.every((device, index) => device.professional.footprintId === stableIds[index].footprintId), "修改后封装 UUID 发生变化");

  const legacyFiles = packageData.files.filter((file) => file.name !== "dupont-grid-project.json");
  const legacyFile = new File([app.createZipBlob(legacyFiles)], "Regression_Library_Legacy.elibz2");
  const legacyImport = await app.readElibz2(legacyFile);
  assert(legacyImport.workspace.devices.length === 3, "旧格式多器件恢复失败");
  assert(legacyImport.warning, "旧格式恢复没有给出提示");

  const tamperedFiles = packageData.files.map((file) => ({ ...file }));
  const manifestFile = tamperedFiles.find((file) => file.name === "dupont-grid-project.json");
  const tamperedManifest = JSON.parse(manifestFile.content);
  tamperedManifest.workspace.library.name = "TAMPERED";
  manifestFile.content = JSON.stringify(tamperedManifest);
  const tamperedFile = new File([app.createZipBlob(tamperedFiles)], "Tampered.elibz2");
  let rejectedTamperedFile = false;
  try {
    await app.readElibz2(tamperedFile);
  } catch {
    rejectedTamperedFile = true;
  }
  assert(rejectedTamperedFile, "损坏的项目清单没有被拒绝");

  result.dataset.status = "passed";
  result.textContent = "PASSED: workspace migration/switching, all multi-device exports, STORE/DEFLATE import, stable UUIDs, integrity rejection, legacy recovery";
}

run().catch((error) => {
  result.dataset.status = "failed";
  result.textContent = `FAILED: ${error.stack || error.message}`;
});

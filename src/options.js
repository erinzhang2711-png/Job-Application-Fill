(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const app = document.querySelector("#app");
  const sectionNav = document.querySelector("#section-nav");
  const sectionDialog = document.querySelector("#section-dialog");
  const workKey = APPLICATION_FILL_WORK_KEY;
  const internshipKey = APPLICATION_FILL_INTERNSHIP_KEY;
  let profile;
  let locale = "zh";

  const labels = {
    zh: { group: "新增资料", work: "工作经历", internship: "实习经历", addVariant: "新增版本", addRecord: "+ 新增一段经历", record: "第 {n} 段", removeRecord: "删除这一段", addGroup: "添加自定义板块", rename: "改名", deleteGroup: "删除板块", remove: "删除", customGroup: "板块名称", customField: "资料名称", duplicate: "该名称已存在。", deleteConfirm: "确定删除这个板块及其全部资料吗？", version: "版本名称", createSection: "新增板块", basic: "基础资料", repeatable: "多段经历", variant: "多版本经历", basicHint: "一组普通字段，例如证书或联系方式", repeatableHint: "可新增多段完整记录，例如教育或项目经历", variantHint: "可新建不同版本，每个版本可新增多段经历", create: "创建", cancel: "取消", initialVariant: "可替换不同版本" },
    en: { group: "Add field", work: "Work experience", internship: "Internship experience", addVariant: "Add version", addRecord: "+ Add another entry", record: "Entry {n}", removeRecord: "Remove this entry", addGroup: "Add custom section", rename: "Rename", deleteGroup: "Delete section", remove: "Remove", customGroup: "Section name", customField: "Field label", duplicate: "That name already exists.", deleteConfirm: "Delete this section and all of its entries?", version: "Version name", createSection: "Add section", basic: "Basic fields", repeatable: "Multiple entries", variant: "Multiple versions", basicHint: "One set of fields, such as certificates or contact details", repeatableHint: "Add complete entries, such as degrees or projects", variantHint: "Create different versions; each can contain multiple entries", create: "Create", cancel: "Cancel", initialVariant: "Replaceable version" }
  };
  const sectionId = (title) => "section-" + encodeURIComponent(title);
  const escape = (value) => String(value).replace(/[&<>"\x27]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "\x27":"&#39;" })[c]);
  const titleFor = (current, kind) => kind === "work" ? (current.workTitle || labels[locale].work) : (current.internshipTitle || labels[locale].internship);

  function orderedSections(current) {
    const known = new Set();
    const sections = [];
    for (const key of current.sectionOrder) {
      if (known.has(key)) continue;
      if (key === workKey) sections.push({ key, kind: "work", title: titleFor(current, "work") });
      else if (key === internshipKey) sections.push({ key, kind: "internship", title: titleFor(current, "internship") });
      else if (current.repeatableGroups[key]) sections.push({ key, kind: "repeatable", title: key });
      else if (current.variantGroups[key]) sections.push({ key, kind: "variant", title: key });
      else if (current.groups[key]) sections.push({ key, kind: "group", title: key });
      else continue;
      known.add(key);
    }
    for (const key of [...Object.keys(current.groups), ...Object.keys(current.repeatableGroups), ...Object.keys(current.variantGroups)]) if (!known.has(key)) sections.push({ key, kind: current.repeatableGroups[key] ? "repeatable" : current.variantGroups[key] ? "variant" : "group", title: key });
    return sections;
  }

  function fieldRow(collection, key, record, index, entry, variant = "") {
    const data = `data-collection="${collection}" data-key="${escape(key)}" data-record="${record}" data-index="${index}" data-variant="${escape(variant)}"`;
    return `<div class="row"><input data-label ${data} value="${escape(entry[0])}" placeholder="Field label"><input data-value ${data} value="${escape(entry[1])}" placeholder="Value"><button class="delete" data-delete ${data} title="${labels[locale].remove}">×</button></div>`;
  }

  function recordBlock(collection, key, records, record, variant = "") {
    const entries = records[record];
    const data = `data-collection="${collection}" data-key="${escape(key)}" data-record="${record}" data-variant="${escape(variant)}"`;
    return `<div class="record"><div class="record-heading"><h3>${labels[locale].record.replace("{n}", record + 1)}</h3>${records.length > 1 ? `<button data-delete-record ${data}>${labels[locale].removeRecord}</button>` : ""}</div>${entries.map((entry, index) => fieldRow(collection, key, record, index, entry, variant)).join("")}<button class="add" data-add-field ${data}>+ ${labels[locale].group}</button></div>`;
  }

  function controls(key, kind) {
    return `<span class="section-controls"><button data-rename-section="${escape(key)}" data-kind="${kind}">${labels[locale].rename}</button><button data-delete-section="${escape(key)}" data-kind="${kind}">${labels[locale].deleteGroup}</button></span>`;
  }

  function groupSection(section, current) {
    const entries = current.groups[section.key];
    return `<section><div class="section-heading"><h2>${escape(section.title)}</h2>${controls(section.key, "group")}</div>${entries.map((entry, index) => fieldRow("group", section.key, 0, index, entry)).join("")}<button class="add" data-add-field data-collection="group" data-key="${escape(section.key)}" data-record="0" data-variant="">+ ${labels[locale].group}</button></section>`;
  }

  function repeatableSection(section, current) {
    const records = current.repeatableGroups[section.key];
    return `<section><div class="section-heading"><h2>${escape(section.title)}</h2>${controls(section.key, "repeatable")}</div>${records.map((_, record) => recordBlock("repeatable", section.key, records, record)).join("")}<button class="add" data-add-record data-collection="repeatable" data-key="${escape(section.key)}" data-variant="">${labels[locale].addRecord}</button></section>`;
  }

  function variantSection(section, current) {
    const variants = variantStore(section.kind, section.key, current);
    return `<section><div class="section-heading"><h2>${escape(section.title)}</h2>${controls(section.key, section.kind)}</div>${Object.entries(variants).map(([name, records]) => `<div class="variant"><div class="variant-head"><input class="variant-name" data-rename-variant="${escape(name)}" data-kind="${section.kind}" data-key="${escape(section.key)}" value="${escape(name)}" aria-label="Version name"></div>${records.map((_, record) => recordBlock(section.kind, section.key, records, record, name)).join("")}<button class="add" data-add-record data-collection="${section.kind}" data-key="${escape(section.key)}" data-variant="${escape(name)}">${labels[locale].addRecord}</button></div>`).join("")}<p><button class="add" data-new-variant data-kind="${section.kind}" data-key="${escape(section.key)}">+ ${labels[locale].addVariant}</button></p></section>`;
  }

  function render() {
    const current = profile[locale];
    const sections = orderedSections(current);
    app.innerHTML = sections.map((section) => section.kind === "group" ? groupSection(section, current) : section.kind === "repeatable" ? repeatableSection(section, current) : variantSection(section, current)).join("");
    [...app.querySelectorAll("section")].forEach((section, index) => { section.id = sectionId(sections[index].key); });
    sectionNav.innerHTML = sections.map((section) => `<button class="jump" draggable="true" data-section="${escape(section.key)}" data-jump="${sectionId(section.key)}">${escape(section.title)}</button>`).join("") + `<button class="jump add-section" data-new-group>+ ${labels[locale].addGroup}</button>`;
    bindSectionNav();
    document.querySelectorAll("[data-label], [data-value]").forEach((input) => input.addEventListener("input", update));
    document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", removeField));
    document.querySelectorAll("[data-add-field]").forEach((button) => button.addEventListener("click", addField));
    document.querySelectorAll("[data-add-record]").forEach((button) => button.addEventListener("click", addRecord));
    document.querySelectorAll("[data-delete-record]").forEach((button) => button.addEventListener("click", deleteRecord));
    document.querySelectorAll("[data-rename-variant]").forEach((input) => input.addEventListener("change", renameVariant));
    document.querySelectorAll("[data-new-variant]").forEach((button) => button.addEventListener("click", newVariant));
    document.querySelectorAll("[data-rename-section]").forEach((button) => button.addEventListener("click", renameSection));
    document.querySelectorAll("[data-delete-section]").forEach((button) => button.addEventListener("click", deleteSection));
    document.querySelector("[data-new-group]").addEventListener("click", showNewGroupDialog);
  }

  function bindSectionNav() {
    sectionNav.querySelectorAll("[data-jump]").forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.jump)?.scrollIntoView({ behavior: "smooth", block: "start" })));
    sectionNav.querySelectorAll("[data-section]").forEach((button) => {
      button.addEventListener("dragstart", (event) => { event.dataTransfer.setData("text/plain", button.dataset.section); event.dataTransfer.effectAllowed = "move"; button.classList.add("dragging"); });
      button.addEventListener("dragend", () => sectionNav.querySelectorAll(".jump").forEach((item) => item.classList.remove("dragging", "drop-target")));
      button.addEventListener("dragover", (event) => { event.preventDefault(); button.classList.add("drop-target"); });
      button.addEventListener("dragleave", () => button.classList.remove("drop-target"));
      button.addEventListener("drop", (event) => { event.preventDefault(); moveSection(event.dataTransfer.getData("text/plain"), button.dataset.section); });
    });
  }

  function recordsFor(el) {
    const current = profile[locale];
    if (el.dataset.collection === "group") return [current.groups[el.dataset.key]];
    if (el.dataset.collection === "repeatable") return current.repeatableGroups[el.dataset.key];
    return variantStore(el.dataset.collection, el.dataset.key, current)[el.dataset.variant];
  }
  function entriesFor(el) { return recordsFor(el)[Number(el.dataset.record)]; }
  function update(event) { const el = event.target; entriesFor(el)[Number(el.dataset.index)][el.hasAttribute("data-label") ? 0 : 1] = el.value; }
  function removeField(event) { const el = event.currentTarget; entriesFor(el).splice(Number(el.dataset.index), 1); render(); }
  function addField(event) { const el = event.currentTarget; entriesFor(el).push(["", ""]); render(); }
  function addRecord(event) { const el = event.currentTarget; const records = recordsFor(el); records.push(records[0].map(([label]) => [label, ""])); render(); }
  function deleteRecord(event) { const el = event.currentTarget; const records = recordsFor(el); records.splice(Number(el.dataset.record), 1); render(); }
  function variantStore(kind, key, current = profile[locale]) {
    if (kind === "work") return current.workVariants;
    if (kind === "internship") return current.internshipVariants;
    return current.variantGroups[key];
  }
  function renameVariant(event) {
    const oldName = event.target.dataset.renameVariant, newName = event.target.value.trim(), kind = event.target.dataset.kind, variants = variantStore(kind, event.target.dataset.key);
    if (!newName || newName === oldName) return;
    if (variants[newName]) { window.alert(labels[locale].duplicate); event.target.value = oldName; return; }
    const renamed = {}; for (const [name, records] of Object.entries(variants)) renamed[name === oldName ? newName : name] = records;
    if (kind === "work") profile[locale].workVariants = renamed; else if (kind === "internship") profile[locale].internshipVariants = renamed; else profile[locale].variantGroups[event.target.dataset.key] = renamed;
    render();
  }
  function newVariant(event) {
    const name = window.prompt(labels[locale].version)?.trim(), kind = event.currentTarget.dataset.kind, key = event.currentTarget.dataset.key, variants = variantStore(kind, key);
    if (!name || variants[name]) return;
    const template = Object.values(variants)[0]?.[0] || [[labels[locale].customField, ""]];
    variants[name] = [template.map(([label]) => [label, ""])]; render();
  }
  function renameSection(event) {
    const key = event.currentTarget.dataset.renameSection, kind = event.currentTarget.dataset.kind, current = profile[locale];
    if (kind === "work" || kind === "internship") { const name = window.prompt(labels[locale].customGroup, titleFor(current, kind))?.trim(); if (name) current[kind === "work" ? "workTitle" : "internshipTitle"] = name; render(); return; }
    const newName = window.prompt(labels[locale].customGroup, key)?.trim();
    if (!newName || newName === key || current.groups[newName] || current.repeatableGroups[newName] || current.variantGroups[newName]) return;
    const store = kind === "repeatable" ? current.repeatableGroups : kind === "variant" ? current.variantGroups : current.groups;
    store[newName] = store[key]; delete store[key]; current.sectionOrder = current.sectionOrder.map((item) => item === key ? newName : item); render();
  }
  function deleteSection(event) {
    const key = event.currentTarget.dataset.deleteSection, kind = event.currentTarget.dataset.kind, current = profile[locale];
    if (!window.confirm(labels[locale].deleteConfirm)) return;
    if (kind === "work") current.workVariants = {}; else if (kind === "internship") current.internshipVariants = {}; else delete (kind === "repeatable" ? current.repeatableGroups : kind === "variant" ? current.variantGroups : current.groups)[key];
    current.sectionOrder = current.sectionOrder.filter((item) => item !== key); render();
  }
  function showNewGroupDialog() {
    const copy = labels[locale];
    sectionDialog.innerHTML = `<form method="dialog" class="section-form"><h2>${copy.createSection}</h2><label>${copy.customGroup}<input name="title" required autofocus></label><fieldset><legend>${copy.createSection}</legend><label><input type="radio" name="type" value="group" checked><span><strong>${copy.basic}</strong><small>${copy.basicHint}</small></span></label><label><input type="radio" name="type" value="repeatable"><span><strong>${copy.repeatable}</strong><small>${copy.repeatableHint}</small></span></label><label><input type="radio" name="type" value="variant"><span><strong>${copy.variant}</strong><small>${copy.variantHint}</small></span></label></fieldset><div class="dialog-actions"><button value="cancel" class="secondary">${copy.cancel}</button><button value="create">${copy.create}</button></div></form>`;
    sectionDialog.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      if (event.submitter?.value === "cancel") { sectionDialog.close(); return; }
      const form = event.currentTarget, name = new FormData(form).get("title")?.trim(), type = new FormData(form).get("type"), current = profile[locale];
      if (!name) return;
      if (current.groups[name] || current.repeatableGroups[name] || current.variantGroups[name]) { window.alert(copy.duplicate); return; }
      if (type === "repeatable") current.repeatableGroups[name] = [[[copy.customField, ""]]];
      else if (type === "variant") current.variantGroups[name] = { [copy.initialVariant]: [[[copy.customField, ""]]] };
      else current.groups[name] = [[copy.customField, ""]];
      current.sectionOrder.push(name); sectionDialog.close(); render();
    });
    sectionDialog.showModal();
  }
  function moveSection(source, target) {
    if (!source || source === target) return;
    const order = profile[locale].sectionOrder, from = order.indexOf(source), to = order.indexOf(target);
    if (from < 0 || to < 0) return;
    order.splice(from, 1); order.splice(to, 0, source); render();
  }

  document.querySelectorAll("[data-locale]").forEach((button) => button.addEventListener("click", () => { locale = button.dataset.locale; document.querySelectorAll("[data-locale]").forEach((item) => item.classList.toggle("active", item === button)); render(); }));
  document.querySelector("#save").addEventListener("click", async () => { await api.storage.local.set({ applicationFillProfile: profile }); const button = document.querySelector("#save"); button.textContent = "已保存"; setTimeout(() => button.textContent = "保存资料", 1200); });
  document.querySelector("#reset").addEventListener("click", () => { if (window.confirm("恢复为空白模板？现有资料将被替换。")) { profile = structuredClone(APPLICATION_FILL_DEFAULT_PROFILE); render(); } });
  applicationFillProfile().then((value) => { profile = value; document.querySelector("[data-locale=zh]").classList.add("active"); render(); });
})();

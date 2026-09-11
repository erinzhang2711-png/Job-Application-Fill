(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const app = document.querySelector("#app");
  const sectionNav = document.querySelector("#section-nav");
  const internshipKey = "__application_fill_internship__";
  let profile;
  let locale = "zh";

  const labels = {
    zh: { group: "新增资料", internship: "实习经历", addVariant: "新增版本", addGroup: "添加自定义板块", rename: "改名", deleteGroup: "删除板块", remove: "删除", customGroup: "板块名称", customField: "资料名称", duplicate: "该名称已存在。", deleteConfirm: "确定删除这个板块及其全部资料吗？" },
    en: { group: "Add field", internship: "Internship experience", addVariant: "Add version", addGroup: "Add custom section", rename: "Rename", deleteGroup: "Delete section", remove: "Remove", customGroup: "Section name", customField: "Field label", duplicate: "That name already exists.", deleteConfirm: "Delete this section and all of its fields?" }
  };
  const sectionId = (title) => "section-" + encodeURIComponent(title);
  const escape = (value) => String(value).replace(/[&<>"\x27]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "\x27":"&#39;" })[c]);
  const internshipTitle = (current) => current.internshipTitle || labels[locale].internship;

  function orderedSections(current) {
    const order = Array.isArray(current.sectionOrder) ? current.sectionOrder : [...Object.keys(current.groups), internshipKey];
    const known = new Set();
    const sections = [];
    for (const item of order) {
      if (known.has(item)) continue;
      if (item === internshipKey) { sections.push({ key: item, title: internshipTitle(current), internship: true }); known.add(item); }
      else if (current.groups[item]) { sections.push({ key: item, title: item, internship: false }); known.add(item); }
    }
    for (const title of Object.keys(current.groups)) if (!known.has(title)) sections.push({ key: title, title, internship: false });
    return sections;
  }
  function fieldRow(group, index, entry, variant) {
    return `<div class="row"><input data-label data-group="${escape(group)}" data-index="${index}" data-variant="${variant || ""}" value="${escape(entry[0])}" placeholder="Field label"><input data-value data-group="${escape(group)}" data-index="${index}" data-variant="${variant || ""}" value="${escape(entry[1])}" placeholder="Value"><button class="delete" data-delete data-group="${escape(group)}" data-index="${index}" data-variant="${variant || ""}" title="${labels[locale].remove}">×</button></div>`;
  }
  function controls(key, internship) {
    const rename = internship ? "data-rename-internship" : `data-rename-group="${escape(key)}"`;
    const remove = internship ? "data-delete-internship" : `data-delete-group="${escape(key)}"`;
    return `<span class="section-controls"><button ${rename}>${labels[locale].rename}</button><button ${remove}>${labels[locale].deleteGroup}</button></span>`;
  }
  function groupSection(title, entries) {
    return `<section><div class="section-heading"><h2>${escape(title)}</h2>${controls(title, false)}</div><div>${entries.map((entry, index) => fieldRow(title, index, entry, "")).join("")}</div><button class="add" data-add data-group="${escape(title)}">+ ${labels[locale].group}</button></section>`;
  }
  function internshipSection(current) {
    return `<section><div class="section-heading"><h2>${escape(internshipTitle(current))}</h2>${controls(internshipKey, true)}</div>${Object.entries(current.internshipVariants).map(([name, entries]) => `<div class="variant-head"><input class="variant-name" data-rename-variant="${escape(name)}" value="${escape(name)}" aria-label="Version name"></div>${entries.map((entry, index) => fieldRow(name, index, entry, name)).join("")}<button class="add" data-add data-group="${escape(name)}" data-variant="${escape(name)}">+ ${labels[locale].group}</button>`).join("")}<p><button class="add" data-new-variant>+ ${labels[locale].addVariant}</button></p></section>`;
  }
  function render() {
    const current = profile[locale];
    const sections = orderedSections(current);
    app.innerHTML = sections.map((section) => section.internship ? internshipSection(current) : groupSection(section.title, current.groups[section.key])).join("");
    [...app.querySelectorAll("section")].forEach((section, index) => { section.id = sectionId(sections[index].key); });
    sectionNav.innerHTML = sections.map((section) => `<button class="jump" draggable="true" data-section="${escape(section.key)}" data-jump="${sectionId(section.key)}">${escape(section.title)}</button>`).join("") + `<button class="jump add-section" data-new-group>+ ${labels[locale].addGroup}</button>`;
    bindSectionNav();
    document.querySelectorAll("[data-label], [data-value]").forEach((input) => input.addEventListener("input", update));
    document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", removeField));
    document.querySelectorAll("[data-add]").forEach((button) => button.addEventListener("click", addField));
    document.querySelectorAll("[data-rename-variant]").forEach((input) => input.addEventListener("change", renameVariant));
    document.querySelectorAll("[data-rename-group]").forEach((button) => button.addEventListener("click", renameGroup));
    document.querySelectorAll("[data-delete-group]").forEach((button) => button.addEventListener("click", deleteGroup));
    document.querySelectorAll("[data-rename-internship]").forEach((button) => button.addEventListener("click", renameInternship));
    document.querySelectorAll("[data-delete-internship]").forEach((button) => button.addEventListener("click", deleteInternship));
    document.querySelectorAll("[data-new-variant]").forEach((button) => button.addEventListener("click", newVariant));
    document.querySelector("[data-new-group]").addEventListener("click", newGroup);
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
  function moveSection(source, target) {
    if (!source || source === target) return;
    const order = profile[locale].sectionOrder, from = order.indexOf(source), to = order.indexOf(target);
    if (from < 0 || to < 0) return;
    order.splice(from, 1); order.splice(to, 0, source); render();
  }
  function entriesFor(group, variant) { return variant ? profile[locale].internshipVariants[variant] : profile[locale].groups[group]; }
  function update(event) { const el = event.target; entriesFor(el.dataset.group, el.dataset.variant)[Number(el.dataset.index)][el.hasAttribute("data-label") ? 0 : 1] = el.value; }
  function removeField(event) { const el = event.currentTarget; entriesFor(el.dataset.group, el.dataset.variant).splice(Number(el.dataset.index), 1); render(); }
  function addField(event) { const el = event.currentTarget; entriesFor(el.dataset.group, el.dataset.variant).push(["", ""]); render(); }
  function renameVariant(event) {
    const oldName = event.target.dataset.renameVariant, newName = event.target.value.trim();
    if (!newName || newName === oldName) return;
    if (profile[locale].internshipVariants[newName]) { window.alert(labels[locale].duplicate); event.target.value = oldName; return; }
    const renamed = {}; for (const [name, entries] of Object.entries(profile[locale].internshipVariants)) renamed[name === oldName ? newName : name] = entries;
    profile[locale].internshipVariants = renamed; render();
  }
  function newVariant() {
    const name = window.prompt(locale === "zh" ? "版本名称" : "Version name");
    if (!name?.trim() || profile[locale].internshipVariants[name.trim()]) return;
    profile[locale].internshipVariants[name.trim()] = locale === "zh" ? [["公司", ""], ["岗位", ""], ["日期", ""], ["实习描述", ""]] : [["Company", ""], ["Title", ""], ["Dates", ""], ["Description", ""]]; render();
  }
  function newGroup() {
    const name = window.prompt(labels[locale].customGroup)?.trim();
    if (!name) return;
    if (profile[locale].groups[name]) { window.alert(labels[locale].duplicate); return; }
    profile[locale].groups[name] = [[labels[locale].customField, ""]]; profile[locale].sectionOrder.push(name); render();
  }
  function renameGroup(event) {
    const oldName = event.currentTarget.dataset.renameGroup, newName = window.prompt(labels[locale].customGroup, oldName)?.trim();
    if (!newName || newName === oldName) return;
    if (profile[locale].groups[newName]) { window.alert(labels[locale].duplicate); return; }
    const renamed = {}; for (const [name, entries] of Object.entries(profile[locale].groups)) renamed[name === oldName ? newName : name] = entries;
    profile[locale].groups = renamed; profile[locale].sectionOrder = profile[locale].sectionOrder.map((item) => item === oldName ? newName : item); render();
  }
  function deleteGroup(event) {
    const name = event.currentTarget.dataset.deleteGroup;
    if (!window.confirm(labels[locale].deleteConfirm)) return;
    delete profile[locale].groups[name]; profile[locale].sectionOrder = profile[locale].sectionOrder.filter((item) => item !== name); render();
  }
  function renameInternship() { const name = window.prompt(labels[locale].customGroup, internshipTitle(profile[locale]))?.trim(); if (name) { profile[locale].internshipTitle = name; render(); } }
  function deleteInternship() { if (!window.confirm(labels[locale].deleteConfirm)) return; profile[locale].internshipVariants = {}; profile[locale].sectionOrder = profile[locale].sectionOrder.filter((item) => item !== internshipKey); render(); }
  document.querySelectorAll("[data-locale]").forEach((button) => button.addEventListener("click", () => { locale = button.dataset.locale; document.querySelectorAll("[data-locale]").forEach((item) => item.classList.toggle("active", item === button)); render(); }));
  document.querySelector("#save").addEventListener("click", async () => { await api.storage.local.set({ applicationFillProfile: profile }); const button = document.querySelector("#save"); button.textContent = "已保存"; setTimeout(() => button.textContent = "保存资料", 1200); });
  document.querySelector("#reset").addEventListener("click", () => { if (window.confirm("恢复为空白模板？现有资料将被替换。")) { profile = structuredClone(APPLICATION_FILL_DEFAULT_PROFILE); render(); } });
  applicationFillProfile().then((value) => { profile = value; document.querySelector("[data-locale=zh]").classList.add("active"); render(); });
})();

(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const app = document.querySelector("#app");
  const sectionNav = document.querySelector("#section-nav");
  let profile;
  let locale = "zh";

  const labels = {
    zh: { group: "新增资料", internship: "实习经历", addVariant: "新增版本", addGroup: "添加自定义板块", rename: "改名", deleteGroup: "删除板块", remove: "删除", customGroup: "自定义板块名称", customField: "资料名称", duplicate: "该名称已存在。", deleteConfirm: "确定删除这个自定义板块及其全部资料吗？" },
    en: { group: "Add field", internship: "Internship experience", addVariant: "Add version", addGroup: "Add custom section", rename: "Rename", deleteGroup: "Delete section", remove: "Remove", customGroup: "Custom section name", customField: "Field label", duplicate: "That name already exists.", deleteConfirm: "Delete this custom section and all of its fields?" }
  };
  const sectionId = (title) => "section-" + encodeURIComponent(title);
  const escape = (value) => String(value).replace(/[&<>"\x27]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "\x27":"&#39;" })[c]);
  const defaultGroups = () => new Set(Object.keys(APPLICATION_FILL_DEFAULT_PROFILE[locale].groups));
  const isCustomGroup = (title) => !defaultGroups().has(title);

  function fieldRow(group, index, entry, variant) {
    return `<div class="row"><input data-label data-group="${escape(group)}" data-index="${index}" data-variant="${variant || ""}" value="${escape(entry[0])}" placeholder="Field label"><input data-value data-group="${escape(group)}" data-index="${index}" data-variant="${variant || ""}" value="${escape(entry[1])}" placeholder="Value"><button class="delete" data-delete data-group="${escape(group)}" data-index="${index}" data-variant="${variant || ""}" title="${labels[locale].remove}">×</button></div>`;
  }
  function groupSection(title, entries) {
    const controls = isCustomGroup(title) ? `<span class="section-controls"><button data-rename-group="${escape(title)}">${labels[locale].rename}</button><button data-delete-group="${escape(title)}">${labels[locale].deleteGroup}</button></span>` : "";
    return `<section><div class="section-heading"><h2>${escape(title)}</h2>${controls}</div><div>${entries.map((entry, index) => fieldRow(title, index, entry, "")).join("")}</div><button class="add" data-add data-group="${escape(title)}">+ ${labels[locale].group}</button></section>`;
  }
  function internshipSection(current) {
    return `<section><h2>${labels[locale].internship}</h2>${Object.entries(current.internshipVariants).map(([name, entries]) => `<div class="variant-head"><input class="variant-name" data-rename-variant="${escape(name)}" value="${escape(name)}" aria-label="Version name"></div>${entries.map((entry, index) => fieldRow(name, index, entry, name)).join("")}<button class="add" data-add data-group="${escape(name)}" data-variant="${escape(name)}">+ ${labels[locale].group}</button>`).join("")}<p><button class="add" data-new-variant>+ ${labels[locale].addVariant}</button></p></section>`;
  }
  function render() {
    const current = profile[locale];
    const groupTitles = Object.keys(current.groups);
    app.innerHTML = `${groupTitles.map((title) => groupSection(title, current.groups[title])).join("")}${internshipSection(current)}`;
    const internship = [...app.querySelectorAll("section")].find((section) => section.querySelector("h2")?.textContent === labels[locale].internship);
    const educationTitle = locale === "zh" ? "教育经历" : "Education";
    const education = [...app.querySelectorAll("section")].find((section) => section.querySelector("h2")?.textContent === educationTitle);
    const sections = [...app.querySelectorAll("section")];
    groupTitles.forEach((title, index) => { if (sections[index]) sections[index].id = sectionId(title); });
    if (internship) internship.id = sectionId(labels[locale].internship);
    if (education && internship) education.after(internship);
    const navTitles = groupTitles.flatMap((title) => title === educationTitle ? [title, labels[locale].internship] : [title]);
    sectionNav.innerHTML = navTitles.map((title) => `<button class="jump" data-jump="${sectionId(title)}">${escape(title)}</button>`).join("") + `<button class="jump add-section" data-new-group>+ ${labels[locale].addGroup}</button>`;
    sectionNav.querySelectorAll("[data-jump]").forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.jump)?.scrollIntoView({ behavior: "smooth", block: "start" })));
    document.querySelectorAll("[data-label], [data-value]").forEach((input) => input.addEventListener("input", update));
    document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", removeField));
    document.querySelectorAll("[data-add]").forEach((button) => button.addEventListener("click", addField));
    document.querySelectorAll("[data-rename-variant]").forEach((input) => input.addEventListener("change", renameVariant));
    document.querySelectorAll("[data-rename-group]").forEach((button) => button.addEventListener("click", renameGroup));
    document.querySelectorAll("[data-delete-group]").forEach((button) => button.addEventListener("click", deleteGroup));
    document.querySelector("[data-new-variant]").addEventListener("click", newVariant);
    document.querySelector("[data-new-group]").addEventListener("click", newGroup);
  }
  function entriesFor(group, variant) { return variant ? profile[locale].internshipVariants[variant] : profile[locale].groups[group]; }
  function update(event) { const el = event.target; entriesFor(el.dataset.group, el.dataset.variant)[Number(el.dataset.index)][el.hasAttribute("data-label") ? 0 : 1] = el.value; }
  function removeField(event) { const el = event.currentTarget; entriesFor(el.dataset.group, el.dataset.variant).splice(Number(el.dataset.index), 1); render(); }
  function addField(event) { const el = event.currentTarget; entriesFor(el.dataset.group, el.dataset.variant).push(["", ""]); render(); }
  function renameVariant(event) {
    const oldName = event.target.dataset.renameVariant;
    const newName = event.target.value.trim();
    if (!newName || newName === oldName) return;
    if (profile[locale].internshipVariants[newName]) { window.alert(labels[locale].duplicate); event.target.value = oldName; return; }
    const renamed = {};
    for (const [name, entries] of Object.entries(profile[locale].internshipVariants)) renamed[name === oldName ? newName : name] = entries;
    profile[locale].internshipVariants = renamed;
    render();
  }
  function newVariant() {
    const name = window.prompt(locale === "zh" ? "版本名称" : "Version name");
    if (!name?.trim() || profile[locale].internshipVariants[name.trim()]) return;
    profile[locale].internshipVariants[name.trim()] = locale === "zh" ? [["公司", ""], ["岗位", ""], ["日期", ""], ["实习描述", ""]] : [["Company", ""], ["Title", ""], ["Dates", ""], ["Description", ""]];
    render();
  }
  function newGroup() {
    const name = window.prompt(labels[locale].customGroup);
    if (!name?.trim()) return;
    if (profile[locale].groups[name.trim()]) { window.alert(labels[locale].duplicate); return; }
    profile[locale].groups[name.trim()] = [[labels[locale].customField, ""]];
    render();
  }
  function renameGroup(event) {
    const oldName = event.currentTarget.dataset.renameGroup;
    const newName = window.prompt(labels[locale].customGroup, oldName)?.trim();
    if (!newName || newName === oldName) return;
    if (profile[locale].groups[newName]) { window.alert(labels[locale].duplicate); return; }
    const renamed = {};
    for (const [name, entries] of Object.entries(profile[locale].groups)) renamed[name === oldName ? newName : name] = entries;
    profile[locale].groups = renamed;
    render();
  }
  function deleteGroup(event) {
    const name = event.currentTarget.dataset.deleteGroup;
    if (!window.confirm(labels[locale].deleteConfirm)) return;
    delete profile[locale].groups[name];
    render();
  }
  document.querySelectorAll("[data-locale]").forEach((button) => button.addEventListener("click", () => { locale = button.dataset.locale; document.querySelectorAll("[data-locale]").forEach((item) => item.classList.toggle("active", item === button)); render(); }));
  document.querySelector("#save").addEventListener("click", async () => { await api.storage.local.set({ applicationFillProfile: profile }); const button = document.querySelector("#save"); button.textContent = "已保存"; setTimeout(() => button.textContent = "保存资料", 1200); });
  document.querySelector("#reset").addEventListener("click", () => { if (window.confirm("恢复为空白模板？现有资料将被替换。")) { profile = structuredClone(APPLICATION_FILL_DEFAULT_PROFILE); render(); } });
  applicationFillProfile().then((value) => { profile = value; document.querySelector("[data-locale=zh]").classList.add("active"); render(); });
})();

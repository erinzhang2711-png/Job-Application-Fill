(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const app = document.querySelector("#app");
  const sectionNav = document.querySelector("#section-nav");
  let profile;
  let locale = "zh";

  const labels = { zh: { group: "新增资料", variant: "可替换不同版本", addVariant: "新增版本", remove: "删除" }, en: { group: "Add field", variant: "Replaceable versions", addVariant: "Add version", remove: "Remove" } };
  const sectionId = (title) => "section-" + encodeURIComponent(title);
  const escape = (value) => String(value).replace(/[&<>\"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" })[c]);

  function fieldRow(group, index, entry, variant) {
    return `<div class="row"><input data-label data-group="${escape(group)}" data-index="${index}" data-variant="${variant || ""}" value="${escape(entry[0])}" placeholder="Field label"><input data-value data-group="${escape(group)}" data-index="${index}" data-variant="${variant || ""}" value="${escape(entry[1])}" placeholder="Value"><button class="delete" data-delete data-group="${escape(group)}" data-index="${index}" data-variant="${variant || ""}" title="${labels[locale].remove}">×</button></div>`;
  }
  function groupSection(title, entries, variant = "") {
    return `<section><h2>${escape(title)}</h2><div>${entries.map((entry, index) => fieldRow(title, index, entry, variant)).join("")}</div><button class="add" data-add data-group="${escape(title)}" data-variant="${variant}">+ ${labels[locale].group}</button></section>`;
  }
  function render() {
    const current = profile[locale];
    app.innerHTML = `${Object.entries(current.groups).map(([title, entries]) => groupSection(title, entries)).join("")}<section><h2>${labels[locale].variant}</h2>${Object.entries(current.internshipVariants).map(([name, entries]) => `<div class="variant-head"><input class="variant-name" data-rename-variant="${escape(name)}" value="${escape(name)}" aria-label="Version name"></div>${entries.map((entry,index)=>fieldRow(name,index,entry,name)).join("")}<button class="add" data-add data-group="${escape(name)}" data-variant="${escape(name)}">+ ${labels[locale].group}</button>`).join("")}<p><button class="add" data-new-variant>+ ${labels[locale].addVariant}</button></p></section>`;
    const internshipSection = [...app.querySelectorAll("section")].find((section) => section.querySelector("h2")?.textContent === labels[locale].variant);
    const educationSection = [...app.querySelectorAll("section")].find((section) => section.querySelector("h2")?.textContent === (locale === "zh" ? "教育经历" : "Education"));
    const groupTitles = Object.keys(current.groups);
    const allSections = [...app.querySelectorAll("section")];
    groupTitles.forEach((title, index) => { if (allSections[index]) allSections[index].id = sectionId(title); });
    if (internshipSection) internshipSection.id = sectionId(labels[locale].variant);
    if (internshipSection && educationSection) educationSection.after(internshipSection);
    sectionNav.innerHTML = groupTitles.concat(labels[locale].variant).map((title) => "<button class=\"jump\" data-jump=\"" + sectionId(title) + "\">" + escape(title) + "<\/button>").join("");
    sectionNav.querySelectorAll("[data-jump]").forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.jump)?.scrollIntoView({ behavior: "smooth", block: "start" })));
    document.querySelectorAll("[data-label], [data-value]").forEach((input) => input.addEventListener("input", update));
    document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", remove));
    document.querySelectorAll("[data-add]").forEach((button) => button.addEventListener("click", add));
    document.querySelectorAll("[data-rename-variant]").forEach((input) => input.addEventListener("change", renameVariant));
    document.querySelector("[data-new-variant]").addEventListener("click", newVariant);
  }
  function entriesFor(group, variant) { return variant ? profile[locale].internshipVariants[variant] : profile[locale].groups[group]; }
  function update(event) { const el = event.target; entriesFor(el.dataset.group, el.dataset.variant)[Number(el.dataset.index)][el.hasAttribute("data-label") ? 0 : 1] = el.value; }
  function remove(event) { const el = event.currentTarget; entriesFor(el.dataset.group, el.dataset.variant).splice(Number(el.dataset.index), 1); render(); }
  function add(event) { const el = event.currentTarget; entriesFor(el.dataset.group, el.dataset.variant).push(["", ""]); render(); }
  function renameVariant(event) {
    const oldName = event.target.dataset.renameVariant;
    const newName = event.target.value.trim();
    if (!newName || newName === oldName) return;
    if (profile[locale].internshipVariants[newName]) { window.alert("Version name already exists."); event.target.value = oldName; return; }
    const renamed = {};
    for (const [name, entries] of Object.entries(profile[locale].internshipVariants)) renamed[name === oldName ? newName : name] = entries;
    profile[locale].internshipVariants = renamed;
    render();
  }
  function newVariant() {
    const name = window.prompt(locale === "zh" ? "版本名称" : "Version name");
    if (name?.trim() && !profile[locale].internshipVariants[name.trim()]) {
      profile[locale].internshipVariants[name.trim()] = locale === "zh" ? [["公司", ""], ["岗位", ""], ["日期", ""], ["实习描述", ""]] : [["Company", ""], ["Title", ""], ["Dates", ""], ["Description", ""]];
      render();
    }
  }
  document.querySelectorAll("[data-locale]").forEach((button) => button.addEventListener("click", () => { locale = button.dataset.locale; document.querySelectorAll("[data-locale]").forEach((item) => item.classList.toggle("active", item === button)); render(); }));
  document.querySelector("#save").addEventListener("click", async () => { await api.storage.local.set({ applicationFillProfile: profile }); const button = document.querySelector("#save"); button.textContent = "已保存"; setTimeout(() => button.textContent = "保存资料", 1200); });
  document.querySelector("#reset").addEventListener("click", () => { if (window.confirm("恢复为空白模板？现有资料将被替换。")) { profile = structuredClone(APPLICATION_FILL_DEFAULT_PROFILE); render(); } });
  applicationFillProfile().then((value) => { profile = value; document.querySelector('[data-locale="zh"]').classList.add("active"); render(); });
})();

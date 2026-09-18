(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  let activeField = null;
  let visible = false;
  let locale = "zh";
  let profile;
  let host;
  let root;
  let selectedWorkVariant;
  let selectedInternshipVariant;
  const selectedVariants = {};

  const text = {
    zh: { title: "Job Application Fill", selected: "已选择输入框", waiting: "先点击网页中的输入框", edit: "编辑资料", empty: "未填写", work: "工作经历", internship: "实习经历", entry: "第 {n} 段", close: "关闭" },
    en: { title: "Job Application Fill", selected: "Field selected", waiting: "Click a field on this page first", edit: "Edit profile", empty: "Not set", work: "Work experience", internship: "Internship experience", entry: "Entry {n}", close: "Close" }
  };

  function ensurePanel() {
    if (host) return;
    host = document.createElement("div");
    host.id = "application-fill-host";
    document.documentElement.append(host);
    root = host.attachShadow({ mode: "closed" });
  }

  function isFillable(el) {
    if (!(el instanceof HTMLElement) || host?.contains(el)) return false;
    return el.matches("input:not([type=hidden]):not([type=file]), textarea, select, [contenteditable=true], [role=textbox]");
  }

  document.addEventListener("focusin", (event) => { if (isFillable(event.target)) { activeField = event.target; render(); } }, true);

  function dispatchFieldEvent(element, type, value) {
    const eventOptions = { bubbles: true, composed: true };
    if (type === "beforeinput" || type === "input") {
      try {
        element.dispatchEvent(new InputEvent(type, { ...eventOptions, data: String(value), inputType: "insertText" }));
        return;
      } catch {
        // Older browser engines may not expose the InputEvent constructor.
      }
    }
    element.dispatchEvent(new Event(type, eventOptions));
  }

  function focusField(element) {
    try { element.focus({ preventScroll: true }); }
    catch { element.focus(); }
  }

  function nativeSet(element, value) {
    focusField(element);
    dispatchFieldEvent(element, "beforeinput", value);
    if (element instanceof HTMLSelectElement) {
      const wanted = String(value).trim().toLowerCase();
      const option = [...element.options].find((item) => { const candidate = `${item.text} ${item.value}`.trim().toLowerCase(); return candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate); });
      if (!option) return false;
      element.value = option.value;
    } else if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio")) {
      const yes = ["yes", "true", "是", "需要", "同意", "1"].includes(String(value).trim().toLowerCase());
      if (yes !== element.checked) element.click();
      return true;
    } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const prototype = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(element, value);
    } else if (element.isContentEditable || element.getAttribute("role") === "textbox") {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection?.removeAllRanges();
      selection?.addRange(range);
      if (!document.execCommand("insertText", false, String(value))) element.textContent = value;
    } else return false;
    dispatchFieldEvent(element, "input", value);
    dispatchFieldEvent(element, "change", value);
    requestAnimationFrame(() => element.blur());
    return true;
  }

  function fill(value) {
    if (!activeField || !document.contains(activeField) || !value) return;
    const field = activeField;
    if (nativeSet(field, value)) {
      const previousOutline = field.style.outline;
      field.style.outline = "2px solid #4f7cff";
      setTimeout(() => { field.style.outline = previousOutline; }, 900);
    }
  }

  function safe(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]); }
  function cards(entries) {
    if (!Array.isArray(entries)) return "";
    return entries.map(([label, value]) => `<button class="entry" data-value="${safe(value)}" ${value ? "" : "disabled"}><span>${safe(label)}</span><strong>${value ? safe(value) : text[locale].empty}</strong></button>`).join("");
  }
  function recordCards(records) {
    if (!Array.isArray(records)) return "";
    return records.map((entries, index) => `<div class="record"><h3>${text[locale].entry.replace("{n}", index + 1)}</h3>${cards(entries)}</div>`).join("");
  }
  function titleFor(current, kind) { return kind === "work" ? (current.workTitle || text[locale].work) : (current.internshipTitle || text[locale].internship); }
  function variantsFor(current, kind, key) {
    if (kind === "work") return current.workVariants;
    if (kind === "internship") return current.internshipVariants;
    return current.variantGroups[key];
  }

  function orderedPanelSections(current) {
    const sections = [];
    for (const key of current.sectionOrder || []) {
      if (key === APPLICATION_FILL_WORK_KEY && Object.keys(current.workVariants || {}).length) sections.push({ key, kind: "work", title: titleFor(current, "work") });
      else if (key === APPLICATION_FILL_INTERNSHIP_KEY && Object.keys(current.internshipVariants || {}).length) sections.push({ key, kind: "internship", title: titleFor(current, "internship") });
      else if (current.repeatableGroups?.[key]) sections.push({ key, kind: "repeatable", title: key, records: current.repeatableGroups[key] });
      else if (current.variantGroups?.[key] && Object.keys(current.variantGroups[key]).length) sections.push({ key, kind: "variant", title: key });
      else if (current.groups?.[key]) sections.push({ key, kind: "group", title: key, entries: current.groups[key] });
    }
    return sections;
  }

  function variantSection(section, current) {
    const variants = variantsFor(current, section.kind, section.key);
    const saved = section.kind === "work" ? selectedWorkVariant : section.kind === "internship" ? selectedInternshipVariant : selectedVariants[section.key];
    const selected = variants[saved] ? saved : Object.keys(variants)[0];
    if (section.kind === "work") selectedWorkVariant = selected; else if (section.kind === "internship") selectedInternshipVariant = selected; else selectedVariants[section.key] = selected;
    return `<section data-panel-section="${section.key}"><h2>${safe(section.title)}</h2><select class="variant" data-variant-kind="${section.kind}" data-variant-key="${safe(section.key)}">${Object.keys(variants).map((name) => `<option ${name === selected ? "selected" : ""}>${safe(name)}</option>`).join("")}</select>${recordCards(variants[selected])}</section>`;
  }

  function render() {
    if (!visible || !root || !profile) return;
    const scrollTop = root.querySelector(".panel")?.scrollTop || 0;
    const quickNavScrollLeft = root.querySelector(".quick-nav")?.scrollLeft || 0;
    const current = profile[locale];
    const sections = orderedPanelSections(current);
    root.innerHTML = `<style>
      :host { all: initial; } * { box-sizing:border-box; } .panel { position:fixed; z-index:2147483647; top:72px; right:18px; width:340px; max-height:calc(100vh - 92px); overflow:auto; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#172033; background:#fff; border:1px solid #dbe3f0; border-radius:16px; box-shadow:0 18px 50px rgba(20,38,70,.2); padding:16px; } .panel-top { position:sticky; top:-16px; z-index:1; margin:0 -16px 8px; padding:16px 16px 7px; background:#fff; box-shadow:0 8px 12px -14px rgba(20,38,70,.55); } header { display:flex; align-items:center; gap:8px; margin-bottom:12px; } h1 { margin:0 auto 0 0; font-size:16px; } button,select { font:inherit; } .icon,.tab { border:0; background:#eef3ff; color:#284d9b; border-radius:8px; padding:7px 9px; cursor:pointer; } .tab.active { background:#315de9; color:#fff; } .status { padding:9px 10px; border-radius:8px; font-size:12px; margin-bottom:10px; background:${activeField ? "#eaf9f0" : "#fff5e5"}; color:#47605a; } .quick-nav { display:flex; gap:6px; overflow-x:auto; padding:2px 0 6px; scrollbar-width:thin; } .quick-nav button { flex:0 0 auto; border:1px solid #dbe3f0; border-radius:999px; padding:5px 8px; background:#fff; color:#315de9; font-size:11px; cursor:pointer; white-space:nowrap; } .quick-nav button:hover { background:#eef3ff; border-color:#315de9; } section { margin:12px 0; } h2 { font-size:13px; margin:0 0 7px; color:#536278; } h3 { font-size:11px; margin:10px 0 5px; color:#7a879a; } .record + .record { border-top:1px solid #edf0f5; margin-top:12px; padding-top:2px; } .entry { display:block; width:100%; text-align:left; padding:9px 10px; margin:5px 0; border:1px solid #e5e9f1; border-radius:8px; background:#fff; cursor:pointer; } .entry:hover:not(:disabled) { border-color:#315de9; background:#f5f8ff; } .entry:disabled { cursor:not-allowed; opacity:.5; } .entry span,.entry strong { display:block; } .entry span { font-size:12px; color:#637089; margin-bottom:2px; } .entry strong { font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .variant { width:100%; padding:8px; border:1px solid #dbe3f0; border-radius:8px; background:#fff; } .footer { display:flex; justify-content:space-between; gap:8px; padding-top:8px; } .footer button { border:0; background:none; color:#315de9; padding:4px 0; cursor:pointer; font-size:12px; }
    </style><aside class="panel"><div class="panel-top"><header><h1>${text[locale].title}</h1><button class="tab ${locale === "zh" ? "active" : ""}" data-locale="zh">中文</button><button class="tab ${locale === "en" ? "active" : ""}" data-locale="en">EN</button><button class="icon" data-close title="${text[locale].close}">×</button></header><div class="status">${activeField ? text[locale].selected : text[locale].waiting}</div><nav class="quick-nav">${sections.map((section) => `<button data-jump-section="${safe(section.key)}">${safe(section.title)}</button>`).join("")}</nav></div>${sections.map((section) => section.kind === "group" ? `<section data-panel-section="${safe(section.key)}"><h2>${safe(section.title)}</h2>${cards(section.entries)}</section>` : section.kind === "repeatable" ? `<section data-panel-section="${safe(section.key)}"><h2>${safe(section.title)}</h2>${recordCards(section.records)}</section>` : variantSection(section, current)).join("")}<div class="footer"><button data-edit>${text[locale].edit}</button><button data-close>${text[locale].close}</button></div></aside>`;
    root.querySelector(".panel").scrollTop = scrollTop;
    root.querySelector(".quick-nav").scrollLeft = quickNavScrollLeft;
    root.querySelectorAll(".entry").forEach((button) => button.addEventListener("click", () => fill(button.dataset.value)));
    root.querySelectorAll("[data-locale]").forEach((button) => button.addEventListener("click", () => { locale = button.dataset.locale; render(); }));
    root.querySelectorAll("[data-jump-section]").forEach((button) => button.addEventListener("click", () => {
      const panel = root.querySelector(".panel"), panelTop = root.querySelector(".panel-top"), target = root.querySelector(`[data-panel-section="${button.dataset.jumpSection}"]`);
      if (!panel || !panelTop || !target) return;
      panel.scrollTo({ top: Math.max(0, panel.scrollTop + target.getBoundingClientRect().top - panel.getBoundingClientRect().top - panelTop.getBoundingClientRect().height - 8), behavior:"smooth" });
    }));
    root.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => { visible = false; host.remove(); host = null; root = null; }));
    root.querySelector("[data-edit]").addEventListener("click", () => { void api.runtime.sendMessage({ type: "APPLICATION_FILL_OPEN_OPTIONS" }); });
    root.querySelectorAll("[data-variant-kind]").forEach((select) => select.addEventListener("change", () => { if (select.dataset.variantKind === "work") selectedWorkVariant = select.value; else if (select.dataset.variantKind === "internship") selectedInternshipVariant = select.value; else selectedVariants[select.dataset.variantKey] = select.value; render(); }));
  }

  async function toggle() { ensurePanel(); profile = await applicationFillProfile(); visible = !visible; if (visible) render(); else { host.remove(); host = null; root = null; } }
  api.runtime.onMessage.addListener((message) => { if (message?.type === "APPLICATION_FILL_TOGGLE") toggle(); });
})();

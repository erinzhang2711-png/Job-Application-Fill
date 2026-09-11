(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  let activeField = null;
  let visible = false;
  let locale = "zh";
  let profile;
  let host;
  let root;

  const text = {
    zh: { title: "Application Fill", selected: "已选择输入框", waiting: "先点击网页中的输入框", edit: "编辑资料", empty: "未填写", internship: "可替换不同版本", close: "关闭" },
    en: { title: "Application Fill", selected: "Field selected", waiting: "Click a field on this page first", edit: "Edit profile", empty: "Not set", internship: "Replaceable versions", close: "Close" }
  };

  function ensurePanel() {
    if (host) return;
    host = document.createElement("div");
    host.id = "application-fill-host";
    document.documentElement.append(host);
    root = host.attachShadow({ mode: "open" });
  }

  function isFillable(el) {
    if (!(el instanceof HTMLElement) || host?.contains(el)) return false;
    return el.matches("input:not([type=hidden]):not([type=file]), textarea, select, [contenteditable=true], [role=textbox]");
  }

  document.addEventListener("focusin", (event) => {
    if (isFillable(event.target)) {
      activeField = event.target;
      render();
    }
  }, true);

  function nativeSet(element, value) {
    if (element instanceof HTMLSelectElement) {
      const wanted = String(value).trim().toLowerCase();
      const option = [...element.options].find((item) => {
        const candidate = `${item.text} ${item.value}`.trim().toLowerCase();
        return candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate);
      });
      if (!option) return false;
      element.value = option.value;
    } else if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio")) {
      const yes = ["yes", "true", "是", "需要", "同意", "1"].includes(String(value).trim().toLowerCase());
      if (yes !== element.checked) element.click();
      return true;
    } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const prototype = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
      setter?.call(element, value);
    } else if (element.isContentEditable || element.getAttribute("role") === "textbox") {
      element.textContent = value;
    } else return false;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function fill(value) {
    if (!activeField || !document.contains(activeField)) return;
    if (!value) return;
    const success = nativeSet(activeField, value);
    if (success) {
      activeField.style.outline = "2px solid #4f7cff";
      setTimeout(() => { if (activeField) activeField.style.outline = ""; }, 900);
    }
  }

  function safe(textValue) {
    return String(textValue).replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
  }

  function cards(entries) {
    return entries.map(([label, value]) => `
      <button class="entry" data-value="${safe(value)}" ${value ? "" : "disabled"}>
        <span>${safe(label)}</span><strong>${value ? safe(value) : text[locale].empty}</strong>
      </button>`).join("");
  }

  function render() {
    if (!visible || !root || !profile) return;
    const current = profile[locale];
    const variants = Object.keys(current.internshipVariants);
    const selectedVariant = root.querySelector("select[data-variant]")?.value || variants[0];
    root.innerHTML = `<style>
      :host { all: initial; } * { box-sizing: border-box; } .panel { position: fixed; z-index: 2147483647; top: 72px; right: 18px; width: 340px; max-height: calc(100vh - 92px); overflow: auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color:#172033; background:#fff; border:1px solid #dbe3f0; border-radius:16px; box-shadow:0 18px 50px rgba(20,38,70,.2); padding:16px; }
      header { display:flex; align-items:center; gap:8px; margin-bottom:12px; } h1 { margin:0 auto 0 0; font-size:16px; } button, select { font:inherit; } .icon, .tab { border:0; background:#eef3ff; color:#284d9b; border-radius:8px; padding:7px 9px; cursor:pointer; } .tab.active { background:#315de9; color:white; } .status { padding:9px 10px; border-radius:8px; font-size:12px; margin-bottom:12px; background:${activeField ? "#eaf9f0" : "#fff5e5"}; color:#47605a; } section { margin:12px 0; } h2 { font-size:13px; margin:0 0 7px; color:#536278; } .entry { display:block; width:100%; text-align:left; padding:9px 10px; margin:5px 0; border:1px solid #e5e9f1; border-radius:8px; background:white; cursor:pointer; } .entry:hover:not(:disabled) { border-color:#315de9; background:#f5f8ff; } .entry:disabled { cursor:not-allowed; opacity:.5; } .entry span, .entry strong { display:block; } .entry span { font-size:12px; color:#637089; margin-bottom:2px; } .entry strong { font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .variant { width:100%; padding:8px; border:1px solid #dbe3f0; border-radius:8px; background:white; } .footer { display:flex; justify-content:space-between; gap:8px; padding-top:8px; } .footer button { border:0; background:none; color:#315de9; padding:4px 0; cursor:pointer; font-size:12px; }
    </style><aside class="panel"><header><h1>${text[locale].title}</h1><button class="tab ${locale === "zh" ? "active" : ""}" data-locale="zh">中文</button><button class="tab ${locale === "en" ? "active" : ""}" data-locale="en">EN</button><button class="icon" data-close title="${text[locale].close}">×</button></header><div class="status">${activeField ? text[locale].selected : text[locale].waiting}</div>${Object.entries(current.groups).map(([name, entries]) => `<section><h2>${safe(name)}</h2>${cards(entries)}</section>`).join("")}<section><h2>${text[locale].internship}</h2><select class="variant" data-variant>${variants.map((name) => `<option ${name === selectedVariant ? "selected" : ""}>${safe(name)}</option>`).join("")}</select><div id="variant-cards">${cards(current.internshipVariants[selectedVariant])}</div></section><div class="footer"><button data-edit>${text[locale].edit}</button><button data-close>${text[locale].close}</button></div></aside>`;
    const internshipSection = [...root.querySelectorAll("section")].find((section) => section.querySelector("h2")?.textContent === text[locale].internship);
    const educationSection = [...root.querySelectorAll("section")].find((section) => section.querySelector("h2")?.textContent === (locale === "zh" ? "教育经历" : "Education"));
    if (internshipSection && educationSection) educationSection.after(internshipSection);
    root.querySelectorAll(".entry").forEach((button) => button.addEventListener("click", () => fill(button.dataset.value)));
    root.querySelectorAll("[data-locale]").forEach((button) => button.addEventListener("click", () => { locale = button.dataset.locale; render(); }));
    root.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => { visible = false; host.remove(); host = null; root = null; }));
    root.querySelector("[data-edit]").addEventListener("click", () => api.runtime.openOptionsPage());
    root.querySelector("[data-variant]").addEventListener("change", render);
  }

  async function toggle() {
    ensurePanel();
    profile = await applicationFillProfile();
    visible = !visible;
    if (visible) render(); else { host.remove(); host = null; root = null; }
  }

  api.runtime.onMessage.addListener((message) => {
    if (message?.type === "APPLICATION_FILL_TOGGLE") toggle();
  });
})();

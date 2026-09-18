const applicationFillApi = globalThis.browser ?? globalThis.chrome;

async function applicationFillOpenOptionsPage() {
  if (typeof applicationFillApi.runtime.openOptionsPage === "function") {
    await applicationFillApi.runtime.openOptionsPage();
    return;
  }
  await applicationFillApi.tabs.create({ url: applicationFillApi.runtime.getURL("options.html") });
}

applicationFillApi.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await applicationFillApi.tabs.sendMessage(tab.id, { type: "APPLICATION_FILL_TOGGLE" });
  } catch {
    // Browser-internal pages and pages without a content script cannot host the panel.
  }
});

applicationFillApi.runtime.onMessage.addListener((message) => {
  if (message?.type === "APPLICATION_FILL_OPEN_OPTIONS") return applicationFillOpenOptionsPage();
});

const applicationFillApi = globalThis.browser ?? globalThis.chrome;

applicationFillApi.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await applicationFillApi.tabs.sendMessage(tab.id, { type: "APPLICATION_FILL_TOGGLE" });
  } catch {
    // Browser-internal pages and pages without a content script cannot host the panel.
  }
});

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const source = `${fs.readFileSync("src/profile.js", "utf8")}\nglobalThis.storageCall = applicationFillStorageCall;`;

function loadStorage(storage) {
  const context = { browser: { runtime: {}, storage: { local: storage } }, clearTimeout, console, setTimeout, structuredClone };
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return context.storageCall;
}

test("supports callback and Promise storage implementations", async () => {
  for (const usePromise of [false, true]) {
    let value;
    const storage = {
      get(key, callback) {
        const result = { [key]: value };
        if (usePromise) return Promise.resolve(result);
        callback(result);
      },
      set(items, callback) {
        value = items.applicationFillProfile;
        if (usePromise) return Promise.resolve();
        callback();
      }
    };
    const storageCall = loadStorage(storage);
    await storageCall("set", { applicationFillProfile: { usePromise } });
    assert.deepEqual(await storageCall("get", "applicationFillProfile"), { applicationFillProfile: { usePromise } });
  }
});

test("rejects a stalled storage operation and permits a later retry", async () => {
  let calls = 0;
  const storageCall = loadStorage({
    set(items, callback) {
      calls += 1;
      if (calls > 1) callback(items);
    }
  });
  await assert.rejects(storageCall("set", { first: true }, 5), /写入超时/);
  await storageCall("set", { second: true }, 5);
  assert.equal(calls, 2);
});

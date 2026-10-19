import * as localApi from './localApi.js';

const hasAppsScriptRuntime = () => (
  typeof google !== 'undefined' &&
  google.script &&
  google.script.run
);

const isLocalMode = () => !hasAppsScriptRuntime();

export const callAppsScript = (functionName, args = []) => new Promise((resolve, reject) => {
  if (isLocalMode()) {
    const localFunction = localApi[functionName];
    if (typeof localFunction !== 'function') {
      reject(new Error(`Fungsi lokal belum tersedia: ${functionName}`));
      return;
    }
    Promise.resolve(localFunction(...args)).then(resolve).catch(reject);
    return;
  }

  google.script.run
    .withSuccessHandler(resolve)
    .withFailureHandler(reject)[functionName](...args);
});

export { hasAppsScriptRuntime, isLocalMode };

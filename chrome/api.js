export function chromiumAPI(api = globalThis.chrome) {
  return {
    action: {
      setBadgeBackgroundColor: (details) =>
        api.action.setBadgeBackgroundColor(details),
      setBadgeText: (details) => api.action.setBadgeText(details)
    },
    commands: {
      onCommand: api.commands.onCommand,
      getAll: () => api.commands.getAll(),
      openShortcutSettings: () => api.tabs.create({
        url: "chrome://extensions/shortcuts"
      })
    },
    i18n: {
      getMessage: (name) => api.i18n.getMessage(name)
    },
    runtime: {
      getURL: (path) => api.runtime.getURL(path),
      sendNativeMessage: (host, request) =>
        api.runtime.sendNativeMessage(host, request)
    },
    storage: {
      local: {
        get: (defaults) => api.storage.local.get(defaults),
        set: (values) => api.storage.local.set(values)
      }
    },
    tabs: {
      query: (query) => api.tabs.query(query)
    }
  };
}

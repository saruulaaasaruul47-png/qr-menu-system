export function route(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new Event('popstate'))
}

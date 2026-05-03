export function setPageTitle(title) {
  document.title = import.meta.env.DEV ? `[Dev] ${title}` : title;
}

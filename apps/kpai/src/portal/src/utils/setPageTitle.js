export function setPageTitle(title, description) {
  document.title = import.meta.env.DEV ? `[Dev] ${title}` : title;
  if (description) {
    const tag = document.querySelector('meta[name="description"]');
    if (tag) tag.setAttribute("content", description);
  }
}

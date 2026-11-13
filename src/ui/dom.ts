export function mustEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
}

export function setActive(selector: string, predicate: (el: HTMLElement) => boolean) {
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    el.classList.toggle("active", predicate(el));
  });
}

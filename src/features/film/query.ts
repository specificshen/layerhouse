/** `?film=1` or `?film=true` starts the film after warmup. */
export function filmAutostart(params: URLSearchParams): boolean {
  const value = params.get("film");
  return value === "1" || value === "true";
}

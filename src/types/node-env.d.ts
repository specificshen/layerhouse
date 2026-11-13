/**
 * Production builds pass `--define __LAYERHOUSE_DEV__=false`.
 * `bun dev` leaves the name undeclared, which is the development path.
 */
declare const __LAYERHOUSE_DEV__: boolean | undefined;

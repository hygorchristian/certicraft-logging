export type PropertyTypes<T> = {
  [K in keyof T]: T[K];
}[keyof T];

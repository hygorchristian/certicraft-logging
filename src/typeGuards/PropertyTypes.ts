// TODO import this from another local package once the types are separated from our main app.
export type PropertyTypes<T> = {
  [K in keyof T]: T[K];
}[keyof T];

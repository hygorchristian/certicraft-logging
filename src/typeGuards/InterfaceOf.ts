export type InterfaceOf<T extends object> = {
  [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends object
    ? InterfaceOf<T[K]>
    : T[K];
};

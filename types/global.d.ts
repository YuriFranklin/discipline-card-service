type Optional<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] };

type ConvertType<T, M extends Record<keyof T, keyof TypeMapping>> = {
  [P in keyof T]: P extends keyof M ? M[P] : T[P];
};

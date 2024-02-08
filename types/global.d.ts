type Optional<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] };

type ConvertType<T, M extends Record<keyof T, keyof TypeMapping>> = {
  [P in keyof T]: P extends keyof M ? M[P] : T[P];
};

type NumericRange<
  START_ARR extends number[],
  END extends number,
  ACC extends number = never
> = START_ARR["length"] extends END
  ? ACC | END
  : NumericRange<[...START_ARR, 1], END, ACC | START_ARR["length"]>;

type CreateArrayWithLengthX<
  LENGTH extends number,
  ACC extends unknown[] = []
> = ACC["length"] extends LENGTH
  ? ACC
  : CreateArrayWithLengthX<LENGTH, [...ACC, 1]>;

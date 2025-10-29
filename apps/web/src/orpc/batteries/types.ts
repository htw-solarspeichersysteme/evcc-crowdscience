export type BatteryMetaData = Record<
  string,
  Record<string, { value: string | number | boolean; lastUpdate: Date }>
>;

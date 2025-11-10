export type ChartTopicConfig = Record<
  string,
  {
    label: string;
    fields: Record<
      string,
      {
        label: string;
        unit: string;
      }
    >;
  }
>;

export const possibleChartTopicsConfig: ChartTopicConfig = {
  pv: {
    label: "PV",
    fields: {
      power: {
        label: "Power",
        unit: "W",
      },
      energy: {
        label: "Energy",
        unit: "Wh",
      },
      excessDCPower: {
        label: "Excess DC Power",
        unit: "W",
      },
    },
  },
  battery: {
    label: "Battery",
    fields: {
      power: {
        label: "Power",
        unit: "W",
      },
      soc: {
        label: "SOC",
        unit: "%",
      },
      energy: {
        label: "Energy",
        unit: "Wh",
      },
    },
  },
  loadpoints: {
    label: "Load Point",
    fields: {
      chargePower: {
        label: "Charge Power",
        unit: "W",
      },
      chargeCurrents: {
        label: "Charge Currents",
        unit: "kW",
      },
      chargeDuration: {
        label: "Charge Duration",
        unit: "seconds",
      },
    },
  },
};

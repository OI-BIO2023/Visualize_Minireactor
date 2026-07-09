export const IDENT_DEFAULT = 'MI';

export const REACTORS = ['R1', 'R2', 'R3', 'R4'] as const;
export type ReactorId = (typeof REACTORS)[number];

export const REACTOR_INDEX: Record<ReactorId, number> = {
  R1: 1,
  R2: 2,
  R3: 3,
  R4: 4
};

export const GASES = ['CO', 'CO2', 'O2', 'CH4', 'F_Absaugung'] as const;
export type GasKey = (typeof GASES)[number];

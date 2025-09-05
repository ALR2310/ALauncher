export const loaderTypeToName: Record<number, string> = { 1: 'forge', 4: 'fabric', 5: 'quilt', 6: 'neoforge' };
export const loaderTypeToId: Record<string, number> = { forge: 1, fabric: 4, quilt: 5, neoforge: 6 };

export const relationTypeToName: Record<number, string> = {
  1: 'embedded',
  2: 'optional',
  3: 'required',
  4: 'tool',
  5: 'incompatible',
  6: 'include',
};
export const relationTypeToId: Record<string, number> = {
  embedded: 1,
  optional: 2,
  required: 3,
  tool: 4,
  incompatible: 5,
  include: 6,
};

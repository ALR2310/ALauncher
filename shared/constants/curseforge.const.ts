import { invertObject } from '@shared/utils/general.utils';

export const SORT_FIELD = {
  Featured: 1,
  Popularity: 2,
  'Last Updated': 3,
  Name: 4,
  Author: 5,
  'Total Downloads': 6,
  Category: 7,
  'Game Version': 8,
  'Early Access': 9,
  'Featured Released': 10,
  'Released Date': 11,
  Rating: 12,
} as const;

export const MOD_LOADER = {
  Any: 0,
  Forge: 1,
  Cauldron: 2,
  LiteLoader: 3,
  Fabric: 4,
  Quilt: 5,
  NeoForge: 6,
} as const;

export const CATEGORY_CLASS = {
  Mods: 6,
  'Resource Packs': 12,
  'Shader Packs': 6552,
  'Data Packs': 6945,
  Worlds: 17,
  Modpacks: 4471,
  Customization: 4546,
  Addons: 4559,
  'Bukkit Plugins': 5,
} as const;

export const CATEGORY_CLASS_REVERSED = invertObject(CATEGORY_CLASS);

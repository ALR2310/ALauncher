export interface GetMinecraftVersion {
  id: number;
  gameVersionId: number;
  versionString: string;
  jarDownloadUrl: string;
  jsonDownloadUrl: string;
  approved: boolean;
  dateModified: string;
  gameVersionTypeId: number;
  gameVersionStatus: number;
  gameVersionTypeStatus: number;
}

export interface GetVersionLoader {
  name: string;
  gameVersion: string;
  latest: boolean;
  recommended: boolean;
  dateModified: string;
  type: number;
}

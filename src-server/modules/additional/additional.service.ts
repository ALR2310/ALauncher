import { AdditionalQuery, AdditionalResponse } from '@shared/schema/additional.schema';

import { curseForgeService } from '../curseforge/curseforge.service';

class AdditionalService {
  async searchMods(params: AdditionalQuery) {
    const {
      classId,
      categoryIds,
      gameVersion,
      searchFilter,
      sortField,
      modLoaderType,
      slug,
      index = 0,
      pageSize = 50,
    } = params;

    const response = await curseForgeService.searchMods({
      gameId: 432,
      classId,
      categoryIds,
      gameVersion,
      searchFilter,
      sortField,
      modLoaderType,
      slug,
      index: index * pageSize,
      pageSize,
      sortOrder: 'desc',
    });

    return {
      data: response.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        link: item.links.websiteUrl,
        summary: item.summary,
        downloadCount: item.downloadCount,
        authors: item.authors,
        logoUrl: item.logo.url,
        dateCreated: item.dateCreated,
        dateModified: item.dateModified,
        dateReleased: item.dateReleased,
      })),
      pagination: response.pagination,
    } as AdditionalResponse;
  }
}

export const additionalService = new AdditionalService();

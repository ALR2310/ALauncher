export const ROUTES = {
  ROOT: '/',
  HOME: '/',
  LIBRARY: '/library',
  LIBRARY_DETAIL: (id: string) => `/library/${id}`,
  DISCOVER: '/discover',
  DISCOVER_DETAIL: (slug: string) => `/discover/${slug}`,
  DISCOVER_DETAIL_GALLERY: (slug: string) => `/discover/${slug}/gallery`,
  DISCOVER_DETAIL_FILES: (slug: string) => `/discover/${slug}/files`,
} as const;

export const ROUTES = {
  ROOT: '/',
  HOME: '/',
  LIBRARY: '/library',
  LIBRARY_DETAIL: (id: string) => `/library/${id}`,
  DISCOVER: '/discover',
  DISCOVER_DETAIL: (id: string) => `/discover/${id}`,
} as const;

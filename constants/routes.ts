export const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  topic: (slug: string) => `/topic/${slug}`,
  quiz: (slug: string) => `/mcq/${slug}`,
  authCallback: '/callback',
};

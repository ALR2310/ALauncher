class RouteBuilder {
  constructor(public readonly path: string) {}

  toString() {
    return this.path;
  }

  valueOf() {
    return this.path;
  }
}

class LibraryRoutes extends RouteBuilder {
  detail(id: string) {
    return `${this.path}/${id}`;
  }
}

class DiscoverRoutes extends RouteBuilder {
  detail(slug: string) {
    return `${this.path}/${slug}`;
  }

  gallery(slug: string) {
    return `${this.path}/${slug}/gallery`;
  }

  files(slug: string) {
    return `${this.path}/${slug}/files`;
  }
}

export const ROUTES = {
  root: '/',
  home: new RouteBuilder('/'),
  library: new LibraryRoutes('library'),
  discover: new DiscoverRoutes('discover'),
};

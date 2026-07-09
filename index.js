const SPA_ROUTES = new Set(['/', '/history']);

const assetFetch = async (request, env) => {
  if (env?.ASSETS?.fetch) {
    return env.ASSETS.fetch(request);
  }
  return new Response('Asset binding unavailable', { status: 500 });
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/.netlify/functions/')) {
      return new Response('API not available on this deployment surface', { status: 404 });
    }

    if (SPA_ROUTES.has(url.pathname)) {
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      return assetFetch(indexRequest, env);
    }

    const response = await assetFetch(request, env);
    if (response.status !== 404) {
      return response;
    }

    const indexRequest = new Request(new URL('/index.html', request.url), request);
    return assetFetch(indexRequest, env);
  }
};

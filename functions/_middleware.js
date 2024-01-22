// /functions/redirect.js

const ResdigitaisSitemapPaths = [
  "/post-sitemap1.xml",
  "/post-sitemap2.xml",
  "/page-sitemap.xml",
  "/trilha-sitemap.xml",
  "/web-story-sitemap.xml",
  "/tools-sitemap.xml",
  "/category-sitemap.xml",
  "/categories-sitemap.xml",
  "/post_funnel-sitemap.xml",
  "/funnel-sitemap.xml",
  "/theme-sitemap.xml",
  "/format-sitemap.xml",
  "/comarketing-sitemap.xml",
];

export async function onRequest(context) {
  const { request } = context;
  const worker = "https://cf-pages-test-6sn.pages.dev";
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (isMediaFile(pathname)) {
    return handleMediaRequest(pathname);
  } else if (pathname.includes(".xml")) {
    return handleSitemapRequest(pathname);
  } else {
    return handleOtherRequests(request, pathname, worker);
  }
}

function isMediaFile(pathname) {
  return pathname.match(/\.(jpg|png|gif|jpeg)$/);
}

async function handleMediaRequest(pathname) {
  const mediaUrl = `https://resultadosdigitais.com.br${pathname}`;
  try {
    const response = await fetch(mediaUrl);
    return forwardResponse(response);
  } catch (error) {
    return errorResponse(mediaUrl, error);
  }
}

async function handleSitemapRequest(pathname) {
  const sitemapUrl = getSitemapUrl(pathname);
  try {
    const response = await fetch(sitemapUrl);
    let sitemap = await response.text();
    sitemap = updateSitemapUrls(sitemap, pathname);
    return new Response(sitemap, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch (error) {
    return errorResponse(sitemapUrl, error);
  }
}

function getSitemapUrl(pathname) {
  if (ResdigitaisSitemapPaths.includes(pathname)) {
    return `https://www.resultadosdigitais.com.br${pathname}`;
  }
  return pathname.startsWith("/blog-sitemap.xml")
    ? `https://www.resultadosdigitais.com.br/sitemap.xml`
    : `https://www.rdstation.com${pathname}`;
}

function updateSitemapUrls(sitemap, pathname) {
  // Substitui URLs do RD Station pelo seu proxy
  sitemap = sitemap.replace(
    /https:\/\/www\.rdstation\.com/g,
    "https://cf-pages-test-6sn.pages.dev"
  );

  // Verifica se o pathname está na lista de sitemaps específicos do blog
  if (ResdigitaisSitemapPaths.includes(pathname)) {
    // Substitui URLs específicas do blog por URLs do seu proxy para o blog
    sitemap = sitemap.replace(
      /https:\/\/resultadosdigitais.com.br/g,
      "https://cf-pages-test-6sn.pages.dev/blog"
    );
  }

  // Adiciona um sitemap extra se o pathname for sitemap_index.xml
  if (pathname.includes("sitemap_index.xml")) {
    const extraSitemap = `
      <sitemap>
        <loc>https://cf-pages-test-6sn.pages.dev/blog-sitemap.xml</loc>
        <lastmod>2023-08-09T10:55:00-03:00</lastmod>
      </sitemap>
    `;
    // Insere o sitemap extra antes do fechamento da tag sitemapindex
    sitemap = sitemap.replace(
      "</sitemapindex>",
      `${extraSitemap}</sitemapindex>`
    );
  }

  return sitemap;
}

async function handleOtherRequests(request, pathname, worker) {
  const targetUrl = getTargetUrl(pathname, worker);
  try {
    const response = await fetch(targetUrl, request);
    return forwardResponse(response);
  } catch (error) {
    return errorResponse(targetUrl, error);
  }
}

function getTargetUrl(pathname, worker) {
  const formattedPathname = pathname.replace(/^\/blog(\/|$)/, "$1");
  if (pathname.startsWith("/blog")) {
    return `https://resultadosdigitais.com.br${formattedPathname}`;
  }
  return `https://www.rdstation.com${formattedPathname}`;
}

function forwardResponse(response) {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

function errorResponse(url, error) {
  return new Response(`Erro ao acessar ${url}: ${error.message}`, {
    status: 500,
  });
}

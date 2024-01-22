// Definição de constantes
const WORKER_URL = "https://cf-pages-test-6sn.pages.dev";
const RD_BASE_URL = "https://resultadosdigitais.com.br";
const RD_STATION_BASE_URL = "https://www.rdstation.com";

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (isMediaFile(pathname)) {
    return handleMediaRequest(pathname);
  }

  if (pathname.includes(".xml")) {
    return handleSitemapRequest(pathname);
  }

  if (shouldRedirectBlogPath(pathname)) {
    return redirectBlogPath(pathname, url);
  }

  return handleDefaultRequest(pathname, url, request);
}

function isMediaFile(pathname) {
  return (
    pathname.startsWith("/blog") && pathname.match(/\.(jpg|png|gif|jpeg)$/)
  );
}

async function handleMediaRequest(pathname) {
  const newMediaUrl = `${RD_BASE_URL}${formatBlogPath(pathname)}`;
  return fetchAndReturnResponse(newMediaUrl);
}

function shouldRedirectBlogPath(pathname) {
  return pathname.startsWith("/blog") && !pathname.endsWith("/");
}

function redirectBlogPath(pathname, url) {
  const newUrl = `${WORKER_URL}${pathname}/${url.search}${url.hash}`;
  return Response.redirect(newUrl, 301);
}

function formatBlogPath(pathname) {
  return pathname.replace(/^\/blog(\/|$)/, "$1");
}

async function handleDefaultRequest(pathname, url, originalRequest) {
  const targetUrl = getTargetUrl(pathname, url);
  const modifiedRequest = createModifiedRequest(targetUrl, originalRequest);

  try {
    let response = await fetch(modifiedRequest);
    return await handleResponseRedirection(response, pathname);
  } catch (error) {
    return new Response(`Erro ao acessar ${targetUrl}: ${error.message}`, {
      status: 500,
    });
  }
}

function getTargetUrl(pathname, url) {
  const formattedPathname = formatBlogPath(pathname);
  if (pathname.startsWith("/blog")) {
    return `${RD_BASE_URL}${formattedPathname}${url.search}${url.hash}`;
  } else {
    return `${RD_STATION_BASE_URL}${formattedPathname}${url.search}${url.hash}`;
  }
}

function createModifiedRequest(targetUrl, originalRequest) {
  return new Request(targetUrl, {
    method: originalRequest.method,
    headers: originalRequest.headers,
    body: originalRequest.body,
    redirect: "manual",
  });
}

async function handleResponseRedirection(response, pathname) {
  if (response.status === 301) {
    const newLocation = response.headers.get("Location");
    if (newLocation === RD_STATION_BASE_URL) {
      return Response.redirect(WORKER_URL, 301);
    }

    if (pathname.startsWith("/blog")) {
      const formattedPathname = formatBlogPath(pathname);
      if (newLocation !== formattedPathname) {
        return Response.redirect(`${WORKER_URL}/blog${newLocation}`, 301);
      }
    } else {
      let newLocationUrl = new URL(newLocation);
      let newPathname = newLocationUrl.pathname;

      const formattedPathname = formatBlogPath(pathname);
      if (newLocation !== formattedPathname) {
        return Response.redirect(`${WORKER_URL}${newPathname}`, 301);
      }
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

async function fetchAndReturnResponse(url) {
  try {
    const response = await fetch(url);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    return new Response(`Erro ao acessar ${url}: ${error.message}`, {
      status: 500,
    });
  }
}

async function handleSitemapRequest(pathname) {
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

  let sitemapUrl = "";

  if (ResdigitaisSitemapPaths.includes(pathname)) {
    sitemapUrl = `${RD_BASE_URL}${pathname}`;
  } else {
    sitemapUrl = pathname.startsWith("/blog-sitemap.xml")
      ? `${RD_BASE_URL}/sitemap.xml`
      : `${RD_STATION_BASE_URL}${pathname}`;
  }

  try {
    const response = await fetch(sitemapUrl);
    let sitemap = await response.text();

    sitemap = modifySitemapContent(sitemap, pathname);

    return new Response(sitemap, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch (error) {
    return new Response(`Erro ao acessar ${sitemapUrl}: ${error.message}`, {
      status: 500,
    });
  }
}

function modifySitemapContent(sitemap, pathname) {
  // Substituições comuns
  sitemap = sitemap.replace(/https:\/\/www\.rdstation\.com/g, WORKER_URL);

  if (ResdigitaisSitemapPaths.includes(pathname)) {
    sitemap = sitemap.replace(
      /https:\/\/resultadosdigitais.com.br/g,
      `${WORKER_URL}/blog`
    );
  } else {
    sitemap = sitemap.replace(
      /https:\/\/resultadosdigitais.com.br/g,
      WORKER_URL
    );
  }

  sitemap = sitemap.replace(/<\?xml-stylesheet.*\?>/i, "");

  // Adição do sitemap extra para sitemap_index.xml
  if (pathname.includes("sitemap_index.xml")) {
    const extraSitemap = `
      <sitemap>
        <loc>${WORKER_URL}/blog-sitemap.xml</loc>
        <lastmod>2023-08-09T10:55:00-03:00</lastmod>
      </sitemap>
    `;
    sitemap = sitemap.replace(
      "</sitemapindex>",
      `${extraSitemap}</sitemapindex>`
    );
  }

  return sitemap;
}

// Outras funções auxiliares aqui, se necessário
// ...

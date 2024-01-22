// /functions/redirect.js
export async function onRequest(context) {
  const { request } = context;
  const worker = "https://cf-pages-test-6sn.pages.dev";
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.includes(".xml")) {
    return handleSitemapRequest(pathname);
  }

  const oldPagesPathname = ["/teste", "/teste2"];

  if (pathname.startsWith("/blog") && !pathname.endsWith("/")) {
    const newUrl = `${worker}${pathname}/${url.search}${url.hash}`;
    return Response.redirect(newUrl, 301);
  }

  const formattedPathname = pathname.replace(/^\/blog(\/|$)/, "$1");

  let targetUrl;

  if (pathname.startsWith("/blog")) {
    targetUrl = `https://resultadosdigitais.com.br${formattedPathname}${url.search}${url.hash}`;
  } else {
    targetUrl = `https://www.rdstation.com${formattedPathname}${url.search}${url.hash}`;
  }

  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: "manual",
  });

  try {
    let response = await fetch(modifiedRequest);

    if (response.status === 301) {
      const newLocation = response.headers.get("Location");
      if (newLocation === "https://www.rdstation.com") {
        return Response.redirect(`${worker}`, 301);
      }

      if (pathname.startsWith("/blog")) {
        if (newLocation !== formattedPathname) {
          return Response.redirect(`${worker}/blog${newLocation}`, 301);
        }
      } else {
        let newLocationUrl = new URL(newLocation);
        let newPathname = newLocationUrl.pathname;

        if (newLocation !== formattedPathname) {
          return Response.redirect(`${worker}${newPathname}`, 301);
        }
      }
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
      },
    });
  } catch (error) {
    return new Response(`Erro ao acessar ${targetUrl}: ${error.message}`, {
      status: 500,
    });
  }
}

async function handleSitemapRequest(pathname) {
  const sitemapUrl = pathname.startsWith("/blog-sitemap.xml")
    ? `https://resultadosdigitais.com.br${pathname}`
    : `https://www.rdstation.com${pathname}`;
  const response = await fetch(sitemapUrl);
  let sitemap = await response.text();

  sitemap = pathname.startsWith("/blog-sitemap.xml")
    ? sitemap.replace(
        /https:\/\/resultadosdigitais.com.br/g,
        "https://cf-pages-test-6sn.pages.dev"
      )
    : sitemap.replace(
        /https:\/\/www\.rdstation\.com/g,
        "https://cf-pages-test-6sn.pages.dev/blog"
      );

  sitemap = sitemap.replace(/<\?xml-stylesheet.*\?>/i, "");

  // Adiciona o sitemap extra se o pathname for sitemap_index.xml
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

  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}

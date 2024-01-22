// /functions/redirect.js

export async function onRequest(context) {
  const { request } = context;
  const worker = "https://cf-pages-test-6sn.pages.dev";
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Verifica se a URL é de um arquivo de mídia (como .jpg, .png, .gif)
  if (pathname.startsWith("/blog") && pathname.match(/\.(jpg|png|gif|jpeg)$/)) {
    // Construa a nova URL para a mídia
    const newMediaUrl = `https://resultadosdigitais.com.br${pathname.replace(
      /^\/blog(\/|$)/,
      "$1"
    )}`;

    // Realiza a requisição para a URL da mídia
    try {
      const mediaResponse = await fetch(newMediaUrl);
      // Retorna a resposta da mídia
      return new Response(mediaResponse.body, {
        status: mediaResponse.status,
        statusText: mediaResponse.statusText,
        headers: mediaResponse.headers,
      });
    } catch (error) {
      return new Response(`Erro ao acessar ${newMediaUrl}: ${error.message}`, {
        status: 500,
      });
    }
  }

  if (pathname.includes(".xml")) {
    return handleSitemapRequest(pathname);
  }

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
    sitemapUrl = `https://www.resultadosdigitais.com.br${pathname}`;
  } else {
    sitemapUrl = pathname.startsWith("/blog-sitemap.xml")
      ? `https://www.resultadosdigitais.com.br/sitemap.xml`
      : `https://www.rdstation.com${pathname}`;
  }

  const response = await fetch(sitemapUrl);
  let sitemap = await response.text();

  sitemap = sitemap.replace(
    /https:\/\/www\.rdstation\.com/g,
    "https://cf-pages-test-6sn.pages.dev"
  );

  if (ResdigitaisSitemapPaths.includes(pathname)) {
    sitemap = sitemap.replace(
      /https:\/\/resultadosdigitais.com.br/g,
      "https://cf-pages-test-6sn.pages.dev/blog"
    );
  } else {
    sitemap = sitemap.replace(
      /https:\/\/resultadosdigitais.com.br/g,
      "https://cf-pages-test-6sn.pages.dev"
    );
  }

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

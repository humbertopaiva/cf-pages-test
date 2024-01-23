// /functions/redirect.js
const WORKER_HOSTNAME = "https://cf-pages-test-6sn.pages.dev";
const RESDIGITAIS_HOSTNAME = "https://resultadosdigitais.com.br";
const RDSTATION_HOSTNAME = "https://www.rdstation.com";

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  await handleSitemapMediaResquest();
  await handleSitemapRequest(pathname);
  handleBlogTrailingSlashRedirect();

  // if (pathname.includes(".xml")) {
  //   return handleSitemapRequest(pathname);
  // }

  // if (pathname.startsWith("/blog") && !pathname.endsWith("/")) {
  //   const newUrl = `${WORKER_HOSTNAME}${pathname}/${url.search}${url.hash}`;
  //   return Response.redirect(newUrl, 301);
  // }

  const formattedPathname = pathname.replace(/^\/blog(\/|$)/, "$1");
  let targetUrl;

  if (pathname.startsWith("/blog")) {
    targetUrl = `${RESDIGITAIS_HOSTNAME}${formattedPathname}${url.search}${url.hash}`;
  } else {
    targetUrl = `${RDSTATION_HOSTNAME}${formattedPathname}${url.search}${url.hash}`;
  }

  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: "manual",
  });

  await handleRedirect301(modifiedRequest, targetUrl);

  // try {
  //   let response = await fetch(modifiedRequest);

  //   if (response.status === 301) {
  //     const newLocation = response.headers.get("Location");

  //     if (newLocation === `${RDSTATION_HOSTNAME}`) {
  //       return Response.redirect(`${WORKER_HOSTNAME}`, 301);
  //     }

  //     if (newLocation === `${RESDIGITAIS_HOSTNAME}/`) {
  //       return Response.redirect(`${WORKER_HOSTNAME}/blog`, 301);
  //     }

  //     if (pathname.startsWith("/blog")) {
  //       if (newLocation !== formattedPathname) {
  //         return Response.redirect(
  //           `${WORKER_HOSTNAME}/blog${newLocation}`,
  //           301
  //         );
  //       }
  //     } else {
  //       let newLocationUrl = new URL(newLocation);
  //       let newPathname = newLocationUrl.pathname;

  //       if (newLocation !== formattedPathname) {
  //         return Response.redirect(`${WORKER_HOSTNAME}${newPathname}`, 301);
  //       }
  //     }
  //   }

  //   return new Response(response.body, {
  //     status: response.status,
  //     statusText: response.statusText,
  //     headers: {
  //       ...response.headers,
  //     },
  //   });
  // } catch (error) {
  //   return new Response(`Erro ao acessar ${targetUrl}: ${error.message}`, {
  //     status: 500,
  //   });
  // }
}

async function handleSitemapRequest(pathname) {
  if (pathname.includes(".xml")) {
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
      sitemapUrl = `${RESDIGITAIS_HOSTNAME}${pathname}`;
    } else {
      sitemapUrl = pathname.startsWith("/blog-sitemap.xml")
        ? `${RESDIGITAIS_HOSTNAME}/sitemap.xml`
        : `${RDSTATION_HOSTNAME}${pathname}`;
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

    if (pathname.includes("sitemap_index.xml")) {
      const extraSitemap = `
        <sitemap>
          <loc>https://cf-pages-test-6sn.pages.dev/blog-sitemap.xml</loc>
          <lastmod>2023-08-09T10:55:00-03:00</lastmod>
        </sitemap>
      `;

      sitemap = sitemap.replace(
        "</sitemapindex>",
        `${extraSitemap}</sitemapindex>`
      );
    }

    return new Response(sitemap, {
      headers: { "Content-Type": "application/xml" },
    });
  }
}

async function handleSitemapMediaResquest() {
  // Verifica se a URL é de um arquivo de mídia (como .jpg, .png, .gif)
  if (pathname.startsWith("/blog") && pathname.match(/\.(jpg|png|gif|jpeg)$/)) {
    // Construa a nova URL para a mídia
    const newMediaUrl = `${RESDIGITAIS_HOSTNAME}${pathname.replace(
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
}

function handleBlogTrailingSlashRedirect() {
  if (pathname.startsWith("/blog") && !pathname.endsWith("/")) {
    const newUrl = `${WORKER_HOSTNAME}${pathname}/${url.search}${url.hash}`;
    return Response.redirect(newUrl, 301);
  }
}

async function handleRedirect301(request, targetUrl) {
  try {
    let response = await fetch(request);

    if (response.status === 301) {
      const newLocation = response.headers.get("Location");

      if (newLocation === `${RDSTATION_HOSTNAME}`) {
        return Response.redirect(`${WORKER_HOSTNAME}`, 301);
      }

      if (newLocation === `${RESDIGITAIS_HOSTNAME}/`) {
        return Response.redirect(`${WORKER_HOSTNAME}/blog`, 301);
      }

      if (pathname.startsWith("/blog")) {
        if (newLocation !== formattedPathname) {
          return Response.redirect(
            `${WORKER_HOSTNAME}/blog${newLocation}`,
            301
          );
        }
      } else {
        let newLocationUrl = new URL(newLocation);
        let newPathname = newLocationUrl.pathname;

        if (newLocation !== formattedPathname) {
          return Response.redirect(`${WORKER_HOSTNAME}${newPathname}`, 301);
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

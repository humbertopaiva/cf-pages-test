const WORKER_HOSTNAME = "https://cf-pages-test-6sn.pages.dev";
const RESDIGITAIS_HOSTNAME = "https://resultadosdigitais.com.br";
const RDSTATION_HOSTNAME = "https://www.rdstation.com";

const OLD_STACK_PAGES = [
  "/",
  "/produtos/marketing/",
  "/cases-de-sucesso/",
  "/contato/crm/",
  "/contato/marketing/",
  "/contato/outros-assuntos/",
  "/parceiros/agencias-parceiras/",
  "/parceiros/afiliados/",
  "planos/crm/gratuito/",
  "/planos/marketing/encontre-seu-plano-ideal/",
  "/planos/crm/encontre-seu-plano-ideal/",
  "/plataforma/",
  "/produtos/crm/gestao/equipe-comercial/",
  "/produtos/crm/vendas/automacao/",
  "/produtos/crm/vendas/campos-obrigatorios-por-etapa/",
  "/produtos/crm/vendas/funil-de-vendas/",
  "/produtos/crm/vendas/vender-pelo-whatsapp/",
  "/produtos/crm/integracoes/",
  "/trabalhe-conosco/",
];

function isSitemapRequest(pathname) {
  return pathname.includes("xml");
}

function isleMediaRequest(pathname) {
  return pathname.match(/\.(jpg|png|gif|jpeg)$/);
}

function isPageRequest(isSitemapRequest, isMediaRequest) {
  return !isSitemapRequest && !isMediaRequest;
}

function isBlogRequest(pathname) {
  return pathname.startsWith("/blog");
}

function isOldStackPage(pathname) {
  return OLD_STACK_PAGES.includes(pathname);
}

function doRedirect(isBlog, response, type) {
  const newLocation = response.headers.get("Location");
  const formattedPathname = pathname.replace(/^\/blog(\/|$)/, "$1");

  //Retorna para a home de RD Station
  if (newLocation === `${RDSTATION_HOSTNAME}`) {
    return Response.redirect(`${WORKER_HOSTNAME}`, type);
  }

  //Retorna para a home de RD Station Blog
  if (newLocation === `${RESDIGITAIS_HOSTNAME}/`) {
    return Response.redirect(`${WORKER_HOSTNAME}/blog`, type);
  }

  if (isBlog) {
    if (newLocation !== formattedPathname) {
      return Response.redirect(`${WORKER_HOSTNAME}/blog${newLocation}`, type);
    }
  } else {
    const newLocationUrl = new URL(newLocation);
    const newPathname = newLocationUrl.pathname;

    if (newLocation !== formattedPathname) {
      return Response.redirect(`${WORKER_HOSTNAME}${newPathname}`, 301);
    }
  }
}

function getPageCurrentStackResponse() {
  return new Response(pathname);
}

function getPageOldStackResponse(pathname) {
  return new Response();
}

function getModifiedRequest(userRequest) {
  let targetUrl = "";
  const formattedPathname = pathname.replace(/^\/blog(\/|$)/, "$1");
  const request = userRequest;
  const { search, hash } = request.urlRequest;

  if (userRequest.isBlog) {
    targetUrl = `${RESDIGITAIS_HOSTNAME}${formattedPathname}${search}${hash}`;
  } else {
    targetUrl = `${RDSTATION_HOSTNAME}${formattedPathname}${search}${hash}`;
  }

  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: "manual",
  });

  return modifiedRequest;
}

function getUserRequestData(pathname, request) {
  const isSitemap = isSitemapRequest(pathname);
  const isMedia = isleMediaRequest(pathname);
  const isPage = isPageRequest(isSitemap, isPage);
  const isBlog = isBlogRequest(pathname);
  const requestData = request;
  const urlRequest = new URL(request.url);
  const trailingSlash = pathname.endsWith("/");

  const userRequest = {
    isSitemap,
    isMedia,
    isPage,
    isBlog,
    requestData,
    urlRequest,
    trailingSlash,
  };

  return userRequest;
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  const userRequest = getUserRequestData(pathname, request);

  if (userRequest.isSitemap) {
    return handleSitemapResponse(pathname);
  }

  if (userRequest.isMedia) {
    return handleMediaResponse(pathname, userRequest);
  }

  try {
    const response = await fetch(getModifiedRequest(userRequest));

    if (response.status === 301) {
      doRedirect(userRequest.isBlog, response, 301);
    }

    if (response.status === 302) {
      doRedirect(userRequest.isBlog, response, 302);
    }

    if (isOldStackPage(pathname)) {
      getPageOldStackResponse(pathname);
    } else {
      getPageCurrentStackResponse(pathname);
    }
  } catch (error) {
    return new Response(`Erro ao acessar ${targetUrl}: ${error.message}`, {
      status: 500,
    });
  }

  //   // Retira o path blog da URL feita na requisição para trazer as informações do site RD
  //   const formattedPathname = pathname.replace(/^\/blog(\/|$)/, "$1");

  //   let targetUrl;

  //   if (pathname.startsWith("/blog")) {
  //     targetUrl = `${RESDIGITAIS_HOSTNAME}${formattedPathname}${url.search}${url.hash}`;
  //   } else {
  //     targetUrl = `${RDSTATION_HOSTNAME}${formattedPathname}${url.search}${url.hash}`;
  //   }

  //   const modifiedRequest = new Request(targetUrl, {
  //     method: request.method,
  //     headers: request.headers,
  //     body: request.body,
  //     redirect: "manual",
  //   });

  //   try {
  //     let response = await fetch(modifiedRequest);

  //     if (response.status === 301) {
  //       const newLocation = response.headers.get("Location");

  //       if (newLocation === `${RDSTATION_HOSTNAME}`) {
  //         return Response.redirect(`${WORKER_HOSTNAME}`, 301);
  //       }

  //       if (newLocation === `${RESDIGITAIS_HOSTNAME}/`) {
  //         return Response.redirect(`${WORKER_HOSTNAME}/blog`, 301);
  //       }

  //       if (pathname.startsWith("/blog")) {
  //         if (newLocation !== formattedPathname) {
  //           return Response.redirect(
  //             `${WORKER_HOSTNAME}/blog${newLocation}`,
  //             301
  //           );
  //         }
  //       } else {
  //         let newLocationUrl = new URL(newLocation);
  //         let newPathname = newLocationUrl.pathname;

  //         if (newLocation !== formattedPathname) {
  //           return Response.redirect(`${WORKER_HOSTNAME}${newPathname}`, 301);
  //         }
  //       }
  //     } else {
  //       if (
  //         !OLD_STACK_PAGES.includes(pathname) &&
  //         !pathname.startsWith("/blog")
  //       ) {
  //         return await context.next();
  //       }

  //       return new Response(response.body, {
  //         status: response.status,
  //         statusText: response.statusText,
  //         headers: {
  //           ...response.headers,
  //         },
  //       });
  //     }
  //   } catch (error) {
  //     return new Response(`Erro ao acessar ${targetUrl}: ${error.message}`, {
  //       status: 500,
  //     });
  //   }
}

async function handleSitemapResponse(pathname) {
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

async function handleMediaResponse(pathname, userRequest) {
  let newMediaUrl = "";

  if (userRequest.isBlog) {
    newMediaUrl = `${RESDIGITAIS_HOSTNAME}${pathname.replace(
      /^\/blog(\/|$)/,
      "$1"
    )}`;
  } else {
    newMediaUrl = `${RDSTATION_HOSTNAME}`;
  }

  try {
    const mediaResponse = await fetch(newMediaUrl);
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

async function handleResponse(userRequest) {
  const modifiedRequest = getModifiedResponse(userRequest);
  let response = await fetch(modifiedRequest);

  try {
    const mediaResponse = await fetch(newMediaUrl);
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

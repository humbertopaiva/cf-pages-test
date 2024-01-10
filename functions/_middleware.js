// /functions/redirect.js
export async function onRequest(context) {
  const { request } = context;
  const worker = "https://www.zakaya.delivery";
  const url = new URL(request.url);
  let pathname = url.pathname;

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

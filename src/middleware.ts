import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

const PROXY_URL = process.env.PROXY_URL || "http://localhost:3000";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/js/")) {
    return;
  }

  const cookieStore = cookies();
  const origin = cookieStore.get("iframe-proxy-origin")?.value;

  console.log("iframe-proxy-origin:", origin);

  // Get URL from path
  const path = request.nextUrl.pathname;
  const urlString = path.slice(1);

  // If no URL, return 404
  if (!urlString) return new NextResponse(null, { status: 404 });

  let url: URL;

  try {
    url = new URL(urlString);
  } catch (error) {
    if (!origin) {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    try {
      url = new URL(urlString, origin);
    } catch (error) {
      return new NextResponse("Invalid URL", { status: 400 });
    }
  }

  console.log("Fetching URL:", url.toString());

  const headers = {
    "user-agent": request.headers.get("user-agent") || "",
    "accept-language": request.headers.get("accept-language") || "",
    "accept-encoding": request.headers.get("accept-encoding") || "",
    accept: request.headers.get("accept") || "",
    "cache-control": request.headers.get("cache-control") || "",
    referer: url.origin + "/",
  };

  console.log(headers);

  const response = await fetch(url.toString(), { headers });

  // If not OK, return response with status code and text
  if (!response.ok) {
    return new NextResponse(null, {
      status: response.status,
      statusText: response.statusText,
    });
  }

  const responseHeaders = new Headers(response.headers);
  // Remove x-frame-options header and add CORS header
  responseHeaders.delete("x-frame-options");
  responseHeaders.set("access-control-allow-origin", "*");

  // If content type is HTML replace all relative URLs with absolute URLs
  if (responseHeaders.get("content-type")?.includes("text/html")) {
    let html = await response.text();

    // Add head tags for base and original URL
    const tags = `<meta name="original-url" content="${url.toString()}">`;
    html = html.replace(/<head[^>]*>/, (match) => `${match}${tags}`);

    // Add script tags to the end of the body
    const scriptTag = '<script src="/js/inject.js"></script>';
    html = html.replace("</body>", `${scriptTag}</body>`);

    // Set the cookie to the origin
    responseHeaders.set(
      "set-cookie",
      `iframe-proxy-origin=${url.origin}; Path=/; SameSite=None; Secure`
    );

    return new NextResponse(html, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

import { match } from "assert";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROXY_URL = process.env.PROXY_URL || "http://localhost:3000";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/js/")) {
    return;
  }

  // Get URL from path
  const path = request.nextUrl.pathname;
  const urlString = path.slice(1);

  // If no URL, return 404
  if (!urlString) return new NextResponse(null, { status: 404 });

  let url: URL;

  try {
    url = new URL(urlString);
  } catch (error) {
    return new NextResponse("Invalid URL", { status: 400 });
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

    // Add base tag to the head
    const baseTag = `<base href="${PROXY_URL}/${url.origin}/">`;
    html = html.replace(/<head[^>]*>/, (match) => `${match}${baseTag}`);

    html = html.replace(/(href|src|srcset)="([^"]*)"/g, (match, p1, p2) => {
      if (p2.startsWith(url.origin)) {
        return `${PROXY_URL}/${match}`;
      }

      if (p2.startsWith("/")) {
        return `${p1}="${PROXY_URL}/${url.origin + p2}"`;
      }

      return match;
    });

    // Replace all relative URLs in styles with absolute URLs
    html = html.replace(/url\("?([^)]*)"?\)/g, (match, p1) => {
      if (p1.startsWith(url.origin)) {
        return `url("${PROXY_URL}/${p1}")`;
      }

      if (p1.startsWith("/")) {
        return `url("${PROXY_URL}/${url.origin + p1}")`;
      }

      return match;
    });

    // Add meta tag containing the original request URL
    const metaTag = `<meta name="original-url" content="${url.toString()}">`;
    html = html.replace(/<head[^>]*>/, (match) => `${match}${metaTag}`);

    // Add script tags to the end of the body
    const scriptTag = '<script src="/js/inject.js"></script>';
    html = html.replace("</body>", `${scriptTag}</body>`);

    return new NextResponse(html, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  // If content is CSS, replace all relative URLs with absolute URLs
  if (responseHeaders.get("content-type")?.includes("text/css")) {
    let css = await response.text();

    css = css.replace(/url\("?([^)]*)"?\)/g, (match, p1) => {
      if (p1.startsWith(url.origin)) {
        return `url("${PROXY_URL}/${p1}")`;
      }

      if (p1.startsWith("/")) {
        return `url("${PROXY_URL}/${url.origin + p1}")`;
      }

      return match;
    });

    return new NextResponse(css, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

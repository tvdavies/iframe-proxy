import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  const response = await fetch(url.toString());

  // If not OK, return response with status code and text
  if (!response.ok) {
    return new NextResponse(null, {
      status: response.status,
      statusText: response.statusText,
    });
  }

  const headers = new Headers(response.headers);
  // Remove x-frame-options header and add CORS header
  headers.delete("x-frame-options");
  headers.set("access-control-allow-origin", "*");

  // If content type is HTML replace all relative URLs with absolute URLs
  if (headers.get("content-type")?.includes("text/html")) {
    let html = await response.text();

    html = html.replace(/(href|src)="([^"]*)"/g, (match, p1, p2) => {
      // Check if URL is relative and not an absolute URL
      if (!p2.startsWith("http") && p2.startsWith("/")) {
        const encodedUrl = encodeURIComponent(url.origin + p2);
        // return `${p1}="https://corsproxy.io/?${encodedUrl}"`;
        return `${p1}="https://frameme.tvd.app/${url.origin + p2}"`;
      }
      // Keep the original if it's an absolute URL
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
      headers,
    });
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  });
}

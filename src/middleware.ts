import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

  console.log("url", url);

  const response = await fetch(url.toString());

  // If not found, return 404
  if (!response.ok) return new NextResponse(null, { status: 404 });

  // Remove x-frame-options header and add CORS header
  response.headers.delete("x-frame-options");
  response.headers.set("access-control-allow-origin", "*");

  // If content type is HTML replace all relative URLs with absolute URLs
  if (response.headers.get("content-type")?.includes("text/html")) {
    const html = await response.text();

    const absoluteHtml = html.replace(
      /(href|src)="([^"]*)"/g,
      (match, p1, p2) => {
        // Check if URL is relative and not an absolute URL
        if (!p2.startsWith("http") && p2.startsWith("/")) {
          const encodedUrl = encodeURIComponent(url.origin + p2);
          return `${p1}="https://corsproxy.io/?${encodedUrl}"`;
        }
        // Keep the original if it's an absolute URL
        return match;
      }
    );

    return new NextResponse(absoluteHtml, {
      status: response.status,
      headers: response.headers,
    });
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

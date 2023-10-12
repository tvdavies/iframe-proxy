import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export async function GET(request: Request) {
  // Get URL from search params
  const requestUrl = new URL(request.url);
  const uri = requestUrl.searchParams.get("uri");
  // If no URL, return 400 Bad Request
  if (!uri) return new Response(null, { status: 400 });

  console.log("Fetching URL:", uri);

  const response = await fetch(uri);
  const html = await response.text();

  console.log("Parsing HTML:", html);

  const doc = new JSDOM(html, {
    url: uri,
  });
  const reader = new Readability(doc.window.document, { charThreshold: 100 });
  const article = reader.parse();

  console.log("Parsed article:", article);

  return new Response(JSON.stringify(article), {
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
}

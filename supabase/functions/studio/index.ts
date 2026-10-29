Deno.serve((request: Request) => {
  const path = new URL(request.url).pathname.replace(/\/+$/, "");

  if (path !== "/studio/whatsapp" && path !== "/functions/v1/studio/whatsapp") {
    return new Response("Not found", { status: 404 });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: "https://wa.me/message/SMSXCZW2PJLBN1",
      "Cache-Control": "no-store",
    },
  });
});

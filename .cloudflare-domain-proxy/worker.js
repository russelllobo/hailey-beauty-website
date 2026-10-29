// worker.js
var UPSTREAM_ORIGIN = "https://hailey-beauty.pages.dev";
var worker_default = {
  async fetch(request) {
    try {
      const incomingUrl = new URL(request.url);
      if (incomingUrl.pathname === "/whatsapp" || incomingUrl.pathname === "/whatsapp/") {
        return new Response(null, {
          status: 302,
          headers: {
            Location: "https://wa.me/message/SMSXCZW2PJLBN1",
            "Cache-Control": "no-store"
          }
        });
      }
      const upstreamUrl = new URL(
        `${incomingUrl.pathname}${incomingUrl.search}`,
        UPSTREAM_ORIGIN
      );
      const response = await fetch(new Request(upstreamUrl, request));
      return new Response(response.body, response);
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "Pages origin request failed",
          error: error instanceof Error ? error.message : String(error),
          path: new URL(request.url).pathname
        })
      );
      return new Response("The website is temporarily unavailable.", {
        status: 502,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store"
        }
      });
    }
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map

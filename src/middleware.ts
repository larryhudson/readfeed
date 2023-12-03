import { auth } from "@src/auth/lucia";

import type { MiddlewareResponseHandler } from "astro";

export const onRequest: MiddlewareResponseHandler = async (context, next) => {
  context.locals.auth = auth.handleRequest(context);

  // TODO: we need to think about the podcast URLs.
  // they need to be public, but need a password in the query string etc.
  const privatePathPrefix = "/app/";
  if (context.url.pathname.startsWith(privatePathPrefix)) {
    const session = await context.locals.auth.validate();

    if (!session) {
      return new Response(null, {
        status: 403,
      });
    }
  }

  return await next();
};

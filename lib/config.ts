/**
 * Server-side configuration.
 *
 * Read this from server components only. Values here have no `NEXT_PUBLIC_` prefix, so
 * they are resolved on the server and are `undefined` if referenced in browser code.
 *
 * A note on `adsenseId`: it is not a secret and cannot be one. AdSense requires the
 * publisher ID to appear in the page — in the `google-adsense-account` meta tag, in the
 * adsbygoogle script URL, and in each ad unit's `data-ad-client`. It is additionally
 * published at /ads.txt, which exists precisely so ad networks can read it publicly.
 *
 * Keeping it off the `NEXT_PUBLIC_` prefix is still worthwhile: prefixed values are
 * inlined into the client JavaScript bundle at every reference site, whereas this one
 * now only reaches the browser as rendered HTML from a server component.
 */
export const config = {
  /** AdSense publisher ID, e.g. "ca-pub-0000000000000000". Must match /ads.txt. */
  adsenseId: process.env.ADSENSE_ID,

  /**
   * Google Analytics measurement ID. Deliberately left on the public prefix: it is
   * consumed by an inline browser script and by client-side page-view tracking, so it
   * has to be available to the client bundle.
   */
  gaId: process.env.NEXT_PUBLIC_GA_ID,
} as const;

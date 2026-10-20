# Deployment

1. Use Node 20+ and install dependencies with `npm install`.
2. Run `npm test`, `npm run build`, then `npm start`.
3. Deploy the Next.js app to Vercel or a Node host with outbound access to the two public API domains.
4. Set a real contact in the source `User-Agent` before launch. Do not expose API/service secrets in client environment variables.
5. Add monitoring, abuse throttling, and caching suitable for expected traffic. Open Food Facts limits search to 10 requests/minute/IP; do not use it for autocomplete.
6. Configure a custom domain, HTTPS, and test iPhone Safari/Android Chrome before release.
7. Obtain a retailer feed agreement and review ODbL compatibility before importing/promoting broader offer data.

A production deployment was not created as no hosting project or credentials were present in this empty workspace.

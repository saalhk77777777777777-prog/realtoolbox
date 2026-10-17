# TOOLBOX AdSense setup — v0.14.80

1. The production build reads `VITE_ADSENSE_CLIENT_ID` from Netlify. The configured publisher ID is `ca-pub-2603754934068938`.
2. `public/ads.txt` now contains the exact seller line provided by the site owner: `google.com, pub-2603754934068938, DIRECT, f08c47fec0942fa0`.
3. After a successful production deploy, verify `https://toolboxbox.netlify.app/ads.txt` returns that exact single line.
4. Confirm the site status and Auto ads settings in Google AdSense. Adding the file does not itself approve the site or guarantee that ads will display.
5. Run `npm run typecheck`, `npm test`, `npm run preflight:adsense`, and `npm run build` before deployment.
6. Review the privacy policy and any consent/CMP requirements that apply to the site's visitors.

The ads.txt seller line was supplied by the site owner. Ad delivery and site approval remain controlled by Google.

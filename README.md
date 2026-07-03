# Telia Image Studio

Bildgenerering i Telias stil — statisk webbapp (`public/index.html`) med
Vercel serverless-funktioner i `api/`.

- **Live:** https://telia-image-studio.vercel.app
- Bildgenerering via Replicate (Google Imagen 4) genom proxyn `api/replicate.js`
- Bildbank-koppling via `api/bynder.js`, historik via `api/history-*.js`
  (Vercel Blob), konfiguration via `api/config-*.js`

## Ursprung

Koden i första commiten är importerad rakt av från produktions-deployen på
Vercel (`dpl_Ds9UZkziNKfdLUASAc5f94HtJbhX`) — exakt det som var live vid
importtillfället. Projektet byggdes ursprungligen utan git.

## Miljövariabler (sätts i Vercel)

- `REPLICATE_API_TOKEN` — Replicate-nyckel för bildgenerering
- Vercel Blob-token för historik (kopplas automatiskt av Vercel)

## Deploy

Projektet ligger på Vercel som `telia-image-studio`. Deploya med
`npx vercel deploy --prod` eller koppla repot till projektet i Vercel
(Settings → Git) för automatisk deploy vid push.

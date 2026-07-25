# Qur’an data provenance

## Arabic text

- **Source:** AlQuran Cloud API
- **Edition:** `quran-uthmani`
- **Endpoint used by import:** `GET https://api.alquran.cloud/v1/quran/quran-uthmani`
- **Notes:** Uthmani orthography distributed by islamic-network / AlQuran Cloud. NUR stores text as reference data only; no casual CMS edits.

## Uzbek translation

- **Source:** AlQuran Cloud API
- **Edition:** `uz.sodik`
- **Translator (edition englishName):** Muhammad Sodik Muhammad Yusuf
- **Endpoint:** `GET https://api.alquran.cloud/v1/quran/uz.sodik`
- **Rights field:** `licensed` with notes pointing to AlQuran Cloud edition. Operators must confirm redistribution rights for their jurisdiction before production launch.

## Audio

- **Reciter (default):** Mishary Rashed Alafasy
- **Edition:** `ar.alafasy`
- **CDN:** `https://cdn.islamic.network/quran/audio/...` and `.../audio-surah/...`
- **Rights field:** `licensed` with CDN notes. Confirm CDN terms for production.

## Import command

```bash
cd apps/api
cp .env.example .env   # set MONGODB_URI + JWT secrets
npm run import:quran
```

The import records `datasetVersion` and a SHA-256 checksum of the Arabic surah payload on every ayah `sourceMeta`.

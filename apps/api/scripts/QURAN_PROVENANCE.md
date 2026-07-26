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

- **Reciters:** Mishary Rashed Alafasy (`ar.alafasy`), Mahmoud Khalil Al-Husary (`ar.husary`), Maher Al Muaiqly (`ar.mahermuaiqly`)
- **CDN:** `https://cdn.islamic.network/quran/audio/...` and `.../audio-surah/...`
- **Rights field:** `licensed` with CDN notes. Confirm CDN terms for production.
- **Upsert without re-importing text:** `npm run upsert:quran-reciters`

## Uzbek translation script note

- `uz.sodik` text is **Cyrillic** Uzbek. UI is Latin Uzbek; the app labels this explicitly until a licensed Latin edition is chosen.
- `nameUz` (114 surah names in Latin) is not invented — fill only from an owner-approved list.

## Surah display names (Uzbek Latin)

- **Source:** [uz.wikipedia — Qurʼondagi suralar roʻyxati](https://uz.wikipedia.org/wiki/Qurʼondagi_suralar_roʻyxati)
- **File:** `scripts/data/surah-names-uz.json` (114 names, without trailing «surasi»)
- **Upsert:** `npm run upsert:surah-names-uz`
- These are **metadata labels only** — not Qur’anic Arabic text and not ayah translations.

## Import command

```bash
cd apps/api
cp .env.example .env   # set MONGODB_URI + JWT secrets
npm run import:quran
```

The import records `datasetVersion` and a SHA-256 checksum of the Arabic surah payload on every ayah `sourceMeta`.

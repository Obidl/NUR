# Book PDF import

1. Copy the PDF → `incoming/<slug>.pdf` (PDFs are gitignored).
2. Add `manifests/<slug>.json` (title, authors, rights, chapter markers).
3. Dry-run:

```bash
cd apps/api
npm run import:book -- --manifest content/books/manifests/<slug>.json --dry-run
```

4. Upsert as **draft** (default):

```bash
npm run import:book -- --manifest content/books/manifests/<slug>.json
```

5. Publish only after `rights.licenseStatus` is not `unknown` (`owned` | `licensed` | `permission_granted` | `public_domain`), then:

```bash
npm run import:book -- --manifest content/books/manifests/<slug>.json --publish
```

CONTENT_RULES **B-02**: do not OCR-dump unlicensed PDFs into production.

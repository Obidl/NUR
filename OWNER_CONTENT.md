# NUR — Owner content checklist (Step 4)

**Status:** Approved by Product Owner (Husanboy) — 2026-07-25  
**Source:** Challenge video catalog + owner channel links (2026-07-26)  
**Depends on:** `IDEAL_PROJECT.md`, `CONTENT_RULES.md`

---

## 1. Approved catalog (seeded)

Podcast / kitob / video / 15 kun path — `siyrat-15-kun`.

---

## 2. Audio URL almashtirish (hozirgi next)

1. Login: `demo.editor@nur.local` / `password123` (yoki o‘z editor)  
2. `/admin/podcasts`  
3. Seriya → **Audio URL’lar**  
4. Har epizodga litsenziyalangan `https://…` qo‘ying → **Saqlash**

| Seriya | Epizod | Audio URL |
| --- | --- | --- |
| Siyrat yog‘dusi | qism-1 … | |
| Siyrat suhbatlari | qism-1 … | |
| Ash-Shifo sharhi | qism-1 … | |
| Seerah EN listening | qism-1 … | |

> YouTube/Spotify’ni qayta host qilmang — faqat ruxsat berilgan to‘g‘ridan-to‘g‘ri audio yoki o‘zingiz yuklagan fayl.

---

## 3. Video (YouTube embed — qayta host yo‘q)

Manbalar (owner):

- [Nouman Ali Khan — Official Bayyinah](https://www.youtube.com/@bayyinah)
- [Hasanxon Yahyo — @Hasanxondomla](https://www.youtube.com/@Hasanxondomla)
- [Hasanxon, Husaynxon — @hasanhusayn](https://www.youtube.com/@hasanhusayn) (Telegram: `@hasanhusayn`)

Admin: `/admin/videos` — yangi epizodga watch URL yoki 11 belgili ID.

### Seeded embeds (verified oEmbed)

#### Priority — Siyrat yog‘dusi (Islom.uz)

Owner entry: [payg‘ambarlikdan oldingi hayot / 46-son](https://youtu.be/D02mw3_tt4c)  
Playlist: [PLys356tU5j5QwryNqakQTBiq1dVj7tR5m](https://www.youtube.com/playlist?list=PLys356tU5j5QwryNqakQTBiq1dVj7tR5m) · Channel: [@islomuz](https://www.youtube.com/@islomuz)

| Seriya | Epizodlar | Note |
| --- | --- | --- |
| Siyrat yog‘dusi (Islom.uz) | 51 ta | Priority; Yo‘lda 46-sondan |
| Hasanxon — Siyrat / Shamoil | ~32 ta | @Hasanxondomla, Shamoil ketma-ket |
| hasanhusayn | ~20 ta | Suhbat/mavlid — takror nashid cheklangan |
| Nouman Ali Khan — Prophet ﷺ | ~25 ta | @bayyinah Road to Hajj + Prophet ﷺ only |

#### Starter IDs (legacy note)

Older single-ID table replaced by JSON packs under `apps/api/scripts/data/`.

> Kanalni scrape qilmang. Qo‘shimcha ID’lar faqat tekshirib admin orqali.

---

## 4. Kitob matni

Admin books CMS or seed orqali bob `body` ni litsenziyalangan matn bilan almashtiring. Stub — invent emas.

Katalog (seed): Ar-Rahiqul Maxtum, Shamoili Muhammadiya, Ash-Shifo, Navaviy 40 hadis, Zad al-Ma’ad, Siyrat Ibn Hishom, Fiqh us-Siyrat.

---

## 5. Limits

| Item | Status |
| --- | --- |
| Catalog titles | ✅ |
| Placeholder audio notice in player | ✅ |
| Admin audio URL editor | ✅ |
| YouTube embed videos + admin CMS | ✅ |
| Bayyinah + Hasanxon + hasanhusayn starter IDs | ✅ |
| Real licensed audio files | ☐ Owner pastes URLs |
| More video IDs | ☐ Owner pastes in `/admin/videos` |

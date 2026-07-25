# NUR — Ideal Project (Jamlangan North Star)

**Status:** Approved direction — implementation started (Home Bugungi yo‘l)  
**Last updated:** 2026-07-25  
**Owner:** Husanboy  
**Purpose:** Barcha manbalarni (PRD, videolar, ChatGPT “Challange”, UI referens, mavjud kod) **bitta ideal loyihaga** jamlaydi.  
**Rule:** Bu fayl — “nima quriladi”ning qisqa ideal modeli. Batafsil qoidalar: `PRD.md`, `CONTENT_RULES.md`, `ARCHITECTURE.md`, `UI_GUIDELINES.md`, `CURRICULUM.md`.

**Implementation note:** Home endi brand-first + pastida minimal **Bugungi yo‘l** checklist (curriculum progress). Streak/jazо yo‘q.

---

## 0. Bir gapda

> **NUR** — ochasan, bugungi yo‘l tayyor: Qur’on → podcast → kitob. Qidirmaysan. O‘ylamaysan. Davom etasan. Har bir narsa manbali.

Tagline ruhida: *bir kishi, bir kun — bir yo‘l.*

---

## 1. Qayerdan kelgan ideal

| Manba | Nima oldik |
| --- | --- |
| ChatGPT “Challange” | 15 kunlik shaxsiy siyrat loyihasi; kitob/podcast ro‘yxati; kun tartibi; “No thinking. Just execute.” |
| Screen UI referens | Today’s Mission, Ertalab → Yo‘lda → Kechqurun, checklist, Mark complete |
| Mavjud NUR docs/kod | Stack, Lamp on Ink, FE/BE/DB, Qur’on import, curriculum API, publish gates |
| CONTENT_RULES | Qur’on invent yo‘q; manbasiz “haqiqiy” deb chiqarish yo‘q |

**Ideal = UI his (1) + kontent yo‘li (2) + ishonch arxitekturasi (3).**  
Qora+yashil nusxa emas. Streak/jazо emas. Marketplace emas.

---

## 2. Ideal mahsulot modeli

### 2.1 Kim uchun (v1)

- Asosan **bitta odam** (Husanboy) va shunga o‘xshash kunlik o‘quvchilar  
- O‘zbek UI  
- Kuniga ~2–2.5 soat: Qur’on + siyrat + kitob  

### 2.2 Nima emas

- Ijtimoiy tarmoq / chat / fatwa bot  
- YouTube/Spotify qidiruv o‘rnini bosuvchi dump  
- Gamified “taqvo ballari”, streak shaming, jazо tizimi  
- AI tafsir / AI hukm  

### 2.3 Asosiy va’da

| Va’da | Ma’nosi |
| --- | --- |
| Yo‘l | Har kuni nima qilish aniq |
| Davom | To‘xtagan joydan davom |
| Ishonch | Manba ko‘rinadi; invent yo‘q |
| Tinichlik | Lamp on Ink; kartochka spam yo‘q |
| Adab | Past shovqin, hurmatli ohang |

---

## 3. Ideal foydalanuvchi oqimi (kunlik)

```text
Ochiladi → Assalomu alaykum + sana
       → Bugungi yo‘l (foiz / qolgan ishlar)
       → 1. Ertalab: Qur’on oralig‘i + tinglash + tafakkur
       → 2. Yo‘lda: podcast epizod
       → 3. Kechqurun: kitob bob + qisqa refleksiya
       → Yakunlandi → ertaga tayyor
```

**Bitta savol qolmasin:** “Bugun nima o‘qiyman?”

---

## 4. Ideal kontent: “Rasululloh ﷺ ni yaqindan tanish”

### 4.1 Yo‘l turi

Bitta (yoki birinchi) published **LearningPath**:

- Nom (misol): *Rasululloh ﷺ ni yaqindan tanish*  
- Muddat: ~15 kun (modullar/darslar)  
- Har kun: Qur’on + siyrat (audio) + kitob  

### 4.2 Kun bloki (shablon)

| Blok | Vaqt | Target |
| --- | --- | --- |
| Ertalab | 45–60 daq | `quran_range` + audio (import qilingan) + refleksiya prompt |
| Yo‘lda | 30–40 daq | `podcast_episode` |
| Kechqurun | 60–90 daq | `book_chapter` (+ ixtiyoriy qisqa audio sharh) |
| Yakun | ~5 daq | 1–3 ta shaxsiy qayd (user note; diniy hukm emas) |

### 4.3 Kitob tartibi (editorial intent — litsenziya tasdiqlanguncha seed/EXAMPLE)

1. Ar-Rahiqul Maxtum (Muhrlangan jannat) — birinchi  
2. Shamoili Muhammadiya  
3. Ash-Shifo  
4. 40 Hadis (Navaviy)  

### 4.4 Podcast tartibi (editorial intent)

**O‘zbek (asosiy, yo‘l uchun):**

- Siyrat yog‘dusi (Islom.uz)  
- Siyrat suhbatlari  
- (ixtiyoriy) Ash-Shifo sharhi  

**Ingliz (listening qo‘shimcha — yo‘l majburiy emas):**

- Yasir Qadhi — Seerah Series  
- The Firsts — Omar Suleiman  
- The Seerah Podcast — Qalam  
- Life of the Prophet — Ahson Syed  

> **Gate:** Hech bir nom production “published” bo‘lmaydi to litsenziya/huquq + `sources[]` + editor tasdiqi. Tasdiqlanmaguncha: `draft` / EXAMPLE seed yoki bo‘sh katalog.

### 4.5 Qur’on

- Matn: faqat verified import (`QURAN_PROVENANCE`)  
- Kunlik: aniq surah/oyat oralig‘i (path lesson `targetRef`)  
- Tinglash: tanlangan qori (birlamchi); progress saqlanadi  
- Invent oyat / “Hadith of the Day” AI matni — **taqiqlangan**

---

## 5. Ideal UI (NUR-native, referens his)

### 5.1 Home = Bugungi yo‘l

Birinchi viewport (bir kompozitsiya):

1. **NUR** (brand hero)  
2. Salomlashuv (Assalomu alaykum)  
3. Bitta qisqa jumla (“Bugungi yo‘l tayyor”)  
4. Bitta CTA: *Davom etish* / *Bugungi dars*  
5. Atmosphere (Lamp on Ink)  

Scroll past hero:

- Bugungi checklist (Qur’on / Podcast / Kitob) — interaction container sifatida  
- Bloklar: Ertalab → Yo‘lda → Kechqurun  
- Har blokda: “Yakunlash” (lesson complete → curriculum progress)

### 5.2 Boshqa sirtlar

| Surface | Ideal vazifa |
| --- | --- |
| Yo‘llar (`/curriculum`) | Path katalog + detail |
| Qur’on | O‘qish/tinglash/bookmark |
| Podcastlar / Kitoblar | Yo‘l manbalari + katalog (kam, curated) |
| Kutubxona | Shaxsiy davom |
| Sozlamalar | Font, audio tezlik, appearance — streak reset emas |
| Admin | Publish gates, path/lesson editor |

### 5.3 Dizayn qoidalari

- **Lamp on Ink** (`DESIGN_SYSTEM.md`) — qora+neon yashil 1:1 emas  
- Kartochka faqat interaction uchun  
- Stat strip / streak / “hours learned” piety dashboard — **yo‘q**  
- VERIFIED / manba badge kontent yonida  

---

## 6. Ideal texnik asos (o‘zgarmaydi)

| Layer | Stack |
| --- | --- |
| Web | React, Vite, TypeScript, Tailwind, Framer Motion, React Router, Zustand, Axios, Lucide |
| API | Node, Express, JWT, REST |
| DB | MongoDB Atlas + Mongoose |
| Deploy | Vercel + Render + Atlas |

Ajratish:

- FE → faqat API  
- Secrets frontend’da yo‘q  
- routes → controllers → services → models  

Progress: mavjud `PathProgress` + library continue. Yangi “streak engine” yo‘q.

---

## 7. Ideal ma’lumot modeli (mavjudga bog‘lash)

```text
LearningPath  →  Module  →  Lesson
                              ├─ quran_range
                              ├─ podcast_episode
                              └─ book_chapter

PathProgress(userId, pathId, completedLessonIds, currentLessonId)
```

Har kun = 3–4 lesson (ertalab/yo‘lda/kechqurun[/yakun]).

---

## 8. Ideal sifat bar’i

Ship qilishdan oldin:

1. Auth ishlaydi  
2. Draft path publicda ko‘rinmaydi  
3. Qur’on faqat import dataset  
4. Published har bir diniy itemda `sources` / rights  
5. Home “Bugungi yo‘l” real progress bilan  
6. Lighthouse / a11y / reduced-motion hurmati  
7. Production checklist (`PRODUCTION_CHECKLIST.md`)  

---

## 9. Kollab modeli (Husanboy ↔ Agent)

| Rol | Vazifa |
| --- | --- |
| **Agent** | Home “Bugungi yo‘l” UI; curriculum wiring; EXAMPLE path seed; docs sync |
| **Husanboy** | Qaysi podcast/kitob real; litsenziya; publish tasdiqi; ohang/UX “shu” deyish |
| **Ikkalasi** | Har fazada: agent qiladi → owner tekshiradi → `next` |

Kontent invent qilinmaydi. UI bo‘sh bo‘lishi mumkin — yolg‘on to‘liq emas.

---

## 10. Qurilish tartibi (ideal → amal)

| # | Ish | Natija |
| --- | --- | --- |
| 1 | Owner: `IDEAL_PROJECT.md` tasdiqi | Yo‘nalish qulflanadi |
| 2 | Home → Bugungi yo‘l (curriculum progress) | Referens his, NUR look |
| 3 | EXAMPLE 15-kun path seed (faqat mavjud/EXAMPLE targetlar) | ✅ Demo yo‘l (`example-demo-path`) |
| 4 | Owner kontent tasdiqi | Real publish |
| 5 | Polish + production checklist | ✅ Journey UI polish (slot labels, progress); checklist qisman |

---

## 11. Muvaffaqiyat belgisi

Ideal NUR ishlayapti demak:

1. Ochilganda **bugungi 3 ish** ko‘rinadi.  
2. Belgilash → progress saqlanadi.  
3. Qur’on/audio/kitob **manbali**.  
4. “Bugun nima?” savoli yo‘qoladi.  
5. 15 kundan keyin odat qoladi — kitobni “tugatish” majburiy emas.

North-star:

> Haftalik foydalanuvchi ≥1 marta “Bugungi yo‘l”dan haqiqiy davom (Qur’on / podcast / kitob progress).

---

## 12. Tasdiq

| Savol | Javob |
| --- | --- |
| Ideal model shumi? | ☐ Ha / ☐ Tuzatish kerak |
| Home asosiy sirt = Bugungi yo‘l? | ☐ Ha |
| 15 kunlik siyrat path birinchi curriculum? | ☐ Ha |
| Streak/jazо yo‘q? | ☐ Ha |
| Kontent faqat tasdiqlangandan keyin publish? | ☐ Ha |

**Owner imzo:** _________________ **Sana:** _________

Tasdiqdan keyin implementatsiya: owner `go` deb yozadi.

---

## 13. Bog‘liq hujjatlar

1. `PRODUCT.md` — nima uchun  
2. `PRD.md` — talablar  
3. `CURRICULUM.md` — path domeni  
4. `CONTENT_RULES.md` — diniy xavfsizlik  
5. `UI_GUIDELINES.md` + `DESIGN_SYSTEM.md` — interfeys  
6. `ARCHITECTURE.md` + `API.md` + `DATABASE.md` — texnika  
7. `TASKS.md` — ish tartibi  

**Konflikt:** diniy xavfsizlikda `CONTENT_RULES` > bu fayl. Stack/ajratishda `ARCHITECTURE` > bu fayl. Ideal UX niyatida **bu fayl** Home’ni “Bugungi yo‘l” qilib qayta markazlashtiradi.

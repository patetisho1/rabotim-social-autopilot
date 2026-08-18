# Rabotim Social Autopilot

Дневна автоматизация, която генерира и публикува пост във Facebook, Instagram и (условно)
TikTok — без ръчна намеса. Мисли за нея като за малка машина: всеки ден в определен час тя
избира тема по седмична ротация, взима реални данни от Rabotim ако има такива, пише текст
(AI или локален шаблон), генерира branded визуал/видео, публикува го и се качва навсякъде
където го поискаш публично, за да могат Meta/TikTok да го прочетат.

## Как работи (поток)

```
GitHub Actions cron (всеки ден)
  → src/index.js
      → contentMixer: избира тема на деня (src/contentSource/themes.js)
          → rabotimData.js: опитва реални данни от твоя бекенд (по избор)
          → aiCopy.js: генерира caption (Claude API, fallback = локален шаблон)
      → media/generateImage.js: branded PNG (sharp, SVG->PNG)
      → media/generateVideo.js: branded MP4 с Ken Burns zoom (ffmpeg), само за
        теми маркирани videoWorthy
      → hosting/publicAssetHost.js: commit-ва файла в repo-то, за да има публичен URL
      → platforms/meta.js: Facebook photo + Instagram photo/reel
      → platforms/tiktok.js: TikTok video (виж ограниченията по-долу)
```

Ако някоя стъпка гръмне (липсващ ключ, платформата отказва и т.н.), пайплайнът не спира
останалите платформи — логва грешката и (ако си сложил `ALERT_WEBHOOK_URL`) ти праща кратко
известие. Никога не блокира чакайки твое одобрение — избра "напълно автоматично", това е.

## Защо съдържанието не е еднакво всеки ден

`src/contentSource/themes.js` върти 7 различни формата по ден от седмицата (преди/след,
съвет, социално доказателство, explainer, категория на седмицата и т.н.) — същата логика
като в content calendar-а (xlsx), само вместо ти да го пишеш ръчно, машината го прави. Темите
маркирани `wantsRealData: true` първо опитват да изтеглят истински данни от Rabotim; ако няма
такъв ендпойнт настроен, автоматично пада на AI/шаблонен текст — никога не спира заради
липсващи данни.

## Преди да пуснеш в продукция

1. **`npm install`**, после **`npm run dry-run`** — генерира caption + снимка (+ видео, ако
   темата за деня го изисква) локално в `sample-output/`, БЕЗ да пуска нищо реално. Провери
   резултата визуално, преди да свързваш истински акаунти.
2. **Meta App** (developers.facebook.com): създай App → добави Facebook Login + Instagram
   Graph API продукти → генерирай дълготраен Page Access Token с permissions
   `pages_manage_posts`, `pages_read_engagement`, `instagram_content_publish`,
   `instagram_basic`. Instagram акаунтът трябва да е Business/Creator и свързан с Facebook
   страницата.
3. **TikTok App** (developers.tiktok.com): регистрирай App, кандидатствай за Content Posting
   API с `video.publish` scope. **Докато App-ът не мине TikTok-ов review, видеата се качват
   като частен draft** (`SELF_ONLY`) и изискват ръчно потвърждение в TikTok приложението — това
   е ограничение от TikTok, не бъг в кода. Смени `privacyLevel` в `src/platforms/tiktok.js`
   едва след одобрение.
4. **Публичен hosting на медията**: по подразбиране пайплайнът commit-ва генерираните файлове
   в `public/social-assets/` на repo-то и чете суровото съдържание през
   `raw.githubusercontent.com`. Работи безплатно, но означава, че repo-то трябва да е public
   (или да ползваш GitHub Pages/друг hosting, ако искаш да остане private — виж
   `src/hosting/publicAssetHost.js`, лесно се сменя с S3/Cloudflare R2).
5. **(По избор) Rabotim data endpoint**: за да излизат "реални данни" постовете (отзиви,
   завършени услуги, статистика), трябва лек JSON API от бекенда на rabotim.com — очакваният
   формат е описан в `src/contentSource/rabotimData.js`. Без него всичко пада на AI/шаблони,
   пайплайнът работи и така, просто по-общо.
6. Сложи всички ключове като **GitHub Actions Secrets** (Settings → Secrets and variables →
   Actions) със същите имена като в `.env.example`.
7. Тествай веднъж ръчно през таба "Actions" → "Rabotim daily social post" → "Run workflow"
   (`workflow_dispatch`), преди да разчиташ на крон-а.

## Известни ограничения / неща да имаш предвид

- **TikTok**: истинско напълно автоматично публично публикуване изисква одобрен App — планирай
  за това 1-2 седмици процес по review, не приемай, че тръгва веднага.
- **Instagram** изисква Business/Creator акаунт, свързан с Facebook страница — личен IG акаунт
  не работи през Graph API.
- Генерираните видеа в момента са статичен branded кадър с zoom ефект (ffmpeg), не истински
  клипове. За по-добро TikTok representation, добави UGC клипове от изпълнители в
  `media/generateVideo.js` като алтернативен източник на суров материал вместо генерирания
  кадър.
- API-тата на Meta/TikTok се променят версии и изисквания сравнително често — провери текущата
  документация преди първия реален run, коментарите в кода сочат към нея.
- Този проект НЕ пази исторически лог на публикуваните постове — ако искаш dashboard, свържи
  `results` от `src/index.js` към Google Sheet (fetch към Sheets API) или към лог-а от
  основния marketing план.

## Локална разработка

```bash
npm install
cp .env.example .env   # попълни каквото имаш, останалото пада на fallback
npm run dry-run         # безопасно, нищо не се публикува
npm run post             # реално публикуване — само след като си сигурен в ключовете
```

# Nexus GymB

Статичний щоденник тренувань: Firebase Authentication та Firestore. Без серверних залежностей і збірки.

## Запуск

Потрібен Node.js 22 або новіший. Виконай `npm start` і відкрий http://localhost:8080.
`tools/preview.mjs` потрібний тільки для локального перегляду; він віддає лише `public/`.

## GitHub Pages

1. Завантаж проєкт у гілку `main` публічного репозиторію.
2. У **Settings → Pages → Build and deployment → Source** вибери **GitHub Actions**.
3. Workflow `.github/workflows/pages.yml` перевірить JavaScript і наявність приватних файлів та опублікує тільки `public/`.
4. У Firebase Console → Authentication → Settings → Authorized domains додай `<username>.github.io` (або власний домен). У Sign-in method увімкни Email/Password.
5. У Firebase Console → Firestore Database → Rules опублікуй вміст `firestore.rules`. Альтернатива з установленим Firebase CLI: `firebase deploy --only firestore:rules --project nexus-gymb`.

Домен Firebase та правила потрібно налаштувати окремо: GitHub Pages не публікує правила Firestore.
Всі посилання відносні, тому сайт працює за адресою `https://<username>.github.io/<repository>/`.

## Конфіденційність

- `.env`, усі `.env.*`, службові JSON-ключі, сертифікати та `secrets/` ігноруються Git. Зберігай справжні секрети поза `public/`.
- `public/js/config.js` містить публічну Firebase web-конфігурацію. Вона необхідна браузеру і не є серверним секретом. Не додавай туди Firebase Admin credentials, токени або паролі.
- Кожен підтверджений користувач має доступ тільки до власного профілю, програм та історії. Спільний каталог доступний підтвердженим користувачам; змінювати його може лише адміністратор.
- Власник визначається Firebase UID `ljYr2MF28zg1zAFsD7M1sNH6s8O2`: у `public/js/config.js` та `firestore.rules`. Для доступу до керування увійди саме цим обліковим записом і підтвердь пошту. Custom claims налаштовувати не потрібно. UID не є паролем або приватним ключем; права перевіряє Firestore.
- Обмеж Firebase web API key потрібними Firebase API в Google Cloud Console; не використовуй цей ключ для інших Google Cloud API.
- `.gitignore` не прибирає вже опубліковані секрети з історії. Якщо приватний ключ або токен колись потрапив у GitHub, відклич його та очисти історію перед повторною публікацією.

Джерела: [Firebase API keys](https://firebase.google.com/docs/projects/api-keys), [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Власні характеристики вправ

У редакторі програми налаштуй підходи, повторення, час, вагу, відпочинок та примітку для кожної вправи. Кнопка **＋ Параметр** додає до восьми власних характеристик: назву, значення та одиницю (наприклад, «Швидкість / 6 / км/год», «Нахил / 3 / %» або «Хват / вузький»).

Під час тренування можна змінити фактичне значення кожного параметра для окремого підходу. Воно зберігається в історії. Старі програми без власних параметрів продовжують працювати.

// Седмична ротация на теми — 0 = неделя ... 6 = събота (JS Date.getDay()).
// "wantsRealData: true" означава, че темата предпочита реални данни от Rabotim,
// но винаги пада обратно на чист AI текст, ако rabotimData.js не върне нищо.
//
// Целта е всеки ден да излиза различен тип съдържание, а не 7 пъти същият формат —
// това е по-важно за engagement, отколкото самата автоматизация.

const THEMES = [
  {
    day: 0, // неделя
    key: "review_spotlight",
    label: "Отзив на седмицата",
    wantsRealData: true,
    dataKind: "top_review",
    fallbackTopics: [
      "Защо проверените отзиви имат значение при избор на изпълнител",
      "Какво прави един отзив за услуга полезен, а не просто '5 звезди'",
    ],
    videoWorthy: false,
  },
  {
    day: 1, // понеделник
    key: "before_after",
    label: "Преди/след",
    wantsRealData: true,
    dataKind: "recent_completed_job",
    fallbackTopics: [
      "Малка промяна, голяма разлика — пример за добре свършена работа",
      "Как изглежда 'добре свършена работа' в почистване/ремонт",
    ],
    videoWorthy: true,
  },
  {
    day: 2, // вторник
    key: "tip",
    label: "Съвет",
    wantsRealData: false,
    fallbackTopics: [
      "3 неща, които да провериш преди да наемеш майстор",
      "Как да опишеш заявка, за да получиш по-точна оферта",
      "Кога е по-евтино да наемеш професионалист, вместо да го правиш сам",
      "Какво трябва да включва добрата оферта от изпълнител",
    ],
    videoWorthy: true,
  },
  {
    day: 3, // сряда
    key: "social_proof",
    label: "Социално доказателство",
    wantsRealData: true,
    dataKind: "weekly_stats",
    fallbackTopics: [
      "Хора като теб намират проверени изпълнители всеки ден през Rabotim",
    ],
    videoWorthy: false,
  },
  {
    day: 4, // четвъртък
    key: "explainer",
    label: "Как работи платформата",
    wantsRealData: false,
    fallbackTopics: [
      "Как да заявиш услуга в Rabotim за под 2 минути",
      "Какво се случва след като подадеш заявка",
      "Как избираме кои изпълнители да покажем на твоята заявка",
    ],
    videoWorthy: true,
  },
  {
    day: 5, // петък
    key: "category_spotlight",
    label: "Категория на седмицата",
    wantsRealData: true,
    dataKind: "top_category",
    fallbackTopics: [
      "Кои услуги хората търсят най-често преди уикенда",
      "Пролетно/есенно почистване — какво да включиш в заявката",
    ],
    videoWorthy: true,
  },
  {
    day: 6, // събота
    key: "offer_cta",
    label: "Explainer / оферта",
    wantsRealData: false,
    fallbackTopics: [
      "Уикендът е за теб, не за ремонти — заяви услуга през Rabotim",
      "Планираш нещо у дома? Виж кои изпълнители са свободни този уикенд",
    ],
    videoWorthy: false,
  },
];

function themeForDate(date = new Date()) {
  const day = date.getDay();
  return THEMES.find((t) => t.day === day) || THEMES[2];
}

module.exports = { THEMES, themeForDate };

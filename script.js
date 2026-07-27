const SITE_CONFIG = {
  name: "Hailey Beauty",
  bookingUrl: "https://www.sumupbookings.com/hailey-beauty-ltd",
  bookingProvider: "",
  instagramUrl: "https://www.instagram.com/haileybeautyldn/",
  tiktokUrl: "https://www.tiktok.com/@haileybeautyldn",
  rednoteUrl: "https://www.xiaohongshu.com/search_result?keyword=hk_beauty",
  whatsappUrl: "",
  facebookUrl: "https://www.facebook.com/search/top?q=Hailey%20Beauty",
  phone: "",
  email: "",
  address: "",
  openingHours: [],
  canonicalUrl: "",
  treatmentPdf: "./assets/hailey-beauty-treatments-prices.pdf",
  socialImage: "./assets/hero-treatment.webp"
};

const translations = {
  en: {
    skipContent: "Skip to content",
    brandLine: "London · Hong Kong roots",
    navTreatments: "Treatments",
    navPrices: "Prices",
    navStory: "Our story",
    navResults: "Results",
    bookNow: "Book now",
    bookConsultation: "Book a consultation",
    enquireInstagram: "Enquire on Instagram",
    heroAnnouncement: "Now open in Oxford Circus — free skin analysis for our grand opening",
    heroKicker: "Herbal facial practice",
    heroTitle: "Tailored Herbal Treatments",
    heroCopy: "Thirty years of Hong Kong facial practice, now tailoring herbal care for London skin.",
    viewPrices: "View treatments & prices",
    proofPractice: "30 years of salon practice",
    proofOrigin: "Rooted in Hong Kong",
    proofLondon: "Now welcoming London clients",
    proofLanguages: "English · 普通話 · 廣東話",
    ritualKicker: "The signature ritual",
    ritualTitle: "A treatment begins by listening to the skin.",
    ritualCopy: "We assess sensitivity first, prepare a targeted herbal blend, then use suitable salon technology to support even application.",
    stepRead: "Read",
    stepReadCopy: "A calm consultation focused on condition, comfort and goals.",
    stepBlend: "Blend",
    stepBlendCopy: "Herbal care selected around what your skin needs that day.",
    stepTreat: "Treat",
    stepTreatCopy: "Measured application, thoughtful technique and clear aftercare.",
    ritualQuote: "Care shaped by personal acne experience and three decades in the salon.",
    openPdf: "Open PDF",
    aboutKicker: "Our point of view",
    aboutTitle: "Hong Kong practice, made personal in London.",
    aboutLead: "Hailey Beauty grew from two Hong Kong salons and a personal understanding of persistent acne.",
    aboutCopy: "That experience still shapes the studio: careful skin reading, herbal knowledge, considered technology and treatments tailored without pressure.",
    yearsPractice: "years of practice",
    hongKongSalons: "Hong Kong salons",
    consultLanguages: "consultation languages",
    aboutCaption: "Herbal knowledge · careful technique",
    locationLabel: "London studio",
    locationAddress: "Margaret Street · near Oxford Street",
    viewMap: "View in Google Maps",
    galleryKicker: "Treatment journal",
    galleryTitle: "Real skin. Real treatment moments.",
    galleryCopy: "A closer look at the process and the skin immediately before and after care.",
    beforeLabel: "Before treatment",
    afterLabel: "After treatment",
    processLabel: "A quiet treatment moment",
    herbsLabel: "Fresh herbal preparation",
    finishLabel: "Immediately after care",
    resultsNote: "Photographs show individual treatment moments. Results vary by skin and treatment plan.",
    followInstagram: "See recent work on Instagram",
    bookingKicker: "Your next appointment",
    bookingTitle: "Let’s begin",
    bookingCopy: "View live availability and choose your treatment through our booking destination. You can discuss sensitivities and goals during consultation.",
    continueBooking: "Continue to booking",
    bookingNote: "The booking page opens in a new tab.",
    footerTagline: "Herbal facial practice with Hong Kong roots.",
    footerVisit: "London appointments",
    footerDetails: "Studio details",
    privacyTitle: "Privacy",
    privacyCopy: "This website does not collect personal information. External booking and social platforms apply their own privacy terms.",
    termsTitle: "Treatment information",
    termsCopy: "Treatment suitability and expected results are discussed during consultation. Individual results vary.",
    rights: "All rights reserved.",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    bookingFallbackNote: "Enquiries currently open through Instagram in a new tab."
  },
  zh: {
    skipContent: "跳到主要内容",
    brandLine: "伦敦 · 源自香港",
    navTreatments: "护理",
    navPrices: "价目",
    navStory: "我们的故事",
    navResults: "护理记录",
    bookNow: "立即预约",
    bookConsultation: "预约皮肤咨询",
    enquireInstagram: "Instagram 咨询",
    heroAnnouncement: "现已于 Oxford Circus 开业 — 盛大开业期间免费皮肤分析",
    heroKicker: "草本面部护理",
    heroTitle: "草本修护，让肌肤看起来更平静。",
    heroCopy: "三十年香港面部护理经验，如今在伦敦为每一种肤况定制草本护理。",
    viewPrices: "查看护理与价目",
    proofPractice: "30年美容院实践",
    proofOrigin: "源自香港",
    proofLondon: "现于伦敦接待顾客",
    proofLanguages: "English · 普通話 · 廣東話",
    ritualKicker: "主打护理步骤",
    ritualTitle: "每次护理，都从认真了解肌肤开始。",
    ritualCopy: "我们先了解敏感度，再准备针对性的草本配方，并按肤况使用合适的美容仪器帮助均匀护理。",
    stepRead: "了解",
    stepReadCopy: "从肤况、舒适度和护理目标开始轻松咨询。",
    stepBlend: "调配",
    stepBlendCopy: "根据当天的肌肤需要选择草本护理。",
    stepTreat: "护理",
    stepTreatCopy: "细致操作、合适技术和清晰的护理后建议。",
    ritualQuote: "源于亲身痘痘经历，也经过三十年美容院实践。",
    openPdf: "打开 PDF",
    aboutKicker: "我们的理念",
    aboutTitle: "香港经验，在伦敦用心延续。",
    aboutLead: "Hailey Beauty 从香港两间美容院和对顽固痘痘的亲身理解中成长。",
    aboutCopy: "这段经历仍影响着工作室：细致了解肤况、草本知识、谨慎使用仪器，并在没有压力的情况下定制护理。",
    yearsPractice: "年护理实践",
    hongKongSalons: "间香港美容院",
    consultLanguages: "种咨询语言",
    aboutCaption: "草本知识 · 细致技术",
    locationLabel: "伦敦工作室",
    locationAddress: "Margaret Street · Oxford Street 附近",
    viewMap: "在 Google 地图中查看",
    galleryKicker: "护理记录",
    galleryTitle: "真实肌肤，真实护理时刻。",
    galleryCopy: "近距离了解护理过程，以及护理前后的即时肤况。",
    beforeLabel: "护理前",
    afterLabel: "护理后",
    processLabel: "安静的护理时刻",
    herbsLabel: "新鲜草本护理",
    finishLabel: "护理后即时肤况",
    resultsNote: "照片记录个人护理时刻。效果会因肤况和护理计划而异。",
    followInstagram: "在 Instagram 查看近期作品",
    bookingKicker: "下一次预约",
    bookingTitle: "让我们先了解你的肌肤。",
    bookingCopy: "通过预约平台查看实时空位并选择护理项目。咨询时可以说明敏感情况和护理目标。",
    continueBooking: "前往预约",
    bookingNote: "预约页面将在新标签页打开。",
    footerTagline: "源自香港的草本面部护理。",
    footerVisit: "伦敦预约",
    footerDetails: "工作室资料",
    privacyTitle: "隐私",
    privacyCopy: "本网站不收集个人资料。外部预约和社交平台适用其各自的隐私条款。",
    termsTitle: "护理资料",
    termsCopy: "护理是否适合和预期效果会在咨询时讨论，个人效果会有所不同。",
    rights: "保留所有权利。",
    menuOpen: "打开菜单",
    menuClose: "关闭菜单",
    bookingFallbackNote: "目前可通过 Instagram 在新标签页进行咨询。"
  },
  yue: {
    skipContent: "跳到主要内容",
    brandLine: "倫敦 · 源自香港",
    navTreatments: "護理",
    navPrices: "價目",
    navStory: "我哋嘅故事",
    navResults: "護理記錄",
    bookNow: "立即預約",
    bookConsultation: "預約皮膚諮詢",
    enquireInstagram: "Instagram 查詢",
    heroAnnouncement: "現已於 Oxford Circus 開業 — 盛大開業期間免費皮膚分析",
    heroKicker: "草本面部護理",
    heroTitle: "草本修護，令肌膚望落更平靜。",
    heroCopy: "三十年香港面部護理經驗，依家喺倫敦為每種膚況度身定制草本護理。",
    viewPrices: "睇護理同價目",
    proofPractice: "30年美容院實踐",
    proofOrigin: "源自香港",
    proofLondon: "現於倫敦接待客人",
    proofLanguages: "English · 普通話 · 廣東話",
    ritualKicker: "主打護理步驟",
    ritualTitle: "每次護理，都由細心了解肌膚開始。",
    ritualCopy: "我哋先了解敏感程度，再準備針對性草本配方，並按膚況使用合適美容儀器協助均勻護理。",
    stepRead: "了解",
    stepReadCopy: "由膚況、舒適度同護理目標開始輕鬆諮詢。",
    stepBlend: "調配",
    stepBlendCopy: "按當日肌膚需要選擇草本護理。",
    stepTreat: "護理",
    stepTreatCopy: "細緻操作、合適技術同清晰嘅護理後建議。",
    ritualQuote: "源於親身暗瘡經歷，亦經過三十年美容院實踐。",
    openPdf: "打開 PDF",
    aboutKicker: "我哋嘅理念",
    aboutTitle: "香港經驗，喺倫敦用心延續。",
    aboutLead: "Hailey Beauty 由香港兩間美容院同對頑固暗瘡嘅親身理解中成長。",
    aboutCopy: "呢段經歷依然影響工作室：細心了解膚況、草本知識、謹慎使用儀器，同埋冇壓力嘅度身護理。",
    yearsPractice: "年護理實踐",
    hongKongSalons: "間香港美容院",
    consultLanguages: "種諮詢語言",
    aboutCaption: "草本知識 · 細緻技術",
    locationLabel: "倫敦工作室",
    locationAddress: "Margaret Street · Oxford Street 附近",
    viewMap: "喺 Google 地圖查看",
    galleryKicker: "護理記錄",
    galleryTitle: "真實肌膚，真實護理時刻。",
    galleryCopy: "近距離了解護理過程，同護理前後嘅即時膚況。",
    beforeLabel: "護理前",
    afterLabel: "護理後",
    processLabel: "安靜嘅護理時刻",
    herbsLabel: "新鮮草本護理",
    finishLabel: "護理後即時膚況",
    resultsNote: "相片記錄個人護理時刻。效果會因膚況同護理計劃而異。",
    followInstagram: "喺 Instagram 睇近期作品",
    bookingKicker: "下一次預約",
    bookingTitle: "等我哋先了解你嘅肌膚。",
    bookingCopy: "透過預約平台睇即時空位同選擇護理項目。諮詢時可以講低敏感情況同護理目標。",
    continueBooking: "前往預約",
    bookingNote: "預約頁面會喺新分頁打開。",
    footerTagline: "源自香港嘅草本面部護理。",
    footerVisit: "倫敦預約",
    footerDetails: "工作室資料",
    privacyTitle: "私隱",
    privacyCopy: "本網站唔會收集個人資料。外部預約同社交平台適用各自嘅私隱條款。",
    termsTitle: "護理資料",
    termsCopy: "護理是否適合同預期效果會喺諮詢時討論，個人效果會有所不同。",
    rights: "保留所有權利。",
    menuOpen: "打開選單",
    menuClose: "關閉選單",
    bookingFallbackNote: "目前可以透過 Instagram 喺新分頁進行查詢。"
  }
};

let currentLang = localStorage.getItem("hailey-language") || "en";
if (!translations[currentLang]) currentLang = "en";

const menuToggle = document.querySelector("[data-menu-toggle]");
const siteMenu = document.querySelector("[data-site-menu]");
const bookingNote = document.querySelector(".booking-note");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function translatePage(lang) {
  currentLang = translations[lang] ? lang : "en";
  const languageCodes = { en: "en", zh: "zh-Hans", yue: "zh-Hant" };
  document.documentElement.lang = languageCodes[currentLang];

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (translations[currentLang][key]) element.textContent = translations[currentLang][key];
  });

  document.querySelectorAll("[data-lang]").forEach((button) => {
    const isActive = button.dataset.lang === currentLang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  localStorage.setItem("hailey-language", currentLang);
  applyBookingDestination();
  updateMenuLabel();
}

function applyBookingDestination() {
  const destination = SITE_CONFIG.bookingUrl;
  document.querySelectorAll("[data-booking-link]").forEach((link) => {
    if (!destination) {
      link.hidden = false;
      link.removeAttribute("href");
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("aria-label", translations[currentLang].bookNow);
      return;
    }
    link.hidden = false;
    link.href = destination;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.removeAttribute("aria-disabled");
    link.setAttribute("aria-label", translations[currentLang].continueBooking);
  });

  document.querySelectorAll("[data-booking-label]").forEach((label) => {
    if (!destination) label.textContent = translations[currentLang].bookNow;
  });

  if (bookingNote) bookingNote.hidden = !destination;
}

function applySiteConfig() {
  const socialUrls = {
    instagram: SITE_CONFIG.instagramUrl,
    tiktok: SITE_CONFIG.tiktokUrl,
    rednote: SITE_CONFIG.rednoteUrl,
    whatsapp: SITE_CONFIG.whatsappUrl,
    facebook: SITE_CONFIG.facebookUrl
  };

  document.querySelectorAll("[data-social]").forEach((link) => {
    const url = socialUrls[link.dataset.social];
    link.hidden = !url;
    if (url) link.href = url;
  });

  document.querySelectorAll("[data-price-open]").forEach((link) => {
    link.href = SITE_CONFIG.treatmentPdf;
  });

  const canonical = document.querySelector("[data-canonical]");
  if (SITE_CONFIG.canonicalUrl) {
    canonical.href = SITE_CONFIG.canonicalUrl;
  } else {
    canonical.remove();
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: SITE_CONFIG.name,
    description: document.querySelector('meta[name="description"]').content,
    image: SITE_CONFIG.socialImage,
    sameAs: [
      SITE_CONFIG.instagramUrl,
      SITE_CONFIG.tiktokUrl,
      SITE_CONFIG.rednoteUrl,
      SITE_CONFIG.facebookUrl
    ].filter(Boolean)
  };
  if (SITE_CONFIG.canonicalUrl) structuredData.url = SITE_CONFIG.canonicalUrl;
  if (SITE_CONFIG.phone) structuredData.telephone = SITE_CONFIG.phone;
  if (SITE_CONFIG.address) structuredData.address = SITE_CONFIG.address;
  if (SITE_CONFIG.openingHours.length) structuredData.openingHours = SITE_CONFIG.openingHours;
  document.querySelector("[data-structured-data]").textContent = JSON.stringify(structuredData);
}

function setMenu(open) {
  document.body.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  updateMenuLabel();
  if (open) siteMenu.querySelector("a")?.focus();
}

function updateMenuLabel() {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-label", translations[currentLang][isOpen ? "menuClose" : "menuOpen"]);
}

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => translatePage(button.dataset.lang));
});

menuToggle.addEventListener("click", () => {
  setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
    setMenu(false);
    menuToggle.focus();
  }
});

document.querySelectorAll(".site-nav a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

const priceTabs = [...document.querySelectorAll(".price-tab")];

function activatePriceTab(tab, moveFocus = false) {
  priceTabs.forEach((item) => {
    const isActive = item === tab;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
    item.tabIndex = isActive ? 0 : -1;

    const itemPanel = document.getElementById(item.getAttribute("aria-controls"));
    itemPanel.hidden = !isActive;
    itemPanel.classList.toggle("is-active", isActive);
  });

  if (moveFocus) tab.focus();
  tab.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth", block: "nearest", inline: "center" });
}

priceTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activatePriceTab(tab));
  tab.addEventListener("keydown", (event) => {
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % priceTabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + priceTabs.length) % priceTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = priceTabs.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    activatePriceTab(priceTabs[nextIndex], true);
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.01, rootMargin: "10% 0px 10%" }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
  revealObserver.observe(element);
});

const sections = [...document.querySelectorAll("main > section[id]")];
const navLinks = [...document.querySelectorAll(".site-nav a")];
const activeSectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => {
      const isCurrent = link.getAttribute("href") === `#${visible.target.id}`;
      if (isCurrent) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  },
  { threshold: [0.18, 0.45], rootMargin: "-18% 0px -55%" }
);
sections.forEach((section) => activeSectionObserver.observe(section));

document.documentElement.classList.add("reveal-ready");

let depthFrame;
function updateDepth() {
  depthFrame = undefined;
  if (prefersReducedMotion.matches || window.innerWidth < 760) return;
  document.querySelectorAll("[data-depth]").forEach((element) => {
    const rect = element.getBoundingClientRect();
    const distance = rect.top + rect.height / 2 - window.innerHeight / 2;
    const offset = Math.max(-22, Math.min(22, -distance * Number(element.dataset.depth)));
    element.style.setProperty("--depth-y", `${offset}px`);
  });
}

window.addEventListener(
  "scroll",
  () => {
    if (!depthFrame) depthFrame = window.requestAnimationFrame(updateDepth);
  },
  { passive: true }
);
window.addEventListener("resize", updateDepth);

document.querySelector("[data-year]").textContent = new Date().getFullYear();
applySiteConfig();
translatePage(currentLang);
updateDepth();

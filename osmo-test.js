/*
  core.js — Studio Olimpo Blueprint
  LUXURY VERSION v5.0

  Architecture: Osmo Boilerplate
  Features: All Studio Olimpo functionalities
  Pattern: Function Registry + Overlapping Parallax Transition

  CODE MAP
  ─────────────────────────────────────────
  1. SETUP & GLOBALS
  2. CONFIG
  3. HERO REGISTRY
  4. FUNCTION REGISTRY (Osmo pattern)
  5. PAGE TRANSITIONS (Overlapping Parallax)
  6. BARBA HOOKS + INIT
  7. GENERIC + HELPERS
  8. YOUR FUNCTIONS (all Studio Olimpo features)
  ─────────────────────────────────────────
*/

// -----------------------------------------
// 1. SETUP & GLOBALS
// -----------------------------------------

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

const hasLenis      = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
const hasSplitText  = typeof window.SplitText !== "undefined";
const hasBarba      = typeof window.barba !== "undefined";
const $             = window.jQuery || window.$;

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));
rmMQ.addListener?.(e => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);
const log = (...args) => CONFIG.debug && console.log("[CORE]", ...args);

// Osmo easings
CustomEase.create("osmo",      "0.625, 0.05, 0, 1");
CustomEase.create("parallax",  "0.7, 0.05, 0.13, 1");
CustomEase.create("main",      "0.62, 0.05, 0.01, 0.99");
CustomEase.create("mainOut",   "0.55, 0.05, 0.18, 1");

gsap.defaults({ ease: "osmo", duration: 0.6 });


// -----------------------------------------
// 2. CONFIG
// -----------------------------------------

const CONFIG = {
  debug: false,

  lenis: {
    lerp: 0.075,
    wheelMultiplier: 1,
    touchMultiplier: 1.2,
  },

  loader: {
    minDuration: 2500,
    fadeOutDuration: 1.2,
  },

  transition: {
    leaveToY: "-30vh",
    enterFromY: "100vh",
    slideDuration: 1.2,
    heroDelay: 0.7,
  },

  sections: {
    duration: 1.6,
    stagger: 0.3,
    childStagger: 0.2,
    ease: "power2.out",
    triggerStart: "top 85%",
  },

  revealChildren: {
    stagger: 0.3,
    duration: 1.8,
    delay: 0.2,
    ease: "power2.out",
    minCount: 2,
  },

  dividers: {
    duration: 1.6,
    stagger: 0.3,
    childStagger: 0.12,
    ease: "power2.out",
    triggerStart: "top 92%",
  },

  overlap: {
    loaderToHero: -0.3,
    heroToSections: -0.5,
  },

  viewport: {
    aboveThreshold: 0.9,
  },

  splitText: {
    lines:  { duration: 0.8, stagger: 0.08 },
    words:  { duration: 0.6, stagger: 0.06 },
    chars:  { duration: 0.4, stagger: 0.01 },
  },

  scrollDir: {
    enabled: true,
    desktopNavSelector: ".nav_desktop_wrap",
    desktopMinWidth: "60em",
    minDelta: 6,
    startedY: 80,
    desktopHideYPercent: -100,
    tweenDur: 0.7,
    ease: "power2.out",
    animateOpacity: true,
    transitionFadeDur: 0.3,
  },

  slideshow: {
    overlayBackground: "var(--swatch--dark-900-o40)",
    overlayOpacity: 1,
    autoplayDelay: 5000,
    animationDuration: 2.0,
  },

  formSuccess: {
    enabled: true,
    overlaySelector: "[data-success]",
    defaultRedirectUrl: "/",
    defaultRedirectDelay: 1800,
    pollTimeout: 8000,
    pollEvery: 120,
  },

  menu: {
    shiftY: 30,
    shiftDuration: 0.9,
    shiftEase: "power2.out",
  },
};


// -----------------------------------------
// 3. HERO REGISTRY
// -----------------------------------------

const HERO_REGISTRY = {
  home: {
    duration: 2.2, stagger: 0.3,
    mediaFirst: true, mediaDelay: 0, mediaDuration: 1,
    mediaToContentGap: -0.5,
    revealAnchor: "contentStart", revealOffset: -1.5,
  },
  collection: {
    duration: 1.2, stagger: 0.15,
    mediaDelay: 0, mediaDuration: 0,
    revealOffset: null,
  },
  villa: {
    duration: 1.6, stagger: 0.15,
    mediaDelay: 0.8, mediaDuration: 1.8,
    revealAnchor: "done", revealOffset: -1.2,
  },
  philosophy: {
    duration: 1.8, stagger: 0.12,
    mediaFirst: true, mediaDelay: 0, mediaDuration: 0.9,
    mediaToContentGap: 0,
    revealAnchor: "contentStart", revealOffset: -0.06,
  },
  inquire: {
    duration: 1.8, stagger: 0.15,
    mediaDelay: 0, mediaDuration: 0,
    revealOffset: -1.0,
  },
  apply: {
    duration: 1.8, stagger: 0.15,
    mediaDelay: 0, mediaDuration: 0,
    revealOffset: null,
  },
  rates: {
    duration: 1.0, stagger: 0.1,
    mediaDelay: 0, mediaDuration: 0,
    revealOffset: null,
  },
  error: {
    duration: 1.3, stagger: 0.12,
    mediaDelay: 0.2, mediaDuration: 1.5,
    revealOffset: null,
  },
};

const HERO_DEFAULT = {
  duration: 1.2, stagger: 0.12,
  mediaDelay: 0.2, mediaDuration: 1.4,
  revealOffset: null,
};


// -----------------------------------------
// 4. FUNCTION REGISTRY (Osmo pattern)
// -----------------------------------------

function initOnceFunctions() {
  initLenis();

  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  // Global safety
  bindGlobalSafety();

  // Same-page click guard
  preventSamePageClicks();

  // Custom cursor (outside Barba container)
  initCustomCursor();

  // Console signature
  initSignature();

  // Menu (outside Barba container)
  initMenu();

  // Prefetch nav links
  prefetchNavLinks();

  // Scroll direction (desktop nav hide/show)
  initScrollDirection();

  // Webflow forms resume handlers
  bindWebflowFormsResume();

  log("Once functions initialized");
}


function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  // preparePage must run BEFORE enter animation
  preparePage(next);
}


function initAfterEnterFunctions(next) {
  nextPage = next || document;
  const namespace = getNamespace(next);

  // Webflow forms re-init
  reinitWebflowForms();

  // Dynamic year
  initDynamicYear(next);

  // Sliders (Swiper)
  initSlidersSimple(next);

  // Slideshow (non-crisp, fadeshow)
  initSlideshow(next, namespace);

  // Crisp slideshow (home — both once and transitions)
  if (namespace === "home") {
    initCrispSlideshows(next);
  }

  // Form success overlay
  initFormSuccess(next);

  // Theme scroll animation
  initThemeScrollAnimation(next);

  // Mail button hover theme (contact only)
  if (namespace === "contact") {
    initMailButtonTheme(next);
  }

  // Sticky top
  initStickyTop(next);

  // Smooothy auto-scroll slider
  initSmoothySlider(next);

  // CMS next/prev
  initCmsNextPrev(next);

  // Masked text scroll reveal
  // HOME ONCE: skip — runLoaderHome handles SplitText internally
  // and marks targets with soSplitInit before this runs.
  // HOME TRANSITION + all other pages: run normally.
  if (!(namespace === "home" && !loaderDone)) {
    initMaskTextScrollReveal(next);
  }

  // Settle
  if (hasLenis && lenis) {
    lenis.resize();
  }
  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }

  log(`After-enter functions initialized: ${namespace}`);
}


// -----------------------------------------
// 5. PAGE TRANSITIONS (Overlapping Parallax)
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();
  const namespace = getNamespace(next);

  tl.call(() => {
    resetPage(next);
  }, null, 0);

  if (namespace === "home") {
    // Home: crisp loader handles hero + reveals
    return new Promise(async (resolve) => {
      await runLoaderHome(next, () => {
        // Start below-fold reveals
        const { below } = classifyReveals(next);
        setupBelowFold(below);

        // Start crisp slideshow autoplay
        next.querySelectorAll('[data-slideshow="wrap"]').forEach(wrap => {
          wrap.__slideshowStart?.();
        });

        // Init SplitText for non-hero headings (hero ones were handled by loader)
        initMaskTextScrollReveal(next);
      });
      resolve();
    });
  }

  // Non-home: standard loader → hero → reveals
  return new Promise(async (resolve) => {
    await runLoader(() => {
      createRevealSequence(next);
    });
    resolve();
  });
}


function runPageLeaveAnimation(current, next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionDark = transitionWrap?.querySelector("[data-transition-dark]");

  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
    }
  });

  if (reducedMotion) {
    return tl.set(current, { autoAlpha: 0 });
  }

  if (!transitionWrap || !transitionDark) {
    tl.to(current, { autoAlpha: 0, duration: 0.4 });
    return tl;
  }

  // z-index: if menu was open, put transition between next(50) and nav(40)
  const fromMenu = !!window.__navWasOpen;
  tl.set(transitionWrap, { zIndex: fromMenu ? 45 : 2 });

  // Dark overlay to 80%
  tl.fromTo(transitionDark,
    { autoAlpha: 0 },
    { autoAlpha: 0.8, duration: 1.2, ease: "parallax" },
    0
  );

  // Current container slides up (parallax)
  tl.fromTo(current,
    { y: "0vh" },
    { y: CONFIG.transition.leaveToY, duration: 1.2, ease: "parallax" },
    0
  );

  // Nav wrap follows current container if menu was open
  if (fromMenu) {
    const navWrap = document.querySelector(".nav_wrap");
    if (navWrap) {
      tl.fromTo(navWrap,
        { y: "0vh" },
        { y: CONFIG.transition.leaveToY, duration: 1.2, ease: "parallax" },
        0
      );
    }
  }

  // Desktop nav bar: micro hide
  const desktopNav = document.querySelector(CONFIG.scrollDir.desktopNavSelector);
  if (desktopNav) {
    tl.to(desktopNav, {
      y: -12, autoAlpha: 0,
      duration: 0.5, ease: "power2.in",
    }, 0.1);
  }

  // Reset dark overlay
  tl.set(transitionDark, { autoAlpha: 0 });

  return tl;
}


function runPageEnterAnimation(next) {
  const tl = gsap.timeline();
  const namespace = getNamespace(next);
  const fromMenu = !!window.__navWasOpen;

  if (reducedMotion) {
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 0);

  // z-index: next container on top
  tl.set(next, { zIndex: fromMenu ? 50 : 3 });

  // Slide up from bottom
  tl.fromTo(next,
    { y: "100vh" },
    {
      y: "0vh",
      duration: 1.2,
      ease: "parallax",
      clearProps: "all",
    },
    "startEnter"
  );

  // Reset nav if menu was open (at t=1.0s, next covers viewport)
  if (fromMenu) {
    tl.call(() => {
      resetNavAfterTransition();
      window.__navWasOpen = false;
    }, null, 1.0);
  }

  // Hero start callback
  const heroAt = CONFIG.transition.heroDelay;
  tl.call(() => {
    // Apply theme on body NOW that next covers viewport
    applyBodyTheme(next);

    // Reset desktop nav position
    resetScrollDirection();

    // Start hero + reveals
    if (namespace === "home") {
      // HOME VIA TRANSITION: no loader, no hero animation.
      // is--loading + is--hidden already removed in preparePage.
      // Slider + content are already visible. Just start slideshow autoplay
      // and set up below-fold reveals.
      next.querySelectorAll('[data-slideshow="wrap"]').forEach(wrap => {
        wrap.__slideshowStart?.();
      });

      const { below } = classifyReveals(next);
      setupBelowFold(below);
    } else {
      createRevealSequence(next);
    }
  }, null, heroAt);

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}


// -----------------------------------------
// 6. BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.beforeEnter(data => {
  // Position new container on top (fixed, full screen, hidden below viewport)
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    autoAlpha: 1,
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if (hasScrollTrigger) {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
});

barba.hooks.enter(data => {
  initBarbaNavUpdate(data);
});

barba.hooks.afterEnter(data => {
  initAfterEnterFunctions(data.next.container);

  if (hasLenis && lenis) {
    lenis.resize();
    lenis.start();
  }
  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
});

barba.init({
  debug: CONFIG.debug,
  timeout: 7000,
  preventRunning: true,

  transitions: [
    {
      name: "olimpo-parallax",
      sync: true,

      // First load
      async once(data) {
        initOnceFunctions();
        initBeforeEnterFunctions(data.next.container);
        initAfterEnterFunctions(data.next.container);
        return runPageOnceAnimation(data.next.container);
      },

      // Current page leaves
      async leave(data) {
        return runPageLeaveAnimation(data.current.container, data.next.container);
      },

      // New page enters
      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      },
    },
  ],
});


// -----------------------------------------
// 7. GENERIC + HELPERS
// -----------------------------------------

function getNamespace(container) {
  return container?.getAttribute("data-barba-namespace") || "default";
}

function getRoot(scope) {
  return scope && typeof scope.querySelectorAll === "function" ? scope : document;
}

function isDesktop() {
  return !!window.matchMedia && window.matchMedia("(min-width: 60em)").matches;
}

function prefersReducedMotionCheck() {
  return !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}


// Theme config (Osmo pattern)
const themeConfig = {
  light: { nav: "dark",  transition: "light" },
  dark:  { nav: "light", transition: "dark"  },
};

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;

  const transitionEl = document.querySelector("[data-transition-wrap]");
  if (transitionEl) {
    transitionEl.dataset.themeTransition = config.transition;
  }

  const nav = document.querySelector("[data-theme-nav]");
  if (nav) {
    nav.dataset.themeNav = config.nav;
  }
}

function applyBodyTheme(container) {
  const namespace = getNamespace(container);
  try {
    if (window.colorThemes?.getTheme) {
      const lightVars = window.colorThemes.getTheme("light");
      if (lightVars) {
        gsap.set(document.body, lightVars);
        gsap.set(document.documentElement, lightVars);
      }
    }
  } catch (_) {}
}


function initLenis() {
  if (lenis) return;
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: CONFIG.lenis.lerp,
    wheelMultiplier: CONFIG.lenis.wheelMultiplier,
    touchMultiplier: CONFIG.lenis.touchMultiplier,
  });

  window.lenis = lenis;

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  log("Lenis initialized");
}


function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right,width,zIndex,y" });

  if (hasLenis && lenis) {
    lenis.scrollTo(0, { immediate: true });
    lenis.resize();
    lenis.start();
  }
}


function initBarbaNavUpdate(data) {
  if (!data?.next?.html) return;

  const tpl = document.createElement("template");
  tpl.innerHTML = data.next.html.trim();
  const nextNodes = tpl.content.querySelectorAll('[data-barba-update="nav"]');
  const currentNodes = document.querySelectorAll('[data-barba-update="nav"]');

  currentNodes.forEach(function (curr, index) {
    const next = nextNodes[index];
    if (!next) return;

    const newStatus = next.getAttribute("aria-current");
    if (newStatus !== null) {
      curr.setAttribute("aria-current", newStatus);
    } else {
      curr.removeAttribute("aria-current");
    }

    const newClassList = next.getAttribute("class") || "";
    curr.setAttribute("class", newClassList);
  });
}


// Minimal global scroll API (for overlays/menus)
window.AppScroll = {
  lock() {
    if (lenis && typeof lenis.stop === "function") {
      lenis.stop();
    } else {
      document.documentElement.classList.add("is-scroll-locked");
      document.body.classList.add("is-scroll-locked");
    }
  },
  unlock() {
    if (lenis && typeof lenis.start === "function") {
      lenis.start();
    } else {
      document.documentElement.classList.remove("is-scroll-locked");
      document.body.classList.remove("is-scroll-locked");
    }
  },
};


// -----------------------------------------
// 8. YOUR FUNCTIONS (Studio Olimpo features)
// -----------------------------------------


/* =========================
   GLOBAL SAFETY
========================= */

function bindGlobalSafety() {
  if (window.__coreSafetyBound) return;
  window.__coreSafetyBound = true;

  window.addEventListener("unhandledrejection", (e) => {
    const msg = e?.reason?.message || String(e?.reason || "");
    if (msg.includes("No checkout popup config found")) {
      console.warn("[CORE] Optional checkout popup missing, ignoring");
      try { e.preventDefault(); } catch (_) {}
    }
  });
}


/* =========================
   PREVENT SAME PAGE CLICKS
========================= */

function preventSamePageClicks() {
  if (window.__samePageGuardBound) return;
  window.__samePageGuardBound = true;

  const norm = (p) =>
    (p || "").replace(/\/index\.html?$/i, "").replace(/\/+$/g, "") || "/";

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a) return;

    const href = a.getAttribute("href") || "";
    const h = href.trim().toLowerCase();
    if (
      e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
      e.button === 1 || a.target === "_blank" || a.hasAttribute("download") ||
      !href || h === "#" || h.startsWith("javascript:") ||
      h.startsWith("mailto:") || h.startsWith("tel:")
    ) return;

    let dest;
    try { dest = new URL(href, location.href); } catch { return; }
    if (dest.origin !== location.origin) return;

    const sameBase = norm(dest.pathname) === norm(location.pathname) &&
                     dest.search === location.search;
    if (!sameBase) return;

    e.preventDefault();

    if (dest.hash) {
      const id = decodeURIComponent(dest.hash.slice(1));
      const target = document.getElementById(id);
      if (target) {
        window.lenis?.scrollTo
          ? window.lenis.scrollTo(target)
          : target.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    if ((window.scrollY || 0) < 2) return;
    window.lenis?.scrollTo
      ? window.lenis.scrollTo(0)
      : window.scrollTo({ top: 0, behavior: "smooth" });
  }, true);
}


/* =========================
   CUSTOM CURSOR
========================= */

function initCustomCursor() {
  if (window.__customCursorInit) return;
  window.__customCursorInit = true;

  const cursorEl = document.querySelector(".cursor");
  if (!cursorEl) return;

  gsap.set(cursorEl, {
    xPercent: -50, yPercent: -50,
    willChange: "transform",
    pointerEvents: "none", userSelect: "none",
  });

  const xTo = gsap.quickTo(cursorEl, "x", { duration: 0.6, ease: "power3" });
  const yTo = gsap.quickTo(cursorEl, "y", { duration: 0.6, ease: "power3" });

  window.addEventListener("mousemove", (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
  });
}


/* =========================
   SIGNATURE
========================= */

function initSignature() {
  if (window.__signatureInit) return;
  window.__signatureInit = true;

  console.log(
    "%cCredits: Studio Olimpo | Above the ordinary – %chttps://www.studioolimpo.it",
    "background:#F8F6F1; color:#000; font-size:12px; padding:10px 0 10px 14px;",
    "background:#F8F6F1; color:#000; font-size:12px; padding:10px 14px 10px 0;"
  );
}


/* =========================
   MENU (nav outside Barba container)
========================= */

function initMenu() {
  const navWrap          = document.querySelector(".nav_wrap");
  if (!navWrap) return;

  const overlay          = navWrap.querySelector(".nav_overlay");
  const menu             = navWrap.querySelector(".nav_menu");
  const bgPanels         = navWrap.querySelectorAll(".nav_menu_panel");
  const menuToggles      = document.querySelectorAll("[data-menu-toggle]");
  const menuLinks        = navWrap.querySelectorAll(".u-text-style-h1");
  const menuIndexs       = navWrap.querySelectorAll(".nav_menu_index");
  const menuButton       = document.querySelector(".menu_btn_wrap");
  const menuButtonLayout = menuButton ? menuButton.querySelectorAll(".menu_btn_layout") : [];
  const menuDivider      = navWrap.querySelectorAll(".nav_menu_divider");
  const menuList         = navWrap.querySelector(".nav_menu_list");
  const menuFooter       = navWrap.querySelector(".nav_menu_footer");

  let barbaContainer = document.querySelector("[data-barba='container']");
  const SHIFT_Y = CONFIG.menu.shiftY;
  const SHIFT_DURATION = CONFIG.menu.shiftDuration;
  const SHIFT_EASE = CONFIG.menu.shiftEase;

  let tl = gsap.timeline();

  const openNav = () => {
    navWrap.setAttribute("data-nav", "open");
    barbaContainer = document.querySelector("[data-barba='container']");

    tl.clear()
      .set(navWrap,         { display: "block" })
      .set(menu,            { yPercent: 0 }, "<")
      .set(menuDivider,     { autoAlpha: 1, scaleX: 0 }, "<")
      .set(menuLinks,       { autoAlpha: 0, yPercent: 120 }, "<")
      .set(menuIndexs,      { autoAlpha: 0, yPercent: 80 }, "<")
      .set(menuFooter,      { autoAlpha: 0, yPercent: 30 }, "<")
      .set(menuButtonLayout,{ yPercent: 0 }, "<")
      .set(overlay,         { autoAlpha: 0 }, "<")
      .set(bgPanels,        { yPercent: 101 }, "<")
      .set(menuList,        { yPercent: 40 }, "<")
      .fromTo(overlay,         { autoAlpha: 0 },      { autoAlpha: 1, duration: 0.8, ease: "power2.out" }, "<")
      .fromTo(bgPanels,        { yPercent: 101 },      { yPercent: 0, duration: 0.85 }, "<0.05")
      .fromTo(menuButtonLayout,{ yPercent: 0 },         { yPercent: -150, duration: 1 }, "<")
      .to(barbaContainer,      { y: -SHIFT_Y, duration: SHIFT_DURATION, ease: SHIFT_EASE }, "<0.05")
      .fromTo(menuList,        { yPercent: 40 },        { yPercent: 0, duration: 1 }, "<0.15")
      .fromTo(menuLinks,       { autoAlpha: 0, yPercent: 120 }, { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08 }, "<0.1")
      .fromTo(menuIndexs,      { yPercent: 80, autoAlpha: 0 },  { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08 }, "<0.05")
      .fromTo(menuDivider,     { scaleX: 0, transformOrigin: "left" }, { scaleX: 1, stagger: 0.06, duration: 0.9 }, "<0.1")
      .fromTo(menuFooter,      { autoAlpha: 0, yPercent: 30 },  { autoAlpha: 1, yPercent: 0, duration: 0.7 }, "<0.3");
  };

  const closeNav = () => {
    navWrap.setAttribute("data-nav", "closed");
    barbaContainer = document.querySelector("[data-barba='container']");

    tl.clear()
      .to(menuLinks,        { yPercent: -60, autoAlpha: 0, duration: 0.45, stagger: 0.03, ease: "mainOut" })
      .to(menuIndexs,       { autoAlpha: 0, duration: 0.3 }, "<")
      .to(menuDivider,      { scaleX: 0, transformOrigin: "right center", duration: 0.4, ease: "mainOut" }, "<")
      .to(menuFooter,       { autoAlpha: 0, yPercent: 20, duration: 0.35 }, "<")
      .to(barbaContainer,   { y: 0, duration: 0.3, ease: "power2.inOut" }, "<")
      .to(menuButtonLayout, { yPercent: 0, duration: 0.9 }, "<")
      .set(barbaContainer,  { y: SHIFT_Y })
      .to(bgPanels,         { yPercent: -101, duration: 0.65, ease: "mainOut" }, "<")
      .to(overlay,          { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" }, "<")
      .to(barbaContainer,   { y: 0, duration: SHIFT_DURATION, ease: SHIFT_EASE }, "<0.2")
      .set(navWrap,         { display: "none" })
      .set(barbaContainer,  { clearProps: "y" });
  };

  // Toggle button
  menuToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      if (navWrap.getAttribute("data-nav") === "open") {
        closeNav();
        try { window.lenis?.start?.(); } catch (_) {}
      } else {
        openNav();
        try { window.lenis?.stop?.(); } catch (_) {}
      }
    });
  });

  // Link click inside menu
  if ($) {
    $("a").on("click", function (e) {
      if (
        $(this).prop("hostname") === window.location.host &&
        $(this).attr("href").indexOf("#") === -1 &&
        $(this).attr("target") !== "_blank" &&
        navWrap.getAttribute("data-nav") === "open"
      ) {
        e.preventDefault();
        const href = $(this).attr("href");

        if (window.location.pathname === href) {
          closeNav();
          try { window.lenis?.start?.(); } catch (_) {}
        } else {
          tl.kill();
          window.__navWasOpen = true;
          try { window.lenis?.start?.(); } catch (_) {}
          barba.go(href);
        }
      }
    });
  }
}


function resetNavAfterTransition() {
  const navWrap = document.querySelector(".nav_wrap");
  if (!navWrap) return;

  gsap.killTweensOf(navWrap);
  gsap.set(navWrap, { clearProps: "y,transform" });
  navWrap.setAttribute("data-nav", "closed");
  navWrap.style.display = "none";

  const btnLayout = document.querySelectorAll(".menu_btn_layout");
  if (btnLayout.length) gsap.to(btnLayout, { yPercent: 0, duration: 0.9, ease: "main" });

  const transitionWrap = document.querySelector("[data-transition-wrap]");
  if (transitionWrap) gsap.set(transitionWrap, { zIndex: 2 });
}


/* =========================
   PREFETCH NAV LINKS
========================= */

function prefetchNavLinks() {
  if (window.__navPrefetchDone) return;
  window.__navPrefetchDone = true;

  const navWrap = document.querySelector(".nav_wrap");
  if (!navWrap || !barba) return;

  navWrap.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin || href.includes("#") ||
          href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (url.pathname === location.pathname) return;
      barba.prefetch(href);
    } catch (_) {}
  });
}


/* =========================
   SCROLL DIRECTION (desktop nav hide/show)
========================= */

let scrollDirController = null;

function initScrollDirection() {
  if (!CONFIG.scrollDir.enabled) return;

  const desktopNav = document.querySelector(CONFIG.scrollDir.desktopNavSelector);
  if (!desktopNav) return;

  let lastScrollY = window.scrollY || 0;
  let ticking = false;
  let navHidden = false;
  let isPaused = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const y = window.scrollY || 0;
      if (isPaused) { lastScrollY = y; ticking = false; return; }
      if (Math.abs(y - lastScrollY) < CONFIG.scrollDir.minDelta) { ticking = false; return; }

      const direction = y > lastScrollY ? "down" : "up";
      const started = y > CONFIG.scrollDir.startedY;
      lastScrollY = y;

      try {
        document.body.setAttribute("data-scrolling-direction", direction);
        document.body.setAttribute("data-scrolling-started", String(started));
      } catch (_) {}

      if (isDesktop()) {
        if (direction === "down" && started && !navHidden) {
          gsap.to(desktopNav, {
            yPercent: CONFIG.scrollDir.desktopHideYPercent,
            opacity: 0,
            duration: CONFIG.scrollDir.tweenDur,
            ease: CONFIG.scrollDir.ease,
            overwrite: true,
          });
          navHidden = true;
        }
        if (direction === "up" && navHidden) {
          gsap.to(desktopNav, {
            yPercent: 0, opacity: 1,
            duration: CONFIG.scrollDir.tweenDur,
            ease: CONFIG.scrollDir.ease,
            overwrite: true,
          });
          navHidden = false;
        }
      }

      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  scrollDirController = {
    pause(state) { isPaused = !!state; lastScrollY = window.scrollY || 0; },
    reset() {
      gsap.killTweensOf(desktopNav);
      gsap.set(desktopNav, { yPercent: 0 });
      if (navHidden) {
        gsap.fromTo(desktopNav, { opacity: 0 }, {
          opacity: 1,
          duration: CONFIG.scrollDir.transitionFadeDur,
          ease: CONFIG.scrollDir.ease,
        });
      } else {
        gsap.set(desktopNav, { opacity: 1 });
      }
      navHidden = false;
    },
  };
}

function resetScrollDirection() {
  try { scrollDirController?.pause(true); } catch (_) {}
  try {
    const desktopNav = document.querySelector(CONFIG.scrollDir.desktopNavSelector);
    if (desktopNav) gsap.set(desktopNav, { clearProps: "y" });
  } catch (_) {}
  try { scrollDirController?.reset(); } catch (_) {}
  try { scrollDirController?.pause(false); } catch (_) {}
}


/* =========================
   WEBFLOW FORMS RE-INIT
========================= */

function reinitWebflowForms() {
  const wf = window.Webflow;
  if (!wf) return;
  try {
    if (typeof wf.require === "function") {
      const forms = wf.require("forms");
      if (forms && typeof forms.ready === "function") forms.ready();
    }
  } catch (_) {}
  try {
    if (typeof wf.ready === "function") wf.ready();
  } catch (_) {}
}

function bindWebflowFormsResume() {
  if (window.__wfFormsResumeBound) return;
  window.__wfFormsResumeBound = true;

  window.addEventListener("pageshow", (e) => {
    if (e && e.persisted) { try { reinitWebflowForms(); } catch (_) {} }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") { try { reinitWebflowForms(); } catch (_) {} }
  });
}


/* =========================
   DYNAMIC YEAR
========================= */

function initDynamicYear(scope = document) {
  const year = String(new Date().getFullYear());
  const root = getRoot(scope);
  const all = new Set([
    ...root.querySelectorAll("[data-dynamic-year]"),
    ...document.querySelectorAll("[data-dynamic-year]"),
  ]);
  all.forEach((el) => { el.textContent = year; });
}


/* =========================
   DOM HELPERS
========================= */

function getAnimatableChildren(el) {
  if (!el) return [];
  let container = el;
  if (el.classList.contains("u-display-contents")) {
    container = el.querySelector(".u-content-wrapper") || el;
  }
  return Array.from(container.children).filter((child) => {
    if (child.classList.contains("w-condition-invisible")) return false;
    if (child.classList.contains("u-embed-css")) return false;
    if (child.classList.contains("w-embed")) return false;
    if (child.tagName === "STYLE") return false;
    return true;
  });
}

function getStaggerableElements(section) {
  if (!section) return [];
  return Array.from(section.querySelectorAll("[data-reveal-children='stagger']"))
    .filter((el) => {
      if (el.classList.contains("w-condition-invisible")) return false;
      if (el.classList.contains("swiper-slide-duplicate")) return false;
      return true;
    });
}

function getRealElement(el) {
  if (!el) return null;
  if (el.classList.contains("u-display-contents")) {
    return el.querySelector(".u-content-wrapper") || el;
  }
  return el;
}

function flattenDisplayContents(slot) {
  if (!slot) return;
  let child = slot.firstElementChild;
  while (child && child.classList.contains("u-display-contents")) {
    while (child.firstChild) slot.insertBefore(child.firstChild, child);
    slot.removeChild(child);
    child = slot.firstElementChild;
  }
}

function getHeroConfig(namespace) {
  return HERO_REGISTRY[namespace] || HERO_DEFAULT;
}


/* =========================
   PREPARE PAGE
========================= */

function preparePage(container) {
  if (!container) return;
  const namespace = getNamespace(container);

  gsap.set(container, { autoAlpha: 1 });

  // Reset theme to light on the incoming container only
  try {
    if (window.colorThemes?.getTheme) {
      const lightVars = window.colorThemes.getTheme("light");
      if (lightVars) gsap.set(container, lightVars);
    }
  } catch (_) {}

  // HOME: crisp-header management
  if (namespace === "home") {
    const crispHeader = container.querySelector(".crisp-header");

    if (crispHeader) {
      if (loaderDone) {
        // TRANSITION ENTER (not first load):
        // Remove is--loading + is--hidden so slider is visible, loader is hidden.
        // Container is still off-screen (y:100vh), zero flash.
        crispHeader.classList.remove("is--loading", "is--hidden");
      } else {
        // FIRST LOAD (once):
        // Keep is--loading + is--hidden — runLoaderHome handles them.
        // Pre-set logo paths below mask.
        const logoLeft = container.querySelector(".crisp-loader__logo .logo_text.is--left");
        const logoRight = container.querySelector(".crisp-loader__logo .logo_text.is--right");
        const leftPaths = logoLeft ? Array.from(logoLeft.querySelectorAll("path")) : [];
        const rightPaths = logoRight ? Array.from(logoRight.querySelectorAll("path")) : [];
        if (leftPaths.length) gsap.set(leftPaths, { yPercent: 300 });
        if (rightPaths.length) gsap.set(rightPaths, { yPercent: 300 });
      }
    }

    // Sections/dividers below fold: hide children
    container.querySelectorAll("[data-reveal='section'], [data-reveal='divider']").forEach(el => {
      const children = getAnimatableChildren(el);
      if (children.length) gsap.set(children, { autoAlpha: 0 });
      else gsap.set(getRealElement(el), { autoAlpha: 0 });
      const staggerable = getStaggerableElements(el);
      if (staggerable.length) gsap.set(staggerable, { autoAlpha: 0 });
    });
    return;
  }

  // Non-home: hide hero content + media
  const heroContent = container.querySelector("[data-hero-content]");
  if (heroContent) {
    const children = getAnimatableChildren(heroContent);
    if (children.length) gsap.set(children, { autoAlpha: 0 });
  }

  const heroMedia = container.querySelector("[data-hero-media]");
  if (heroMedia) {
    gsap.set(getRealElement(heroMedia), { autoAlpha: 0 });
  }

  // Apply text detection for pages without hero-content (like "apply")
  if (namespace === "apply") {
    const heroSection = container.querySelector("[data-hero]");
    const layout = heroSection?.querySelector(".u-layout-wrapper");
    if (layout) {
      const directChildren = layout.querySelectorAll(
        ".u-text, .u-rich-text, [data-wf--typography-heading--variant], [data-wf--typography-paragraph--variant]"
      );
      gsap.set(directChildren, { autoAlpha: 0 });
    }
  }

  // Sections
  container.querySelectorAll("[data-reveal='section']").forEach((section) => {
    const children = getAnimatableChildren(section);
    if (children.length) gsap.set(children, { autoAlpha: 0 });
    else gsap.set(getRealElement(section), { autoAlpha: 0 });
    const staggerable = getStaggerableElements(section);
    if (staggerable.length) gsap.set(staggerable, { autoAlpha: 0 });
  });

  // Dividers
  container.querySelectorAll("[data-reveal='divider']").forEach((divider) => {
    const children = getAnimatableChildren(divider);
    if (children.length) gsap.set(children, { autoAlpha: 0 });
    else gsap.set(getRealElement(divider), { autoAlpha: 0 });
  });

  log(`Page prepared: ${namespace}`);
}


/* =========================
   MASKED TEXT REVEAL (GSAP SplitText — Osmo pattern)
========================= */

function initMaskTextScrollReveal(scope = document) {
  if (!hasSplitText || !hasScrollTrigger) return;

  const root = getRoot(scope);
  const headings = root.querySelectorAll('[data-split="heading"]');
  if (!headings.length) return;

  // Wait for fonts before splitting
  const run = () => {
    headings.forEach((heading) => {
      if (heading.dataset.soSplitInit === "true") return;
      heading.dataset.soSplitInit = "true";

      // FOUC fix: reveal before splitting
      gsap.set(heading, { autoAlpha: 1, visibility: "visible" });

      const typeRaw = (heading.dataset.splitReveal || "lines").toLowerCase();
      const type = (typeRaw === "words" || typeRaw === "chars") ? typeRaw : "lines";

      const typesToSplit =
        type === "lines"  ? ["lines"] :
        type === "words"  ? ["lines", "words"] :
                            ["lines", "words", "chars"];

      // Rich text: split children instead of wrapper
      const isRichText = heading.classList?.contains("w-richtext") || heading.classList?.contains("w-rich-text");
      const splitTarget = isRichText ? Array.from(heading.children) : heading;

      // Hero headings play immediately (no ScrollTrigger)
      const isHeroHeading = !!(
        heading.closest("[data-hero]") ||
        heading.closest("[data-hero-content]") ||
        heading.closest("[data-hero-media]")
      );

      SplitText.create(splitTarget, {
        type: typesToSplit.join(", "),
        mask: "lines",
        autoSplit: true,
        linesClass: "line",
        wordsClass: "word",
        charsClass: "letter",
        onSplit(instance) {
          const targets = instance[type] || instance.lines;
          const cfg = CONFIG.splitText[type] || CONFIG.splitText.lines;

          if (reducedMotion) {
            try { gsap.set(targets, { clearProps: "all" }); } catch (_) {}
            return null;
          }

          if (isHeroHeading) {
            const isHome = !!heading.closest('[data-barba-namespace="home"]');
            return gsap.from(targets, {
              yPercent: 110,
              duration: cfg.duration,
              stagger: isHome ? 0.8 : cfg.stagger,
              ease: "expo.out",
              delay: 0.05,
            });
          }

          return gsap.from(targets, {
            yPercent: 110,
            duration: cfg.duration,
            stagger: cfg.stagger,
            ease: "expo.out",
            scrollTrigger: {
              trigger: heading,
              start: "clamp(top 92%)",
              once: true,
            },
          });
        },
      });
    });
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run).catch(run);
  } else {
    run();
  }
}


/* =========================
   ANIMATE HERO
========================= */

function animateHero(container) {
  const namespace = getNamespace(container);
  const config = getHeroConfig(namespace);
  const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

  const heroContent = container.querySelector("[data-hero-content]");
  const heroMedia = container.querySelector("[data-hero-media]");

  let applyTextElements = null;
  if (namespace === "apply" && !heroContent) {
    const heroSection = container.querySelector("[data-hero]");
    applyTextElements = heroSection?.querySelectorAll(
      ".u-layout-column-1 .u-text, .u-layout-column-1 .u-rich-text"
    );
  }

  const hasMedia = !!(heroMedia && config.mediaDuration > 0);
  const contentChildren = heroContent ? getAnimatableChildren(heroContent) : [];
  const hasContent = (contentChildren.length > 0) || (applyTextElements?.length > 0);

  if (!hasContent && !hasMedia) {
    tl.addLabel("hero:contentStart", 0);
    tl.addLabel("hero:done", 0);
    return tl;
  }

  // Media first (e.g. home)
  if (hasMedia && config.mediaFirst === true) {
    const realMedia = getRealElement(heroMedia);
    const contentAt = Math.max(0, (config.mediaDelay || 0) + (config.mediaDuration || 0) + (config.mediaToContentGap || 0));

    tl.to(realMedia, { autoAlpha: 1, duration: config.mediaDuration }, config.mediaDelay || 0);
    tl.addLabel("hero:contentStart", contentAt);

    if (heroContent) {
      const children = getAnimatableChildren(heroContent);
      if (children.length) {
        tl.to(children, { autoAlpha: 1, duration: config.duration, stagger: config.stagger }, contentAt);
      }
    } else if (applyTextElements?.length) {
      tl.to(applyTextElements, { autoAlpha: 1, duration: config.duration, stagger: config.stagger }, contentAt);
    }

    tl.addLabel("hero:done");
    return tl;
  }

  // Default: content first, then media
  if (heroContent) {
    const children = getAnimatableChildren(heroContent);
    if (children.length) {
      tl.to(children, { autoAlpha: 1, duration: config.duration, stagger: config.stagger }, 0);
    }
  }
  if (applyTextElements?.length) {
    tl.to(applyTextElements, { autoAlpha: 1, duration: config.duration, stagger: config.stagger }, 0);
  }

  tl.addLabel("hero:contentStart", 0);

  if (hasMedia) {
    tl.to(getRealElement(heroMedia), { autoAlpha: 1, duration: config.mediaDuration }, config.mediaDelay || 0);
  }

  tl.addLabel("hero:done");
  return tl;
}


/* =========================
   ANIMATE SECTIONS / DIVIDERS / REVEALS
========================= */

function animateSection(section) {
  const children = getAnimatableChildren(section);
  const staggerable = getStaggerableElements(section);

  if (staggerable.length >= CONFIG.revealChildren.minCount) {
    const tl = gsap.timeline();
    const normalChildren = children.filter(c => !c.hasAttribute("data-reveal-children"));
    if (normalChildren.length) {
      tl.to(normalChildren, { autoAlpha: 1, duration: CONFIG.sections.duration, stagger: CONFIG.sections.childStagger, ease: CONFIG.sections.ease }, 0);
    }
    tl.to(staggerable, { autoAlpha: 1, duration: CONFIG.revealChildren.duration, stagger: CONFIG.revealChildren.stagger, ease: CONFIG.revealChildren.ease }, CONFIG.revealChildren.delay);
    return tl;
  }

  if (children.length) {
    return gsap.to(children, { autoAlpha: 1, duration: CONFIG.sections.duration, stagger: CONFIG.sections.childStagger, ease: CONFIG.sections.ease });
  }
  return gsap.to(getRealElement(section), { autoAlpha: 1, duration: CONFIG.sections.duration, ease: CONFIG.sections.ease });
}

function animateDivider(divider) {
  const children = getAnimatableChildren(divider);
  if (children.length) {
    return gsap.to(children, { autoAlpha: 1, duration: CONFIG.dividers.duration, stagger: CONFIG.dividers.childStagger, ease: CONFIG.dividers.ease });
  }
  return gsap.to(getRealElement(divider), { autoAlpha: 1, duration: CONFIG.dividers.duration, ease: CONFIG.dividers.ease });
}

function animateReveal(el) {
  return (el?.getAttribute("data-reveal") === "divider") ? animateDivider(el) : animateSection(el);
}

function getAboveStagger(el) {
  return (el?.getAttribute("data-reveal") === "divider") ? CONFIG.dividers.stagger : CONFIG.sections.stagger;
}


/* =========================
   CLASSIFY + SEQUENCE REVEALS
========================= */

function classifyReveals(container) {
  const reveals = Array.from(container.querySelectorAll("[data-reveal='section'], [data-reveal='divider']"));
  const threshold = window.innerHeight * CONFIG.viewport.aboveThreshold;
  const above = [], below = [];
  reveals.forEach((el) => {
    (el.getBoundingClientRect().top < threshold ? above : below).push(el);
  });
  return { above, below };
}

function animateRevealsAbove(reveals) {
  if (!reveals.length) return gsap.timeline();
  const tl = gsap.timeline();
  let cursor = 0;
  reveals.forEach((el) => {
    tl.add(() => animateReveal(el), cursor);
    cursor += getAboveStagger(el);
  });
  return tl;
}

function setupBelowFold(reveals) {
  if (!hasScrollTrigger || !reveals.length) return;
  reveals.forEach((el) => {
    const type = el.getAttribute("data-reveal");
    const start = type === "divider" ? CONFIG.dividers.triggerStart : CONFIG.sections.triggerStart;
    ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: () => animateReveal(el),
    });
  });
}

function createRevealSequence(container) {
  const { above, below } = classifyReveals(container);
  const master = gsap.timeline();
  const heroTL = animateHero(container);
  master.add(heroTL, 0);

  const heroDur = heroTL.totalDuration?.() || heroTL.duration?.() || 0;
  if (!heroDur || heroDur <= 0.001) {
    master.add(animateRevealsAbove(above), 0);
    setupBelowFold(below);
    return;
  }

  const namespace = getNamespace(container);
  const heroCfg = getHeroConfig(namespace);
  let anchor = String(heroCfg.revealAnchor || "").trim();
  const offsetRaw = heroCfg.revealOffset;
  const offset = Number(offsetRaw);

  if (!anchor && offsetRaw != null && !Number.isNaN(offset)) anchor = "done";

  if (anchor) {
    const baseLabel = anchor === "contentStart" ? "hero:contentStart" : "hero:done";
    const abs = Math.abs(Number.isNaN(offset) ? 0 : offset);
    const pos = Number.isNaN(offset) || offset === 0
      ? baseLabel
      : offset > 0 ? `${baseLabel}+=${abs}` : `${baseLabel}-=${abs}`;
    master.add(animateRevealsAbove(above), pos);
  } else {
    const heroGap = Number(CONFIG.overlap.heroToSections || 0);
    const revealPos = heroGap === 0 ? ">" : heroGap > 0 ? `>+=${heroGap}` : `>-=${Math.abs(heroGap)}`;
    master.add(animateRevealsAbove(above), revealPos);
  }

  setupBelowFold(below);
}


/* =========================
   LOADER (non-home, standard)
========================= */

let loaderDone = false;

async function runLoader(onHeroStart) {
  if (loaderDone) { onHeroStart?.(); return; }
  loaderDone = true;

  const loader = document.querySelector(".loader_wrap");
  if (!loader) {
    document.documentElement.classList.remove("is-loading");
    onHeroStart?.();
    return;
  }

  const svgs = loader.querySelectorAll(".u-svg");
  const paths = loader.querySelectorAll(".u-svg path");
  const contain = loader.querySelector(".loader_contain");

  window.AppScroll.lock();

  gsap.set(loader, { autoAlpha: 1, display: "flex" });
  if (contain) gsap.set(contain, { visibility: "visible", opacity: 1 });
  if (svgs.length) gsap.set(svgs, { y: 20, force3D: true });
  if (paths.length) gsap.set(paths, { autoAlpha: 0 });

  const start = performance.now();

  // Entrance
  const tlIn = gsap.timeline({ defaults: { ease: "power3.out" } });
  if (paths.length) {
    tlIn.to(paths, { autoAlpha: 1, duration: 0.9, stagger: { each: 0.03, from: "start" }, ease: "power2.inOut" }, 0.4);
  }
  if (svgs.length) {
    tlIn.to(svgs, { y: 0, duration: 1.0, stagger: 0.05, ease: "power2.out" }, 0.45);
  }

  await tlIn;

  const elapsed = performance.now() - start;
  const wait = CONFIG.loader.minDuration - elapsed;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));

  // Exit
  const tlOut = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  if (svgs.length) {
    tlOut.to(svgs, { opacity: 0, y: -20, duration: CONFIG.loader.fadeOutDuration, stagger: 0.04 }, 0);
  }
  if (paths.length) {
    tlOut.to(paths, { autoAlpha: 0, duration: CONFIG.loader.fadeOutDuration * 0.8 }, 0);
  }
  tlOut.to(loader, { autoAlpha: 0, duration: CONFIG.loader.fadeOutDuration }, 0.15);

  const heroAt = Math.max(0, CONFIG.loader.fadeOutDuration + CONFIG.overlap.loaderToHero);
  tlOut.call(() => onHeroStart?.(), null, heroAt);

  await tlOut;

  gsap.set(loader, { display: "none" });
  if (svgs.length) gsap.set(svgs, { clearProps: "all" });
  if (contain) gsap.set(contain, { clearProps: "all" });
  document.documentElement.classList.remove("is-loading");
  window.AppScroll.unlock();
}


/* =========================
   LOADER HOME (crisp)
========================= */

async function runLoaderHome(container, onHeroStart) {
  if (loaderDone) { onHeroStart?.(); return; }
  loaderDone = true;

  const crispHeader = container.querySelector(".crisp-header");
  if (!crispHeader) {
    loaderDone = false;
    return runLoader(onHeroStart);
  }

  window.AppScroll.lock();

  const headerWrap = document.querySelector(".header_wrap");
  if (headerWrap) gsap.set(headerWrap, { autoAlpha: 0 });

  const heroContent  = crispHeader.querySelector("[data-hero-content]");
  const splitTargets = heroContent
    ? Array.from(heroContent.querySelectorAll('[data-split="heading"]'))
    : [];

  // Prevent SplitText from running twice
  splitTargets.forEach(el => { el.dataset.soSplitInit = "true"; });

  const revealImgs     = crispHeader.querySelectorAll(".crisp-loader__group > *");
  const scaleUp        = crispHeader.querySelectorAll(".crisp-loader__media");
  const scaleDown      = crispHeader.querySelectorAll(".crisp-loader__media .is--scale-down");
  const isRadius       = crispHeader.querySelectorAll(".crisp-loader__media.is--scaling.is--radius");
  const smallEls       = crispHeader.querySelectorAll(".crisp-header__top, .crisp-header__p");
  const sliderNav      = crispHeader.querySelectorAll(".crisp-header__slider-nav > *");
  const loaderOverlays = crispHeader.querySelectorAll(".crisp-loader__media .u-overlay");

  // Logo
  const logoWrap  = crispHeader.querySelector(".crisp-loader__logo");
  const logoLeft  = logoWrap?.querySelector(".logo_text.is--left");
  const logoRight = logoWrap?.querySelector(".logo_text.is--right");
  const leftPaths  = logoLeft  ? Array.from(logoLeft.querySelectorAll("path"))  : [];
  const rightPaths = logoRight ? Array.from(logoRight.querySelectorAll("path")) : [];

  if (logoWrap) gsap.set(logoWrap, { autoAlpha: 0 });
  if (loaderOverlays.length) gsap.set(loaderOverlays, { opacity: 0 });

  let allLines = [];

  const tl = gsap.timeline({
    defaults: { ease: "expo.inOut" },
    onStart: () => {
      crispHeader.classList.remove("is--hidden");
      if (leftPaths.length) gsap.set(leftPaths, { yPercent: 300 });
      if (rightPaths.length) gsap.set(rightPaths, { yPercent: 300 });

      splitTargets.forEach(el => {
        gsap.set(el, { opacity: 1, visibility: "visible" });
      });

      if (splitTargets.length && hasSplitText) {
        splitTargets.forEach(el => {
          const inst = SplitText.create(el, { type: "lines", mask: "lines" });
          if (inst.lines?.length) {
            gsap.set(inst.lines, { yPercent: 110 });
            allLines.push(...inst.lines);
          }
        });
      }
    },
  });

  // Logo in
  if (logoWrap) tl.set(logoWrap, { autoAlpha: 1 }, 0.49);

  if (leftPaths.length) {
    tl.to(leftPaths, {
      yPercent: 0, duration: 1.8,
      stagger: { each: 0.06, from: "end" },
      ease: "expo.out",
    }, 0.5);
  }
  if (rightPaths.length) {
    tl.to(rightPaths, {
      yPercent: 0, duration: 1.8,
      stagger: { each: 0.06, from: "start" },
      ease: "expo.out",
    }, 0.8);
  }

  // Images reveal
  if (revealImgs.length) {
    gsap.set(revealImgs, { force3D: true, willChange: "transform" });
    tl.fromTo(revealImgs, { xPercent: 500 }, { xPercent: -500, duration: 2.5, stagger: 0.05, force3D: true }, 0.85);
  }
  if (scaleDown.length) {
    tl.to(scaleDown, {
      scale: 0.5, duration: 2,
      stagger: { each: 0.05, from: "edges", ease: "none" },
      onComplete: () => isRadius.forEach(el => el.classList.remove("is--radius")),
    }, "-=0.5");
  }

  // Scale up
  if (scaleUp.length) {
    const isSmall = window.matchMedia("(width < 48em)").matches;
    tl.fromTo(scaleUp,
      { width: isSmall ? "7.5em" : "10em", height: isSmall ? "10em" : "7.5em" },
      { width: "100vw", height: "100dvh", duration: 2.2 },
      "< 0.2"
    );
  }

  // Logo out
  if (leftPaths.length) {
    tl.to(leftPaths, {
      yPercent: 200, duration: 1.0,
      stagger: { each: 0.04, from: "start" },
      ease: "expo.in",
    }, "<");
  }
  if (rightPaths.length) {
    const isSmall = window.matchMedia("(width < 48em)").matches;
    tl.to(rightPaths, {
      yPercent: 200, duration: 1.0,
      stagger: { each: 0.04, from: isSmall ? "end" : "start" },
      ease: "expo.in",
    }, "<0.02");
  }

  if (sliderNav.length) {
    tl.from(sliderNav, { yPercent: 150, stagger: 0.05, ease: "expo.out", duration: 1.2 }, "-=0.9");
  }

  tl.addLabel("overlayDone");

  // Header wrap
  if (headerWrap) {
    tl.to(headerWrap, { autoAlpha: 1, duration: 0.8, ease: "power2.out" }, "<1.65");
  }

  // Text reveal
  tl.add(() => {
    if (!allLines.length) return;
    gsap.to(allLines, { yPercent: 0, stagger: 0.35, ease: "expo.out", duration: 1.0 });
  }, "<0.7");

  if (smallEls.length) {
    tl.from(smallEls, { opacity: 0, ease: "power1.inOut", duration: 0.2 }, "overlayDone+=0.1");
  }

  tl.call(() => {
    crispHeader.classList.remove("is--loading");
    document.documentElement.classList.remove("is-loading");
    onHeroStart?.();
    window.AppScroll.unlock();
  }, null, "+=0.45");

  await tl;
  log("[LOADER HOME] complete");
}


/* =========================
   SLIDERS (Swiper v8, per-container)
========================= */

function applyWorksVariantAlternation(component) {
  if (component.getAttribute("data-slider-variant") !== "works") return;
  if (component.dataset.worksAlternated === "true") return;

  const swiperWrapper = component.querySelector(".slider_list");
  if (!swiperWrapper) return;

  const cards = Array.from(swiperWrapper.children).filter(
    (el) => el.classList.contains("card_primary_wrap")
  );

  cards.forEach((card, i) => {
    const variant = i % 2 === 0 ? "small-works" : "large-works";
    card.setAttribute("data-wf--card-primary--variant", variant);
  });

  component.dataset.worksAlternated = "true";
}


function initSlidersSimple(scope = document) {
  if (typeof window.Swiper !== "function") return;

  const root = getRoot(scope);
  const components = root.querySelectorAll(
    "[data-slider='component']:not([data-slider='component'] [data-slider='component'])"
  );
  if (!components.length) return;

  components.forEach((component) => {
    if (component.dataset.scriptInitialized === "true") return;
    component.dataset.scriptInitialized = "true";

    const swiperElement = component.querySelector(".slider_element");
    const swiperWrapper = component.querySelector(".slider_list");
    if (!swiperElement || !swiperWrapper) return;

    // Unwrap CMS list
    const dynList = Array.from(swiperWrapper.children).find(c => c.classList.contains("w-dyn-list"));
    if (dynList) {
      const nested = dynList?.firstElementChild?.children;
      if (nested) {
        const old = [...swiperWrapper.children];
        [...nested].forEach(el => { if (el?.firstElementChild) swiperWrapper.appendChild(el.firstElementChild); });
        old.forEach(el => el.remove());
      }
    }

    [...swiperWrapper.children].forEach(el => el.classList.add("swiper-slide"));

    // Works variant alternation
    applyWorksVariantAlternation(component);

    const slideCount = swiperWrapper.children.length;
    if (slideCount <= 0) { delete component.dataset.scriptInitialized; return; }

    const safeLoopedSlides = Math.max(1, Math.min(slideCount, 12));

    const followFinger = swiperElement.getAttribute("data-follow-finger") !== "false";
    const freeMode = swiperElement.getAttribute("data-free-mode") === "true";
    const mousewheel = swiperElement.getAttribute("data-mousewheel") === "true";
    const slideToClickedSlide = swiperElement.getAttribute("data-slide-to-clicked") === "true";
    const speed = +swiperElement.getAttribute("data-speed") || 600;
    const loop = swiperElement.getAttribute("data-loop") !== "false";

    function getSlideCount() {
      const offset = component.querySelector(".slider_offset");
      if (!offset) return 3;
      const val = (getComputedStyle(offset).getPropertyValue("--slide-count") || "").trim();
      return parseFloat(val) || 3;
    }

    const nextBtn = component.querySelector("[data-slider='next'] button") || component.querySelector("[data-slider='next']");
    const prevBtn = component.querySelector("[data-slider='previous'] button") || component.querySelector("[data-slider='previous']");
    const paginationEl = component.querySelector(".slider_bullet_list");

    const variant = (component.getAttribute("data-slider-variant") || "").trim().toLowerCase();
    const isArchive = variant === "archive";

    const initialSlideCount = getSlideCount();
    const initialShouldCenter = initialSlideCount > 1.5;

    try {
      const swiperInstance = new window.Swiper(swiperElement, {
        slidesPerView: "auto",
        centeredSlides: initialShouldCenter,
        autoHeight: false,
        speed,
        loop: loop && slideCount > 1,
        loopedSlides: safeLoopedSlides,
        loopAdditionalSlides: safeLoopedSlides,
        followFinger,
        freeMode,
        slideToClickedSlide,
        mousewheel: { enabled: mousewheel, forceToAxis: true },
        keyboard: { enabled: true, onlyInViewport: true },
        ...(nextBtn && prevBtn ? { navigation: { nextEl: nextBtn, prevEl: prevBtn } } : {}),
        ...(paginationEl ? { pagination: { el: paginationEl, bulletActiveClass: "is-active", bulletClass: "slider_bullet_item", bulletElement: "button", clickable: true } } : {}),
        ...(isArchive ? {
          freeMode: true, speed: 6000, cssEase: "linear",
          autoplay: { delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true },
          allowTouchMove: true, watchOverflow: true,
        } : {}),
        slideActiveClass: "is-active",
        slideDuplicateActiveClass: "is-active",
      });

      // Smart resize
      try {
        const offsetEl = component.querySelector(".slider_offset");
        if (offsetEl && typeof window.ResizeObserver === "function") {
          let resizeTimeout;
          new ResizeObserver(() => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
              if (!swiperInstance) return;
              const newCount = getSlideCount();
              swiperInstance.params.centeredSlides = newCount > 1.5;
              try { swiperInstance.update(); } catch (_) {}
            }, 150);
          }).observe(offsetEl);
        }
      } catch (_) {}

    } catch (e) {
      console.warn("[SLIDERS] init failed:", e);
      delete component.dataset.scriptInitialized;
    }
  });
}


/* =========================
   SLIDESHOW (non-crisp, fadeshow)
========================= */

function initSlideshow(scope = document, namespace = "") {
  const root = getRoot(scope);
  const wraps = root.querySelectorAll(".slideshow-wrapper");
  if (!wraps.length) return;

  const reduceMotionVal = reducedMotion;

  wraps.forEach((wrap) => {
    if (wrap.hasAttribute("data-slideshow-initialized")) return;
    wrap.setAttribute("data-slideshow-initialized", "true");

    const visualCol = wrap.querySelector(".u-layout-column-2");
    if (!visualCol) return;
    const stack = visualCol.querySelector(".slideshow_wrap");
    if (!stack) return;

    const frames = Array.from(stack.querySelectorAll('.u-image-wrapper[data-wf--visual-image--variant="cover"]'));
    if (frames.length < 2) return;

    const HOLD = parseFloat(wrap.getAttribute("data-slideshow-hold")) || 2.5;
    const FADE = parseFloat(wrap.getAttribute("data-slideshow-fade")) || 1.0;
    const START_DELAY = parseFloat(wrap.getAttribute("data-slideshow-start-delay")) || 3.0;

    gsap.set(stack, { position: "relative" });
    frames.forEach((el, idx) => {
      gsap.set(el, {
        position: "absolute", inset: 0, width: "100%", height: "100%",
        autoAlpha: idx === 0 ? 1 : 0, zIndex: idx === 0 ? 2 : 1,
      });
    });

    if (reduceMotionVal) return;

    const tl = gsap.timeline({ paused: true, repeat: -1, defaults: { ease: "none" } });
    for (let i = 0; i < frames.length; i++) {
      const current = frames[i];
      const next = frames[(i + 1) % frames.length];
      tl.to({}, { duration: HOLD });
      tl.to(current, { autoAlpha: 0, duration: FADE }, ">");
      tl.to(next, { autoAlpha: 1, duration: FADE }, "<");
      tl.set(current, { zIndex: 1 });
      tl.set(next, { zIndex: 2 });
    }

    const start = () => {
      if (!document.documentElement.contains(wrap)) return;
      if (hasScrollTrigger) {
        ScrollTrigger.create({
          trigger: wrap, start: "top bottom", end: "bottom top",
          onEnter: () => tl.play(), onEnterBack: () => tl.play(),
          onLeave: () => tl.pause(), onLeaveBack: () => tl.pause(),
        });
        if (ScrollTrigger.isInViewport?.(wrap, 0.1)) tl.play();
      } else {
        tl.play();
      }
    };

    gsap.delayedCall(START_DELAY, start);
  });
}


/* =========================
   CRISP SLIDESHOW (home only)
========================= */

function initCrispSlideshows(container) {
  const wraps = Array.from(container.querySelectorAll('[data-slideshow="wrap"]'));
  wraps.forEach(wrap => initCrispSlideShow(wrap));
}

function initCrispSlideShow(el) {
  const ui = {
    el,
    slides: Array.from(el.querySelectorAll('[data-slideshow="slide"]')),
    thumbs: Array.from(el.querySelectorAll('[data-slideshow="thumb"]')),
  };
  ui.inner = ui.slides.map(slide => slide.querySelector('[data-slideshow="parallax"]'));
  ui.overlays = ui.slides.map(slide => {
    const ov = document.createElement("div");
    ov.style.cssText = `position:absolute;inset:0;background:${CONFIG.slideshow.overlayBackground};opacity:0;pointer-events:none;z-index:2;`;
    slide.appendChild(ov);
    return ov;
  });

  let current = 0;
  const length = ui.slides.length;
  let animating = false;
  const animationDuration = CONFIG.slideshow.animationDuration;
  const autoplayDelay = CONFIG.slideshow.autoplayDelay;
  let autoplayId = null;

  if (!length) return;

  ui.slides.forEach((slide, i) => slide.setAttribute("data-index", i));
  ui.thumbs.forEach((thumb, i) => {
    thumb.setAttribute("data-index", i);
    thumb.style.pointerEvents = "none";
  });

  ui.slides[current].classList.add("is--current");
  if (ui.thumbs[current]) ui.thumbs[current].classList.add("is--current");

  function navigate(direction, targetIndex = null) {
    if (animating || length < 2) return;
    animating = true;

    const previous = current;
    current = targetIndex != null
      ? targetIndex
      : direction === 1
        ? (current < length - 1 ? current + 1 : 0)
        : (current > 0 ? current - 1 : length - 1);

    const currentSlide  = ui.slides[previous];
    const currentInner  = ui.inner[previous];
    const upcomingSlide = ui.slides[current];
    const upcomingInner = ui.inner[current];
    const currentOverlay = ui.overlays[previous];

    const tl = gsap.timeline({
      defaults: { duration: animationDuration, ease: "parallax" },
      onStart() {
        upcomingSlide.classList.add("is--current");
        if (ui.thumbs[previous]) ui.thumbs[previous].classList.remove("is--current");
        if (ui.thumbs[current]) ui.thumbs[current].classList.add("is--current");

        if (currentOverlay) {
          gsap.killTweensOf(currentOverlay);
          gsap.to(currentOverlay, {
            delay: 0.2, opacity: CONFIG.slideshow.overlayOpacity,
            duration: animationDuration * 0.9, ease: "power3.out",
          });
        }
      },
      onComplete() {
        currentSlide.classList.remove("is--current");
        if (currentOverlay) {
          gsap.killTweensOf(currentOverlay);
          gsap.set(currentOverlay, { opacity: 0 });
        }
        animating = false;
      },
    });

    tl.to(currentSlide, { xPercent: -direction * 100 }, 0);
    if (currentInner) tl.to(currentInner, { xPercent: direction * 75 }, 0);
    tl.fromTo(upcomingSlide, { xPercent: direction * 100 }, { xPercent: 0 }, 0);
    if (upcomingInner) tl.fromTo(upcomingInner, { xPercent: -direction * 75 }, { xPercent: 0 }, 0);
  }

  el.__slideshowStart = () => {
    if (autoplayId || length < 2) return;
    autoplayId = setInterval(() => navigate(1), autoplayDelay);
  };
}


/* =========================
   FORM SUCCESS (per-container)
========================= */

function initFormSuccess(scope = document) {
  if (!CONFIG.formSuccess.enabled || !$ || !gsap) return;

  const $root = $(scope);
  const $forms = $root.find(".w-form form");
  if (!$forms.length) return;

  function waitForSuccess($form) {
    const $wForm = $form.closest(".w-form");
    const start = Date.now();

    const tick = () => {
      const doneEl = $wForm.find(".w-form-done")[0];
      const failEl = $wForm.find(".w-form-fail")[0];
      const formEl = $wForm.find("form")[0];

      if (failEl && window.getComputedStyle(failEl).display !== "none") return;

      const doneVisible = doneEl && doneEl.style.display === "block";
      const formHidden = formEl && formEl.style.display === "none";

      if (doneVisible && formHidden) {
        showSuccess($form);
        return;
      }

      if (Date.now() - start > CONFIG.formSuccess.pollTimeout) return;
      setTimeout(tick, CONFIG.formSuccess.pollEvery);
    };

    setTimeout(tick, 120);
  }

  function showSuccess($form) {
    if ($form.data("__successHandled")) return;
    $form.data("__successHandled", true);

    $form.css({ opacity: "0", pointerEvents: "none", visibility: "hidden" });

    const successSection = document.querySelector(CONFIG.formSuccess.overlaySelector);
    if (!successSection) return;

    successSection.style.display = "flex";
    successSection.style.pointerEvents = "auto";
    successSection.style.position = "fixed";
    successSection.style.inset = "0";
    successSection.style.zIndex = "9999";

    gsap.set(successSection, { autoAlpha: 0 });
    gsap.to(successSection, { autoAlpha: 1, duration: 0.9, ease: "power2.out" });

    const redirectUrl = successSection.getAttribute("data-success-redirect") || CONFIG.formSuccess.defaultRedirectUrl;
    const redirectDelay = Number(successSection.getAttribute("data-success-redirect-delay")) || CONFIG.formSuccess.defaultRedirectDelay;

    setTimeout(() => {
      if (barba && typeof barba.go === "function") {
        try { barba.go(redirectUrl); } catch { window.location.href = redirectUrl; }
      } else {
        window.location.href = redirectUrl;
      }
    }, redirectDelay);
  }

  $forms.each(function () {
    const $form = $(this);
    if ($form.data("bound-success")) return;
    $form.data("bound-success", true);
    $form.on("submit.soFormSuccess", function () {
      waitForSuccess($form);
    });
  });
}


/* =========================
   THEME SCROLL ANIMATION
========================= */

function initThemeScrollAnimation(scope = document) {
  if (!hasScrollTrigger) return;

  const root = getRoot(scope);
  const triggers = root.querySelectorAll("[data-animate-theme-to]");
  if (!triggers.length) return;

  const init = () => {
    if (!window.colorThemes?.getTheme) return;

    triggers.forEach((trigger) => {
      const themeName = trigger.getAttribute("data-animate-theme-to");
      const brandName = trigger.getAttribute("data-animate-brand-to");

      if (!themeName || themeName === "none") return;

      let themeVars;
      try { themeVars = window.colorThemes.getTheme(themeName, brandName); } catch { return; }
      if (!themeVars) return;

      ScrollTrigger.create({
        trigger,
        start: "top center",
        end: "bottom center",
        onToggle: ({ isActive }) => {
          if (!isActive) return;
          const targetContainer = trigger.closest("[data-barba='container']") || document.querySelector("[data-barba='container']");
          if (!targetContainer) return;
          gsap.to(targetContainer, { ...themeVars, duration: 0.6, ease: "power2.out", overwrite: "auto" });
        },
      });
    });
  };

  if (window.colorThemes?.getTheme) {
    init();
  } else {
    const onReady = () => { init(); document.removeEventListener("colorThemesReady", onReady); };
    document.addEventListener("colorThemesReady", onReady);
  }
}


/* =========================
   MAIL BUTTON HOVER THEME (contact)
========================= */

function initMailButtonTheme(scope = document) {
  const root = getRoot(scope);
  const container = (scope !== document) ? scope : document.querySelector("[data-barba='container']");
  const button = root.querySelector("#mail-button");
  if (!button) return;

  const init = () => {
    if (!window.colorThemes?.getTheme) return;

    let darkVars, lightVars;
    try {
      darkVars = window.colorThemes.getTheme("dark");
      lightVars = window.colorThemes.getTheme("light");
    } catch { return; }

    if (!darkVars || !lightVars) return;

    button.addEventListener("mouseenter", () => {
      gsap.to(container, { ...darkVars, duration: 0.7, ease: "power2.out", overwrite: "auto" });
    });
    button.addEventListener("mouseleave", () => {
      gsap.to(container, { ...lightVars, duration: 0.7, ease: "power2.out", overwrite: "auto" });
    });
  };

  if (window.colorThemes?.getTheme) {
    init();
  } else {
    const onReady = () => { init(); document.removeEventListener("colorThemesReady", onReady); };
    document.addEventListener("colorThemesReady", onReady);
  }
}


/* =========================
   STICKY TOP
========================= */

function initStickyTop(scope = document) {
  const root = getRoot(scope);
  const layout = root.querySelector('[data-wf--layout--variant="sticky-left"]');
  if (!layout) return;

  const col = layout.querySelector(".u-layout-column-1");
  const img = col?.querySelector(".u-image-wrapper");
  if (!col || !img) return;

  function update() {
    const imgH = img.offsetHeight;
    const vh = window.innerHeight;
    col.style.top = Math.max(0, (vh - imgH) / 2) + "px";
  }

  update();
  window.addEventListener("resize", update);
}


/* =========================
   SMOOOTHY AUTO-SCROLL SLIDER
========================= */

function initSmoothySlider(scope = document) {
  if (!window.Smooothy) return;

  const root = getRoot(scope);
  const wrappers = root.querySelectorAll('[data-smooothy="1"]');
  if (!wrappers.length) return;

  class AutoScrollSlider extends window.Smooothy {
    #isPaused = false;
    #scrollSpeed = 0.15;
    #wasDragging = false;
    #resumeTimer = null;
    #speedMul = 0;
    #speedMulTarget = 1;
    #inView = true;
    #io = null;
    #tickerFn = null;

    constructor(container, config = {}) {
      super(container, {
        ...config, infinite: true, snap: false, scrollInput: false,
        lerpFactor: 0.3, dragSensitivity: 0.005,
      });

      const originalUpdate = super.update.bind(this);

      this.#tickerFn = () => {
        const lerp = this.#speedMulTarget < this.#speedMul ? 0.08 : 0.05;
        this.#speedMul += (this.#speedMulTarget - this.#speedMul) * lerp;
        if (Math.abs(this.#speedMulTarget - this.#speedMul) < 0.001) this.#speedMul = this.#speedMulTarget;

        if (!this.#isPaused && this.#inView && this.isVisible && !this.isDragging) {
          const v = this.#scrollSpeed * this.#speedMul;
          const dt = Math.min(this.deltaTime || 0, 0.05);
          if (v && dt) this.target -= v * dt;
        }

        originalUpdate();

        if (this.isDragging && !this.#wasDragging) {
          this.#wasDragging = true;
          this.#isPaused = true;
          this.#speedMulTarget = 0;
        } else if (!this.isDragging && this.#wasDragging) {
          this.#wasDragging = false;
          if (this.#inView) {
            clearTimeout(this.#resumeTimer);
            this.#resumeTimer = setTimeout(() => { this.#isPaused = false; this.#speedMulTarget = 1; }, 50);
          }
        }
      };

      gsap.ticker.add(this.#tickerFn);

      // Interaction pause
      container.addEventListener("mouseenter", () => { this.#isPaused = true; this.#speedMulTarget = 0; });
      container.addEventListener("mouseleave", () => {
        if (this.#inView) { clearTimeout(this.#resumeTimer); this.#resumeTimer = setTimeout(() => { this.#isPaused = false; this.#speedMulTarget = 1; }, 50); }
      });
      container.addEventListener("touchstart", () => { this.#isPaused = true; this.#speedMulTarget = 0; }, { passive: true });
      const resume = () => { if (this.#inView) { clearTimeout(this.#resumeTimer); this.#resumeTimer = setTimeout(() => { this.#isPaused = false; this.#speedMulTarget = 1; }, 50); } };
      container.addEventListener("touchend", resume, { passive: true });
      container.addEventListener("touchcancel", resume, { passive: true });

      // Viewport pause
      if ("IntersectionObserver" in window) {
        this.#io = new IntersectionObserver((entries) => {
          const nowInView = entries[0]?.isIntersecting;
          if (nowInView === this.#inView) return;
          this.#inView = nowInView;
          this.#speedMulTarget = (this.#inView && !this.#isPaused && !this.isDragging) ? 1 : 0;
        }, { threshold: 0.1 });
        this.#io.observe(container);
      }
    }

    destroy() {
      clearTimeout(this.#resumeTimer);
      if (this.#tickerFn) { try { gsap.ticker.remove(this.#tickerFn); } catch (_) {} }
      try { this.#io?.disconnect(); } catch (_) {}
      try { super.destroy?.(); } catch (_) {}
    }
  }

  wrappers.forEach((wrapper) => {
    if (wrapper.dataset.smoothyInitialized === "true") return;
    wrapper.dataset.smoothyInitialized = "true";
    try { new AutoScrollSlider(wrapper); } catch (e) {
      console.warn("[SMOOOTHY] init error:", e);
      delete wrapper.dataset.smoothyInitialized;
    }
  });
}


/* =========================
   CMS NEXT/PREV
========================= */

function initCmsNextPrev(scope = document) {
  const root = getRoot(scope);
  const components = root.querySelectorAll('[tr-cmsnext-element="component"]');

  components.forEach((component) => {
    const cmsList = component.querySelector(".w-dyn-items");
    if (!cmsList) return;

    const items = [...cmsList.children];
    const noResultEl = component.querySelector('[tr-cmsnext-element="no-result"]');
    const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

    const currentIndex = items.findIndex((item) => {
      if (item.querySelector(".w--current")) return true;
      const links = item.querySelectorAll("a[href]");
      return [...links].some((a) => {
        const href = (a.getAttribute("href") || "").replace(/\/+$/, "") || "/";
        return href === currentPath;
      });
    });

    if (currentIndex === -1) return;

    const currentItem = items[currentIndex];
    const loop = component.getAttribute("tr-cmsnext-loop") === "true";
    const showPrev = component.getAttribute("tr-cmsnext-showprev") === "true";
    const showAll = component.getAttribute("tr-cmsnext-showall") === "true";
    const hideEmpty = component.getAttribute("tr-cmsnext-hideempty") === "true";

    let nextItem = items[currentIndex + 1] || null;
    let prevItem = items[currentIndex - 1] || null;

    if (loop) {
      if (!nextItem) nextItem = items[0];
      if (!prevItem) prevItem = items[items.length - 1];
    }

    if (showAll) {
      if (prevItem) prevItem.classList.add("is-prev");
      currentItem.classList.add("is-current");
      if (nextItem) nextItem.classList.add("is-next");
      return;
    }

    const displayItem = showPrev ? prevItem : nextItem;

    items.forEach((item) => { if (item !== displayItem) item.remove(); });

    if (!displayItem) {
      if (noResultEl) noResultEl.style.display = "block";
      if (hideEmpty) component.style.display = "none";
      return;
    }

    const numberEl = displayItem.querySelector(".works_number");
    if (numberEl) numberEl.textContent = showPrev ? "Prev" : "Next";
  });
}
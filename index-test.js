/*
core.js, Studio Olimpo Blueprint

LUXURY VERSION v4.3 + DIVIDERS

- Registro animazioni hero per namespace
- NO overlay, NO scale
- Transizione pagine: opacita + micro elevate solo in uscita del container corrente
- Crossfade reale current e next con Barba sync true
- Fix robusto: NO flash / NO jump-to-top visibile / NO layer fixed che resta appeso
- NEW: gestione divider reveal via data-reveal="divider"
*/

/*
CODE MAP
- Config + Registry
- Dependencies + Logging
- Global safety + Bootstrap
- Scroll manager
- Global helpers (same-page guard, cursor, signature)
- DOM helpers
- Animations (hero, sections, dividers)
- Loader
- Barba transitions
*/

(function () {
    "use strict";

    /* =========================
    CONFIG
    ========================= */
    const CONFIG = {
        debug: false,

        // Lenis manager
        lenis: {
            enabled: true,
            lerp: 0.075,
            wheelMultiplier: 1,
            touchMultiplier: 1.2,
            smoothTouch: true,
            smoothWheel: true,
            syncTouch: true,
            syncTouchLerp: 0.075,
            touchInertiaMultiplier: 35,
            normalizeWheel: true,
            useGsapTicker: true,
        },

        // Loader manager
        loader: {
            minDuration: 2500,
            fadeInDuration: 2.0,
            fadeOutDuration: 1.2,
            ease: "power2.inOut",
        },

        // Transition manager (SLIDE VERTICALE)
        transition: {
            // Overlay timing
            overlayFadeIn: 0.8,
            overlayFadeOut: 0.3,

            // Container slide
            enterFromY: "100vh",
            leaveToY: "-30vh",
            slideDuration: 1.0,

            // Easing
            leaveEase: "power2.out",
            enterEase: "power3.out",

            // overlap timing (lo slide inizia prima che l'overlay sia al 100%)
            slideStartDelay: 0.1,  // inizia lo slide dopo 0.35s (overlay è circa al 45%)

            // Hero overlap (quando parte l'animazione hero rispetto all'enter)
            heroDelay: 0.7,
        },

        // Menu manager (nav outside Barba container)
        menu: {
            enabled: true,

            // selectors
            rootSelector: "[data-navigation-status]",
            wrapSelector: ".nav_mobile_wrap",
            bgSelector: ".nav_background",
            linkCloseSelectors: ".nav_mobile_menu_link, .nav_mobile_logo",

            // shift
            shiftTargetSelector: "[data-nav-shift-target]",
            shiftYAttr: "data-nav-shift-y",
            shiftYFallback: 16,

            shiftOpenDuration: 1.0,
            shiftCloseDuration: 0.9,
            shiftOpenEase: "power2.out",
            shiftCloseEase: "power2.inOut",
            shiftCloseDelay: 0.12,

            // theme
            themeName: "dark",
            themeOpenDuration: 0.6,
            themeCloseDuration: 0.45,
            themeEase: "power3.out",

            // panel timing (aligned to CSS)
            panelCloseDuration: 1.0,
            panelCloseOpacityDelay: 0.2,
            themeResetOverlap: 0.55,
        },

        // Scroll direction handler (nav hide/show on scroll)
        scrollDir: {
            enabled: true,

            // Target element to hide/show (nav is outside Barba container)
            // Default matches your desktop nav wrapper.
            desktopNavSelector: ".nav_desktop_wrap",

            // Keep aligned with your breakpoint conventions
            desktopMinWidth: "60em",

            // Ignore tiny deltas to avoid jitter
            minDelta: 6,

            // Only start hiding after this scroll distance
            startedY: 80,

            // Hide amount (negative moves up)
            desktopHideYPercent: -100,

            // Tween tuning
            tweenDur: 0.7,
            ease: "power2.out",

            // Optional behavior toggles
            setBodyAttributes: true,
            animateOpacity: true,
            respectReducedMotion: true,

            // Barba integration: fade-only restore after virtual scroll-to-top
            transitionFadeDur: 0.3,
        },



        // Accordion manager (inside Barba container)
        accordions: {
            enabled: true,
            rootSelector: ".accordion_wrap",
            listSelector: ".accordion_list",
            itemSelector: ".accordion_component",
            buttonSelector: ".accordion_toggle_button",
            contentSelector: ".accordion_content_wrap",
            activeClass: "is-active",

            // animation tuning
            duration: 0.4,
            ease: "power2.inOut",
            // subtle motion tuning (kept simple)
            openYOffset: 0,
            animateOpacity: true,
            iconSelector: ".accordion_icon, [data-accordion-icon]",
        },

        // slideshow
        slideshow: {
            enabled: true,

            // root selector (avoid nested init)
            wrapperSelector: ".slideshow-wrapper",

            // default timings (can be overridden via data-attrs on each wrapper)
            startDelaySec: 3.0,

            // optional global override (if finite, overrides per-wrapper attribute)
            delayOverrideSec: null,

            // optional per-namespace overrides (if finite, overrides everything else)
            byNamespace: {
                home: 5.0,
            },

            // crisp slideshow overlay (JS-created, per slide)
            overlayBackground: "var(--swatch--dark-900-o40)",
            overlayOpacity: 1,
        },

        // Form success overlay (inside Barba container)
        formSuccess: {
            enabled: true,

            // selector for the custom success overlay section
            overlaySelector: "[data-success]",

            // redirect defaults (can be overridden via data-success-redirect + data-success-redirect-delay)
            defaultRedirectUrl: "/",
            defaultRedirectDelay: 1800,

            // success detection polling
            pollTimeout: 8000,
            pollEvery: 120,
        },

        sections: {
            duration: 1.6,
            stagger: 0.3, // stagger tra blocchi above fold
            childStagger: 0.2,
            ease: "power2.out",
            triggerStart: "top 85%",
        },

        // Reveal children stagger [data-reveal-children="stagger"]
        revealChildren: {
            stagger: 0.3,
            duration: 1.8,
            delay: 0.2,
            ease: "power2.out",
            minCount: 2,
        },

        // dividers tuning dedicato (simile a section, ma piu rapido e sobrio)
        dividers: {
            duration: 1.6,
            stagger: 0.3, // se vuoi divider piu ravvicinati sopra fold
            childStagger: 0.12,
            ease: "power2.out",
            triggerStart: "top 92%",
        },

        overlap: {
            loaderToHero: -0.3,
            transitionToHero: 0.2,
            heroToSections: -0.5, // lasciamo il nome per compatibilita, ma ora vale per section + divider
        },

        viewport: {
            aboveThreshold: 0.9,
        },
    };

    /* =========================
    HERO REGISTRY
    ========================= */
    const HERO_REGISTRY = {
        home: {
            duration: 2.2,
            stagger: 0.3,
            mediaFirst: true,
            mediaDelay: 0,
            mediaDuration: 1,
            mediaToContentGap: -0.5,
            revealAnchor: "contentStart",
            revealOffset: -1.5,
            description: "Hero statement con slideshow",
        },

        collection: {
            duration: 1.2,
            stagger: 0.15,
            mediaDelay: 0,
            mediaDuration: 0,
            revealOffset: null,
            description: "Hero titolo + intro",
        },

        villa: {
            duration: 1.6,
            stagger: 0.15,
            mediaDelay: 0.8,
            mediaDuration: 1.8,
            revealAnchor: "done",
            revealOffset: -1.2,
            description: "Hero galleria slider",
        },

        philosophy: {
            duration: 1.8,
            stagger: 0.12,
            mediaFirst: true,
            mediaDelay: 0,
            mediaDuration: 0.9,
            mediaToContentGap: 0,
            revealAnchor: "contentStart",
            revealOffset: -0.06,
            description: "Hero brand con immagine",
        },

        inquire: {
            duration: 1.8,
            stagger: 0.15,
            mediaDelay: 0,
            mediaDuration: 0,
            revealOffset: -1.0,
            description: "Hero form intro",
        },

        apply: {
            duration: 1.8,
            stagger: 0.15,
            mediaDelay: 0,
            mediaDuration: 0,
            revealOffset: null,
            description: "Hero application intro",
        },

        rates: {
            duration: 1.0,
            stagger: 0.1,
            mediaDelay: 0,
            mediaDuration: 0,
            revealOffset: null,
            description: "Hero titolo semplice",
        },

        error: {
            duration: 1.3,
            stagger: 0.12,
            mediaDelay: 0.2,
            mediaDuration: 1.5,
            revealOffset: null,
            description: "Hero errore con immagine",
        },
    };

    const HERO_DEFAULT = {
        duration: 1.2,
        stagger: 0.12,
        mediaDelay: 0.2,
        mediaDuration: 1.4,
        revealOffset: null,
        description: "Default hero",
    };

    /* =========================
    DEPENDENCIES
    ========================= */
    const { gsap, barba, ScrollTrigger } = window;
    const SplitText = window.SplitText; // optional (GSAP SplitText)
    const Lenis = window.Lenis; // optional
    const $ = window.jQuery || window.$;
    /* =========================
       FORM SUCCESS (custom overlay, per-container)
       - binds ONLY our submit handler (namespaced) without breaking Webflow
       - detects real Webflow success state before showing overlay
       - navigates via Barba when available, with safe fallback
       - cleanup does NOT remove Webflow handlers
    ========================= */

    function initFormSuccessTransition(scope = document) {
        if (!CONFIG.formSuccess?.enabled) return () => { };
        if (!$) return () => { };
        if (!gsap) return () => { };

        const NS_EVENT = ".soFormSuccess";

        const $root = $(scope);
        const $forms = $root.find(".w-form form");
        if (!$forms.length) return () => { };

        const DEFAULT_REDIRECT_URL = CONFIG.formSuccess.defaultRedirectUrl;
        const DEFAULT_REDIRECT_DELAY = CONFIG.formSuccess.defaultRedirectDelay;
        const DEFAULT_POLL_TIMEOUT = CONFIG.formSuccess.pollTimeout;
        const POLL_EVERY = CONFIG.formSuccess.pollEvery;

        // Track all timers per init call so cleanup is deterministic
        const timers = new Set();
        const addTimer = (t) => {
            if (t != null) timers.add(t);
            return t;
        };
        const clearAllTimers = () => {
            timers.forEach((t) => {
                try { clearTimeout(t); } catch (_) { }
            });
            timers.clear();
        };

        function hideNativeMessagesAfterDetection($container) {
            $container.find(".w-form-done, .w-form-fail").each(function () {
                this.style.opacity = "0";
                this.style.visibility = "hidden";
                this.style.position = "absolute";
                this.style.pointerEvents = "none";
            });
        }

        function freezeFormHeight($wForm) {
            const $section = $wForm.closest("section.u-section");
            const $formComponent = $wForm.closest(".form_component");

            if ($section.length) {
                const sectionHeight = $section.outerHeight();
                if (sectionHeight > 0) {
                    $section.css({ minHeight: sectionHeight + "px", transition: "none" });
                }
            }

            if ($formComponent.length) {
                const componentHeight = $formComponent.outerHeight();
                if (componentHeight > 0) {
                    $formComponent.css({
                        height: componentHeight + "px",
                        minHeight: componentHeight + "px",
                        overflow: "hidden",
                        transition: "none",
                    });
                }
            }

            const wFormHeight = $wForm.outerHeight();
            if (wFormHeight > 0) {
                $wForm.css({
                    height: wFormHeight + "px",
                    minHeight: wFormHeight + "px",
                    overflow: "hidden",
                    transition: "none",
                });
            }
        }

        function fadeInSuccess(successSection) {
            successSection.style.display = "flex";
            successSection.style.pointerEvents = "auto";
            successSection.style.position = "fixed";
            successSection.style.inset = "0";
            successSection.style.zIndex = "9999";

            gsap.killTweensOf(successSection);
            gsap.set(successSection, { autoAlpha: 0 });
            gsap.to(successSection, { autoAlpha: 1, duration: 0.9, ease: "power2.out" });
        }

        function fadeOutSuccess(successSection, onComplete) {
            if (!successSection) return;

            gsap.killTweensOf(successSection);

            gsap.set(successSection, {
                willChange: "opacity, transform, filter",
                transformOrigin: "50% 50%",
                pointerEvents: "none",
            });

            const tl = gsap.timeline({
                onComplete: () => {
                    successSection.style.display = "none";
                    successSection.style.willChange = "";
                    successSection.style.filter = "";
                    successSection.style.transform = "";
                    if (typeof onComplete === "function") onComplete();
                },
            });

            tl.to(successSection, {
                duration: 0.9,
                ease: "expo.inOut",
                autoAlpha: 0,
                y: 10,
                filter: "blur(1px)",
            });
        }

        function navigateThenHideOverlay(redirectUrl, successSection) {
            // If Barba is not available, fall back to hard navigation.
            if (!barba || typeof barba.go !== "function") {
                window.location.href = redirectUrl;
                return;
            }

            let done = false;

            const safeFadeOut = () => {
                if (done) return;
                done = true;
                fadeOutSuccess(successSection);
            };

            // Safety timeout: never leave overlay stuck.
            const SAFETY_TIMEOUT = 4000;
            const safetyTimer = addTimer(setTimeout(safeFadeOut, SAFETY_TIMEOUT));

            let maybePromise;
            try {
                maybePromise = barba.go(redirectUrl);
            } catch {
                try { clearTimeout(safetyTimer); } catch (_) { }
                window.location.href = redirectUrl;
                return;
            }

            if (maybePromise && typeof maybePromise.then === "function") {
                maybePromise
                    .then(() => {
                        try { clearTimeout(safetyTimer); } catch (_) { }
                        safeFadeOut();
                    })
                    .catch(() => {
                        try { clearTimeout(safetyTimer); } catch (_) { }
                        safeFadeOut();
                    });
                return;
            }

            // FIX: Barba hooks do not support unregistering; rely on `done` guard.
            const afterEnterOnce = () => {
                try { clearTimeout(safetyTimer); } catch (_) { }
                safeFadeOut();
            };

            if (barba.hooks && typeof barba.hooks.afterEnter === "function") {
                barba.hooks.afterEnter(afterEnterOnce);
            }
        }

        function showSuccessAndRedirect($form) {
            if ($form.data("__successHandled")) return;
            $form.data("__successHandled", true);

            const $wForm = $form.closest(".w-form");
            const $fail = $wForm.find(".w-form-fail");
            if ($fail.is(":visible")) return;

            freezeFormHeight($wForm);
            hideNativeMessagesAfterDetection($wForm);

            // Hide only the form element without collapsing layout.
            $form.css({
                opacity: "0",
                pointerEvents: "none",
                visibility: "hidden",
            });

            // Overlay can be outside Barba container, so query from document.
            const successSection = document.querySelector(CONFIG.formSuccess.overlaySelector);
            if (!successSection) return;

            fadeInSuccess(successSection);

            const redirectUrl = successSection.getAttribute("data-success-redirect") || DEFAULT_REDIRECT_URL;
            const redirectDelay =
                Number(successSection.getAttribute("data-success-redirect-delay")) || DEFAULT_REDIRECT_DELAY;

            // Store redirect timer so cleanup can cancel it on transitions.
            const t = addTimer(
                setTimeout(() => {
                    navigateThenHideOverlay(redirectUrl, successSection);
                }, Math.max(0, redirectDelay))
            );

            $form.data("__successRedirectTimer", t);
        }

        function waitForWebflowSuccess($form) {
            const $wForm = $form.closest(".w-form");
            const start = Date.now();

            const isVisibleFast = (el) => {
                if (!el) return false;
                try {
                    if (typeof el.getClientRects === "function" && el.getClientRects().length === 0) return false;
                    const cs = window.getComputedStyle(el);
                    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return false;
                    return true;
                } catch {
                    return false;
                }
            };

            const tick = () => {
                const doneEl = $wForm.find(".w-form-done")[0] || null;
                const failEl = $wForm.find(".w-form-fail")[0] || null;
                const formEl = $wForm.find("form")[0] || null;

                if (isVisibleFast(failEl)) return;

                const doneVisible = isVisibleFast(doneEl);
                const doneStyleBlock = doneEl && doneEl.style.display === "block";
                const formHidden = formEl ? !isVisibleFast(formEl) : false;
                const formStyleNone = formEl && formEl.style.display === "none";

                const successDetected = (doneVisible || doneStyleBlock) && (formHidden || formStyleNone);

                if (successDetected) {
                    showSuccessAndRedirect($form);
                    return;
                }

                if (Date.now() - start > DEFAULT_POLL_TIMEOUT) return;

                const nextTick = addTimer(setTimeout(tick, POLL_EVERY));
                $form.data("__successPollTimer", nextTick);
            };

            // Initial small delay to avoid reading transient states right after submit.
            const first = addTimer(setTimeout(tick, 120));
            $form.data("__successPollTimer", first);
        }

        // Bind submit handler (namespaced) per form, without breaking Webflow.
        $forms.each(function () {
            const $form = $(this);
            if ($form.data("bound-success")) return;
            $form.data("bound-success", true);

            // IMPORTANT: do not preventDefault here; Webflow needs to run its own handler.
            $form.on("submit" + NS_EVENT, function () {
                const $wForm = $form.closest(".w-form");
                freezeFormHeight($wForm);
                waitForWebflowSuccess($form);
            });
        });

        return () => {
            // Remove ONLY our handlers/timers; keep Webflow intact.
            $forms.each(function () {
                const $form = $(this);

                const tPoll = $form.data("__successPollTimer");
                const tRedir = $form.data("__successRedirectTimer");
                try { if (tPoll != null) clearTimeout(tPoll); } catch (_) { }
                try { if (tRedir != null) clearTimeout(tRedir); } catch (_) { }

                try { $form.off(NS_EVENT); } catch (_) { }
                try { $form.removeData("bound-success"); } catch (_) { }
                try { $form.removeData("__successHandled"); } catch (_) { }
                try { $form.removeData("__successPollTimer"); } catch (_) { }
                try { $form.removeData("__successRedirectTimer"); } catch (_) { }
            });

            clearAllTimers();
        };
    }

    // Back-compat alias (existing call sites)
    const initFormSuccess = initFormSuccessTransition;

    if (!gsap) return console.warn("[CORE] GSAP mancante");
    if (!barba) return console.warn("[CORE] Barba mancante");
    if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (SplitText) gsap.registerPlugin(SplitText);

    const log = (...args) => CONFIG.debug && console.log("[CORE]", ...args);

    /* =========================
    GLOBAL SAFETY (avoid Barba crashes on optional component init)
    ========================= */

    function bindGlobalSafetyOnce() {
        if (window.__coreSafetyBound) return;
        window.__coreSafetyBound = true;

        window.addEventListener("unhandledrejection", (e) => {
            const reason = e?.reason;
            const msg = reason?.message || String(reason || "");

            // Known optional component: checkout popup (skip hard failure)
            if (msg.includes("No checkout popup config found")) {
                console.warn("[CORE] Optional checkout popup config missing, ignoring:", reason);
                try { e.preventDefault(); } catch (_) { }
                return;
            }

            console.warn("[CORE] Unhandled promise rejection:", reason);
        });

        window.addEventListener("error", (e) => {
            const msg = e?.message || "";
            if (msg.includes("No checkout popup config found")) {
                console.warn("[CORE] Optional checkout popup error, ignoring:", e.error || e);
                try { e.preventDefault(); } catch (_) { }
                return;
            }
        });
    }

    // Bind safety net ASAP (before any optional inits) — one time
    bindGlobalSafetyOnce();

    /* =========================
    UTILITIES
    ========================= */
    function getNamespace(container) {
        return container?.getAttribute("data-barba-namespace") || "default";
    }

    function getRoot(scope) {
        return scope && typeof scope.querySelectorAll === "function" ? scope : document;
    }

    /* =========================
       WEBFLOW RE-INIT (Forms)
       - With Barba, Webflow's form AJAX binding can be lost on next containers.
       - If forms are not re-bound, submit falls back to native POST -> hard refresh.
       - Keep this narrowly scoped to forms to avoid side effects.
    ========================= */

    function reinitWebflowForms() {
        const wf = window.Webflow;
        if (!wf) return;

        // Best-effort: re-bind Webflow form handlers after Barba DOM swap.
        try {
            if (typeof wf.require === "function") {
                const forms = wf.require("forms");
                if (forms && typeof forms.ready === "function") forms.ready();
            }
        } catch (_) { }

        // Some builds expose Webflow.ready() which re-runs modules.
        // Keep it guarded and non-fatal.
        try {
            if (typeof wf.ready === "function") wf.ready();
        } catch (_) { }
    }

    // Re-bind forms on BFCache restore / tab resume (prevents "idle then submit -> reload")
    function bindWebflowFormsResumeOnce() {
        if (window.__wfFormsResumeBound) return;
        window.__wfFormsResumeBound = true;

        window.addEventListener("pageshow", (e) => {
            if (e && e.persisted) {
                try { reinitWebflowForms(); } catch (_) { }
            }
        });

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                try { reinitWebflowForms(); } catch (_) { }
            }
        });
    }

    function sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    function debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    function prefersReducedMotion() {
        return (
            !!window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        );
    }

    /* =========================
       MASKED TEXT REVEAL (GSAP SplitText) — OSMO
       Markup:
       - data-split="heading"
       - data-split-reveal="lines" | "words" | "chars" (default: lines)
       Notes:
       - CSS already hides [data-split="heading"] to prevent FOUC
       - We set autoAlpha back to 1 right before splitting
    ========================= */

    const splitConfig = {
      lines: { duration: 0.8, stagger: 0.08 },
      words: { duration: 0.6, stagger: 0.06 },
      chars: { duration: 0.4, stagger: 0.01 },
    };

    function initMaskTextScrollReveal(scope = document) {
      // Hard guards (keep pipeline safe)
      if (!gsap || !SplitText || !ScrollTrigger) return () => { };

      const root = getRoot(scope);
      const headings = Array.from(root.querySelectorAll('[data-split="heading"]'));
      if (!headings.length) return () => { };

      let destroyed = false;
      const instances = [];

      const run = () => {
        if (destroyed) return;

        headings.forEach((heading) => {
          if (!heading) return;

          // Prevent duplicates per container lifecycle.
          if (heading.dataset.soSplitInit === "true") return;
          heading.dataset.soSplitInit = "true";

          // FOUC fix (Osmo): elements are hidden in CSS, we reveal right before splitting
          gsap.set(heading, { autoAlpha: 1, visibility: "visible" });

          // Find split type (default: lines)
          const typeRaw = (heading.dataset.splitReveal || "lines").toLowerCase();
          const type = typeRaw === "words" || typeRaw === "chars" ? typeRaw : "lines";

          // Only split as far as we need
          const typesToSplit =
            type === "lines" ? ["lines"] :
              type === "words" ? ["lines", "words"] :
                ["lines", "words", "chars"];

          // If this is a Webflow Rich Text wrapper, split its direct children instead of the wrapper.
          // This helps preserve original typography/leading.
          const isRichText = heading.classList?.contains("w-richtext") || heading.classList?.contains("w-rich-text");
          const splitTarget = isRichText ? Array.from(heading.children) : heading;

          // HERO: if the split heading lives inside the hero section, play immediately (no ScrollTrigger)
          // This avoids the common ScrollTrigger behavior where the first evaluation only happens after a tiny scroll.
          const isHeroHeading = !!(
            heading.closest("[data-hero]") ||
            heading.closest("[data-hero-content]") ||
            heading.closest("[data-hero-media]")
          );

          const instance = SplitText.create(splitTarget, {
            type: typesToSplit.join(", "),
            mask: "lines",
            autoSplit: true,
            linesClass: "line",
            wordsClass: "word",
            charsClass: "letter",
            onSplit(inst) {
              // On resize SplitText will re-split. We must return the tween so SplitText can revert the old one.
              const targets = inst[type] || inst.lines;
              const cfg = splitConfig[type] || splitConfig.lines;

              // Reduced motion: no animation
              if (prefersReducedMotion()) {
                try { gsap.set(targets, { clearProps: "all" }); } catch (_) { }
                return null;
              }

              // HERO headings should animate immediately on enter.
              // Non-hero headings use ScrollTrigger.
              if (isHeroHeading) {
                const isHome = !!heading.closest('[data-barba-namespace="home"]');
                const tween = gsap.from(targets, {
                  yPercent: 110,
                  duration: cfg.duration,
                  stagger: isHome ? 0.8 : cfg.stagger,
                  ease: "expo.out",
                  // small delay to avoid competing with first paint / other hero prep
                  delay: 0.05,
                  clearProps: "willChange",
                });

                // Force a ScrollTrigger evaluation anyway (defensive) to keep other triggers consistent.
                // This prevents the 'needs tiny scroll' feeling on some browsers.
                try {
                  requestAnimationFrame(() => {
                    try { ScrollTrigger.refresh(true); } catch (_) { }
                    try { ScrollTrigger.update(true); } catch (_) { }
                  });
                } catch (_) { }

                return tween;
              }

              const tween = gsap.from(targets, {
                yPercent: 110,
                duration: cfg.duration,
                stagger: cfg.stagger,
                ease: "expo.out",
                scrollTrigger: {
                  trigger: heading,
                  // Osmo uses clamp() to force animation to always start from 0
                  start: "clamp(top 92%)",
                  once: true,
                },
              });

              // Ensure first evaluation happens without requiring user scroll.
              try {
                requestAnimationFrame(() => {
                  try { ScrollTrigger.refresh(true); } catch (_) { }
                  try { ScrollTrigger.update(true); } catch (_) { }
                });
              } catch (_) { }

              return tween;
            },
          });

          instances.push(instance);
        });
      };

      // Osmo bonus: split after fonts are loaded to avoid reflow jumps
      if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === "function") {
        document.fonts.ready.then(run).catch(run);
      } else {
        run();
      }

      // Cleanup for Barba leave
      return () => {
        destroyed = true;

        headings.forEach((heading) => {
          if (!heading) return;
          try { delete heading.dataset.soSplitInit; } catch (_) { }

          // If a ScrollTrigger exists on any tween created by SplitText, revert will handle cleanup.
          // We still do best-effort kill in case something remains.
          try {
            ScrollTrigger.getAll().forEach((t) => {
              if (t && t.trigger === heading) t.kill(true);
            });
          } catch (_) { }
        });

        instances.forEach((inst) => {
          try { inst?.revert?.(); } catch (_) { }
        });

        try { ScrollTrigger.refresh(true); } catch (_) { }
      };
    }

    // Bind SplitText lifecycle to Barba (one time)
    let __splitTextBarbaHooksBound = false;
    function bindSplitTextBarbaHooksOnce() {
      if (__splitTextBarbaHooksBound) return;
      __splitTextBarbaHooksBound = true;

      const initFor = (container) => {
        if (!container) return;
        try { container.__soSplitCleanup?.(); } catch (_) { }
        container.__soSplitCleanup = initMaskTextScrollReveal(container);
      };

      const cleanupFor = (container) => {
        if (!container) return;
        try { container.__soSplitCleanup?.(); } catch (_) { }
        container.__soSplitCleanup = null;
      };

      // First load (current container)
      requestAnimationFrame(() => {
        const c = document.querySelector("[data-barba='container']");
        // HOME: il split viene gestito da runLoaderHome, non qui
        if (c && c.getAttribute("data-barba-namespace") === "home") return;
        initFor(c);
      });

      if (barba && barba.hooks) {
        barba.hooks.beforeLeave(({ current }) => {
          cleanupFor(current?.container);
        });

        barba.hooks.afterEnter(({ next }) => {
          initFor(next?.container);
        });
      }
    }


    function isDesktop() {
        return !!window.matchMedia && window.matchMedia("(min-width: 60em)").matches;
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

    /* =========================
       WORKS CARD VARIANT ALTERNATION
       Alterna small-works / large-works sulle card reali
       PRIMA dell'init di Swiper, così i cloni ereditano la variante corretta.
    ========================= */
    function applyWorksVariantAlternation(component) {
        // Solo per slider works
        if (component.getAttribute("data-slider-variant") !== "works") return;

        // Flag: esegui una sola volta per componente
        if (component.dataset.worksAlternated === "true") return;

        const swiperWrapper = component.querySelector(".slider_list");
        if (!swiperWrapper) return;

        // Seleziona SOLO i figli diretti reali che sono .card_primary_wrap
        const cards = Array.from(swiperWrapper.children).filter(
            (el) => el.classList.contains("card_primary_wrap")
        );

        cards.forEach((card, i) => {
            const variant = i % 2 === 0 ? "small-works" : "large-works";
            card.setAttribute("data-wf--card-primary--variant", variant);
            card.setAttribute("data-works-alt", variant); // debug
        });

        // Segna come fatto — non verrà ri-applicato al resize
        component.dataset.worksAlternated = "true";
    }

    /* =========================
       SIMPLE SLIDER (Swiper v8) — FIXED
       - No double init (removed bindSlidersSimpleOnce, Barba handles lifecycle)
       - Smart ResizeObserver (update, don't destroy+recreate)
       - Correct navigation selectors ([data-slider='next'] button)
       - Works variant alternation aligned with CSS selectors
    ========================= */
    function initSlidersSimple(scope = document) {
        const root = getRoot(scope);

        if (typeof window.Swiper !== "function") {
            log("[SLIDERS] Swiper not found, skip");
            return () => { };
        }

        const components = root.querySelectorAll(
            "[data-slider='component']:not([data-slider='component'] [data-slider='component'])"
        );

        if (!components.length) return () => { };

        const cleanups = [];

        components.forEach((component) => {
            if (!component) return;
            if (component.dataset.scriptInitialized === "true") return;
            component.dataset.scriptInitialized = "true";

            const swiperElement = component.querySelector(".slider_element");
            const swiperWrapper = component.querySelector(".slider_list");
            if (!swiperElement || !swiperWrapper) return;

            // ---- Helper: unwrap Webflow CMS list ----
            function removeCMSList(slot) {
                const dynList = Array.from(slot.children).find((child) =>
                    child.classList.contains("w-dyn-list")
                );
                if (!dynList) return;

                const nestedItems = dynList?.firstElementChild?.children;
                if (!nestedItems) return;

                const staticWrapper = [...slot.children];
                [...nestedItems].forEach((el) => {
                    if (el?.firstElementChild) slot.appendChild(el.firstElementChild);
                });
                staticWrapper.forEach((el) => el.remove());
            }

            // 1. Unwrap CMS
            removeCMSList(swiperWrapper);

            // 2. Assign swiper-slide class
            [...swiperWrapper.children].forEach((el) => el.classList.add("swiper-slide"));

            // 3. Works: alternanza varianti card (una sola volta, prima di Swiper)
            applyWorksVariantAlternation(component);

            // Bail if no slides
            const slideCount = swiperWrapper.children.length;
            if (slideCount <= 0) {
                delete component.dataset.scriptInitialized;
                return;
            }

            // Loop stability (required with slidesPerView:'auto' + centeredSlides)
            const safeLoopedSlides = Math.max(1, Math.min(slideCount, 12));

            // Read attrs from swiper element
            const followFinger = swiperElement.getAttribute("data-follow-finger") !== "false";
            const freeMode = swiperElement.getAttribute("data-free-mode") === "true";
            const mousewheel = swiperElement.getAttribute("data-mousewheel") === "true";
            const slideToClickedSlide = swiperElement.getAttribute("data-slide-to-clicked") === "true";
            const speed = +swiperElement.getAttribute("data-speed") || 600;
            const loop = swiperElement.getAttribute("data-loop") !== "false";

            let swiperInstance = null;
            let ro = null;

            function getSlideCount() {
                const offset = component.querySelector(".slider_offset");
                if (!offset) return 3;
                const style = getComputedStyle(offset);
                const val = (style.getPropertyValue("--slide-count") || "").trim();
                return parseFloat(val) || 3;
            }

            // Correct navigation selectors (button inside the wrapper)
            const nextBtn = component.querySelector("[data-slider='next'] button")
                || component.querySelector("[data-slider='next']");
            const prevBtn = component.querySelector("[data-slider='previous'] button")
                || component.querySelector("[data-slider='previous']");
            const paginationEl = component.querySelector(".slider_bullet_list");

            // Variant-specific config
            const variant = (component.getAttribute("data-slider-variant") || "").trim().toLowerCase();
            const isArchive = variant === "archive";

            // 4. Init Swiper (after alternation)
            const initialSlideCount = getSlideCount();
            const initialShouldCenter = initialSlideCount > 1.5;

            try {
                swiperInstance = new window.Swiper(swiperElement, {
                    slidesPerView: "auto",
                    centeredSlides: initialShouldCenter,
                    autoHeight: false,
                    speed,
                    loop: loop && slideCount > 1,
                    // Loop stability (required with slidesPerView:'auto' + centeredSlides)
                    loopedSlides: safeLoopedSlides,
                    loopAdditionalSlides: safeLoopedSlides,
                    followFinger,
                    freeMode,
                    slideToClickedSlide,
                    mousewheel: {
                        enabled: mousewheel,
                        forceToAxis: true,
                    },
                    keyboard: {
                        enabled: true,
                        onlyInViewport: true,
                    },
                    // Only set navigation/pagination if elements exist
                    ...(nextBtn && prevBtn
                        ? { navigation: { nextEl: nextBtn, prevEl: prevBtn } }
                        : {}),
                    ...(paginationEl
                        ? {
                            pagination: {
                                el: paginationEl,
                                bulletActiveClass: "is-active",
                                bulletClass: "slider_bullet_item",
                                bulletElement: "button",
                                clickable: true,
                            },
                        }
                        : {}),
                    // Archive variant: continuous marquee scroll
                    ...(isArchive
                        ? {
                            freeMode: true,
                            speed: 6000,
                            cssEase: "linear",
                            autoplay: {
                                delay: 0,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true,
                            },
                            allowTouchMove: true,
                            watchOverflow: true,
                        }
                        : {}),
                    slideActiveClass: "is-active",
                    slideDuplicateActiveClass: "is-active",
                });
            } catch (e) {
                console.warn("[SLIDERS] Swiper init failed:", e);
                delete component.dataset.scriptInitialized;
                return;
            }

            // Smart ResizeObserver — update params, don't destroy+recreate
            try {
                const offsetEl = component.querySelector(".slider_offset");
                if (offsetEl && typeof window.ResizeObserver === "function") {
                    let resizeTimeout;
                    ro = new ResizeObserver(() => {
                        clearTimeout(resizeTimeout);
                        resizeTimeout = setTimeout(() => {
                            if (!swiperInstance) return;
                            const newCount = getSlideCount();
                            const newShouldCenter = newCount > 1.5;

                            if (swiperInstance.params.centeredSlides !== newShouldCenter) {
                                swiperInstance.params.centeredSlides = newShouldCenter;
                            }

                            try { swiperInstance.update(); } catch (_) { }
                        }, 150);
                    });
                    ro.observe(offsetEl);
                }
            } catch (_) { }

            const cleanup = () => {
                try { if (ro) ro.disconnect(); } catch (_) { }
                ro = null;
                try { if (swiperInstance) swiperInstance.destroy(true, true); } catch (_) { }
                swiperInstance = null;
                try {
                    delete component.dataset.scriptInitialized;
                    delete component.dataset.worksAlternated;
                } catch (_) { }
            };

            cleanups.push(cleanup);
        });

        return () => cleanups.forEach((fn) => { try { fn(); } catch (_) { } });
    }

    // Barba lifecycle (once/leave/enter) handles init and cleanup.
    // No bindSlidersSimpleOnce() — no double initialization.

    function getHeroConfig(namespace) {
        const config = HERO_REGISTRY[namespace] || HERO_DEFAULT;
        log(`Hero config for "${namespace}":`, config.description);
        return config;
    }

    function killAllScrollTriggers() {
        if (!ScrollTrigger) return;
        try {
            ScrollTrigger.getAll().forEach((t) => t.kill(true));
        } catch (e) {
            log("ScrollTrigger killAll errore:", e);
        }
    }

    /* =========================
    SCROLL MANAGER (Lenis + lock/unlock)
    ========================= */

    const Scroll = {
        lenis: null,
        locked: false,
        _tickerFn: null,
        _onLenisScroll: null,

        initLenis() {
            if (!CONFIG.lenis?.enabled) return;
            if (!Lenis) {
                log("Lenis not found, fallback to native scroll");
                return;
            }

            // Ensure clean state (important for BFCache / tab resume)
            this.destroyLenis();

            this.lenis = new Lenis({
                lerp: CONFIG.lenis.lerp,
                wheelMultiplier: CONFIG.lenis.wheelMultiplier,
                touchMultiplier: CONFIG.lenis.touchMultiplier,
            });

            window.lenis = this.lenis;

            if (CONFIG.lenis.useGsapTicker && gsap && gsap.ticker) {
                this._onLenisScroll = () => {
                    try {
                        if (ScrollTrigger) ScrollTrigger.update();
                    } catch (_) { }
                };

                try {
                    if (ScrollTrigger) this.lenis.on("scroll", this._onLenisScroll);
                } catch (_) { }

                this._tickerFn = (time) => {
                    try {
                        // GSAP ticker time is in seconds, Lenis expects ms
                        this.lenis.raf(time * 1000);
                    } catch (_) { }
                };

                gsap.ticker.add(this._tickerFn);
                try {
                    gsap.ticker.lagSmoothing(0);
                } catch (_) { }

                log("Lenis init (GSAP ticker)");
                return;
            }

            log("Lenis init (no ticker integration)");
        },

        destroyLenis() {
            if (this._tickerFn && gsap && gsap.ticker) {
                try {
                    gsap.ticker.remove(this._tickerFn);
                } catch (_) { }
            }
            this._tickerFn = null;

            if (this.lenis && this._onLenisScroll) {
                try {
                    this.lenis.off("scroll", this._onLenisScroll);
                } catch (_) { }
            }
            this._onLenisScroll = null;

            try {
                if (this.lenis && this.lenis.destroy) this.lenis.destroy();
            } catch (_) { }

            this.lenis = null;
            if (window.lenis) {
                try {
                    delete window.lenis;
                } catch (_) {
                    window.lenis = null;
                }
            }
        },

        lock() {
            this.locked = true;
            if (this.lenis && this.lenis.stop) {
                try {
                    this.lenis.stop();
                } catch (_) { }
            } else {
                document.documentElement.classList.add("is-scroll-locked");
                document.body.classList.add("is-scroll-locked");
            }
        },

        unlock() {
            this.locked = false;
            if (this.lenis && this.lenis.start) {
                try {
                    this.lenis.start();
                } catch (_) { }
            } else {
                document.documentElement.classList.remove("is-scroll-locked");
                document.body.classList.remove("is-scroll-locked");
            }
        },

        scrollToTopImmediate() {
            if (this.lenis && this.lenis.scrollTo) {
                try {
                    this.lenis.scrollTo(0, { immediate: true });
                } catch (_) { }
            }
            try {
                window.scrollTo(0, 0);
            } catch (_) { }
            try {
                document.documentElement.scrollTop = 0;
            } catch (_) { }
            try {
                document.body.scrollTop = 0;
            } catch (_) { }
        },

        bindResumeHandlersOnce() {
            if (this._resumeBound) return;
            this._resumeBound = true;

            // BFCache restore
            window.addEventListener("pageshow", (e) => {
                if (e && e.persisted) {
                    try {
                        Scroll.initLenis();
                    } catch (_) { }
                    try {
                        if (ScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh(true));
                    } catch (_) { }
                }
            });

            // Tab resume
            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "visible") {
                    try {
                        if (!Scroll.locked && Scroll.lenis && Scroll.lenis.start) Scroll.lenis.start();
                    } catch (_) { }
                    try {
                        if (ScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh(true));
                    } catch (_) { }
                }
            });
        },
    };

    // Local helpers (keep existing call sites unchanged)
    const scrollLock = () => Scroll.lock();
    const scrollUnlock = () => Scroll.unlock();
    const hardScrollTop = () => Scroll.scrollToTopImmediate();

    // Minimal global API (useful for overlays/menus)
    window.AppScroll = {
        lock: () => Scroll.lock(),
        unlock: () => Scroll.unlock(),
    };

    /* =========================
       PREVENT SAME PAGE CLICKS (global, one time)
    ========================= */

    function preventSamePageClicks() {
        if (window.__samePageGuardBound) return;
        window.__samePageGuardBound = true;

        const norm = (p) =>
            (p || "").replace(/\/index\.html?$/i, "").replace(/\/+$/g, "") || "/";

        const isSkippable = (a, e) => {
            const href = a.getAttribute("href") || "";
            const h = href.trim().toLowerCase();
            return (
                e.defaultPrevented ||
                e.metaKey ||
                e.ctrlKey ||
                e.shiftKey ||
                e.altKey ||
                e.button === 1 ||
                a.target === "_blank" ||
                a.hasAttribute("download") ||
                a.rel === "external" ||
                a.dataset.allowSame === "true" ||
                !href ||
                h === "#" ||
                h === "" ||
                h.startsWith("javascript:") ||
                h.startsWith("mailto:") ||
                h.startsWith("tel:")
            );
        };

        const getOffset = () =>
            parseFloat(document.documentElement.getAttribute("data-anchor-offset") || "0") || 0;

        const getTarget = (hash) => {
            if (!hash) return null;
            const id = decodeURIComponent(hash.slice(1));
            return (
                document.getElementById(id) ||
                document.querySelector(`#${CSS?.escape ? CSS.escape(id) : id}`)
            );
        };

        document.addEventListener(
            "click",
            (e) => {
                const a = e.target.closest("a[href]");
                if (!a || isSkippable(a, e)) return;

                let dest;
                try {
                    dest = new URL(a.getAttribute("href"), location.href);
                } catch {
                    return;
                }
                if (dest.origin !== location.origin) return;

                const sameBase =
                    norm(dest.pathname) === norm(location.pathname) &&
                    dest.search === location.search;
                if (!sameBase) return;

                e.preventDefault();

                const offset = getOffset();
                if (dest.hash) {
                    const target = getTarget(dest.hash);
                    if (target) {
                        window.lenis?.scrollTo
                            ? window.lenis.scrollTo(target, { offset: -offset })
                            : target.scrollIntoView({ behavior: "smooth" });
                        return;
                    }
                }

                if ((window.scrollY || 0) < 2) return;
                window.lenis?.scrollTo
                    ? window.lenis.scrollTo(0)
                    : window.scrollTo({ top: 0, behavior: "smooth" });
            },
            true
        );
    }

    /* =========================
       CUSTOM CURSOR (global, one time)
    ========================= */

    function initCustomCursor() {
        if (window.__customCursorInit) return;
        window.__customCursorInit = true;

        if (!gsap) return;

        const cursorEl = document.querySelector(".cursor");
        if (!cursorEl) {
            log("Custom cursor: .cursor not found, skip");
            return;
        }

        // Ensure proper transform origin and avoid layout thrash, and never block clicks
        gsap.set(cursorEl, {
            xPercent: -50,
            yPercent: -50,
            willChange: "transform",
            pointerEvents: "none",
            userSelect: "none",
        });

        const xTo = gsap.quickTo(cursorEl, "x", { duration: 0.6, ease: "power3" });
        const yTo = gsap.quickTo(cursorEl, "y", { duration: 0.6, ease: "power3" });

        window.addEventListener("mousemove", (e) => {
            xTo(e.clientX);
            yTo(e.clientY);
        });

        log("Custom cursor init OK");
    }


    /* =========================
       SIGNATURE (global, one time)
    ========================= */

    function initSignature() {
        if (window.__signatureInit) return;
        window.__signatureInit = true;

        if (!window.console || typeof window.console.log !== "function") return;

        console.log(
            "%cCredits: Studio Olimpo | Above the ordinary – %chttps://www.studioolimpo.it",
            "background:#F8F6F1; color:#000; font-size:12px; padding:10px 0 10px 14px;",
            "background:#F8F6F1; color:#000; font-size:12px; padding:10px 14px 10px 0; text-decoration:none;"
        );
    }


    /* =========================
       initMenu()
    ========================= */


    /* TEMP DISABLED: original initMenu */
    // TEMP REPLACEMENT initMenu (user provided)
    /* =========================
       initMenu() — v6
       Click su link nel menu → nav_wrap si muove con parallax identico
       alla current page in leave, poi barba.go(href)
       ========================= */
    function initMenu() {
        gsap.registerPlugin(CustomEase);
        CustomEase.create("main",    "0.62, 0.05, 0.01, 0.99");
        CustomEase.create("mainOut", "0.55, 0.05, 0.18, 1");

        gsap.defaults({ ease: "main", duration: 0.7 });

        let navWrap          = document.querySelector(".nav_wrap");
        let overlay          = navWrap.querySelector(".nav_overlay");
        let menu             = navWrap.querySelector(".nav_menu");
        let bgPanels         = navWrap.querySelectorAll(".nav_menu_panel");
        let menuToggles      = document.querySelectorAll("[data-menu-toggle]");
        let menuLinks        = navWrap.querySelectorAll(".u-text-style-h1");
        let menuIndexs       = navWrap.querySelectorAll(".nav_menu_index");
        let menuButton       = document.querySelector(".menu_btn_wrap");
        let menuButtonLayout = menuButton.querySelectorAll(".menu_btn_layout");
        let menuDivider      = navWrap.querySelectorAll(".nav_menu_divider");
        let menuList         = navWrap.querySelector(".nav_menu_list");
        let menuFooter       = navWrap.querySelector(".nav_menu_footer");

        let barbaContainer = document.querySelector("[data-barba='container']");
        const SHIFT_Y        = 30;
        const SHIFT_DURATION = 0.9;
        const SHIFT_EASE     = "power2.out";

        let tl = gsap.timeline();

        /* ---- OPEN (invariato) ---- */
        const openNav = () => {
            navWrap.setAttribute("data-nav", "open");
            barbaContainer = document.querySelector("[data-barba='container']");

            tl.clear()
                .set(navWrap, { display: "block" })
                .set(menu, { yPercent: 0 }, "<")
                .set(menuDivider,      { autoAlpha: 1, scaleX: 0 }, "<")
                .set(menuLinks,        { autoAlpha: 0, yPercent: 120 }, "<")
                .set(menuIndexs,       { autoAlpha: 0, yPercent: 80 }, "<")
                .set(menuFooter,       { autoAlpha: 0, yPercent: 30 }, "<")
                .set(menuButtonLayout, { yPercent: 0 }, "<")
                .set(overlay,          { autoAlpha: 0 }, "<")
                .set(bgPanels,         { yPercent: 101 }, "<")
                .set(menuList,         { yPercent: 40 }, "<")
                .fromTo(overlay,          { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: "power2.out" }, "<")
                .fromTo(bgPanels,         { yPercent: 101 }, { yPercent: 0, duration: 0.85 }, "<0.05")
                .fromTo(menuButtonLayout, { yPercent: 0 },   { yPercent: -150, duration: 1 }, "<")
                .to(barbaContainer, { y: -SHIFT_Y, duration: SHIFT_DURATION, ease: SHIFT_EASE }, "<0.05")
                .fromTo(menuList,    { yPercent: 40 }, { yPercent: 0, duration: 1 }, "<0.15")
                .fromTo(menuLinks,   { autoAlpha: 0, yPercent: 120 }, { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08 }, "<0.1")
                .fromTo(menuIndexs,  { yPercent: 80, autoAlpha: 0 },  { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08 }, "<0.05")
                .fromTo(menuDivider, { scaleX: 0, transformOrigin: "left" }, { scaleX: 1, stagger: 0.06, duration: 0.9 }, "<0.1")
                .fromTo(menuFooter,  { autoAlpha: 0, yPercent: 30 }, { autoAlpha: 1, yPercent: 0, duration: 0.7 }, "<0.3");
        };

        /* ---- CLOSE (invariato) ---- */
        const closeNav = () => {
            navWrap.setAttribute("data-nav", "closed");
            barbaContainer = document.querySelector("[data-barba='container']");

            tl.clear()
                .to(menuLinks,   { yPercent: -60, autoAlpha: 0, duration: 0.45, stagger: 0.03, ease: "mainOut" })
                .to(menuIndexs,  { autoAlpha: 0, duration: 0.3 }, "<")
                .to(menuDivider, { scaleX: 0, transformOrigin: "right center", duration: 0.4, ease: "mainOut" }, "<")
                .to(menuFooter,  { autoAlpha: 0, yPercent: 20, duration: 0.35 }, "<")
                .to(barbaContainer,   { y: 0, duration: 0.3, ease: "power2.inOut" }, "<")
                .to(menuButtonLayout, { yPercent: 0, duration: 0.9 }, "<")
                .set(barbaContainer, { y: SHIFT_Y })
                .to(bgPanels, { yPercent: -101, duration: 0.65, ease: "mainOut" }, "<")
                .to(overlay,  { autoAlpha: 0,   duration: 0.5,  ease: "power2.inOut" }, "<")
                .to(barbaContainer, { y: 0, duration: SHIFT_DURATION, ease: SHIFT_EASE }, "<0.2")
                .set(navWrap,        { display: "none" })
                .set(barbaContainer, { clearProps: "y" });
        };

        /* ---- TOGGLE BUTTON (invariato) ---- */
        menuToggles.forEach((toggle) => {
            toggle.addEventListener("click", () => {
                const state = navWrap.getAttribute("data-nav");
                if (state === "open") {
                    closeNav();
                    try { window.lenis?.start?.(); } catch (_) {}
                } else {
                    openNav();
                    try { window.lenis?.stop?.(); } catch (_) {}
                }
            });
        });

        /* ---- LINK CLICK NEL MENU ---- */
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
                    // Stoppa animazioni menu in corso
                    tl.kill();

                    // Segna che la nav era aperta
                    window.__navWasOpen = true;

                    // Sblocca scroll
                    try { window.lenis?.start?.(); } catch (_) {}

                    // NON anima navWrap qui — lo fa transitionLeave in sincronia col current container
                    barba.go(href);
                }
            }
        });
    }


    /* =========================
       prefetchNavLinksOnce()
       Prefetch una volta sola al bootstrap — le pagine linkate nel menu
       vengono caricate in background prima che l'utente apra il menu.
       ========================= */
    function prefetchNavLinksOnce() {
        if (window.__navPrefetchDone) return;
        window.__navPrefetchDone = true;

        const navWrap = document.querySelector(".nav_wrap");
        if (!navWrap) return;

        navWrap.querySelectorAll("a[href]").forEach((link) => {
            const href = link.getAttribute("href");
            if (!href) return;
            try {
                const url = new URL(href, location.href);
                if (
                    url.origin !== location.origin ||
                    href.includes("#") ||
                    href.startsWith("mailto:") ||
                    href.startsWith("tel:")
                ) return;
                if (url.pathname === location.pathname) return;
                barba.prefetch(href);
            } catch (_) {}
        });
    }


    /* =========================
       SCROLL DIRECTION (global, one time)
       - Nav is outside Barba container, so we init only at bootstrap.
       - Updates body attributes for CSS hooks.
       - Desktop only: hides nav on scroll down after threshold, shows on scroll up.
    ========================= */

    let ScrollDir = null; // controller returned by initDetectScrollingDirection
    let __scrollDirBarbaHooksBound = false;

    function initDetectScrollingDirection() {
        if (!CONFIG.scrollDir?.enabled) {
            return { pause: () => { }, reset: () => { }, cleanup: () => { } };
        }
        if (!gsap) {
            return { pause: () => { }, reset: () => { }, cleanup: () => { } };
        }

        // If re-called (BFCache / hot reload), cleanup previous instance first.
        try {
            if (ScrollDir && typeof ScrollDir.cleanup === "function") ScrollDir.cleanup();
        } catch (_) { }

        const reduceMotion = prefersReducedMotion();
        if (CONFIG.scrollDir.respectReducedMotion !== false && reduceMotion) {
            // Still expose attributes for CSS logic, but skip tweening.
            try {
                document.body.setAttribute("data-scrolling-direction", "up");
                document.body.setAttribute("data-scrolling-started", "false");
            } catch (_) { }
            const noop = { pause: () => { }, reset: () => { }, cleanup: () => { } };
            ScrollDir = noop;
            return noop;
        }

        const desktopNav = document.querySelector(CONFIG.scrollDir.desktopNavSelector);
        if (!desktopNav) {
            const noop = { pause: () => { }, reset: () => { }, cleanup: () => { } };
            ScrollDir = noop;
            return noop;
        }

        let lastScrollY = window.scrollY || 0;
        let ticking = false;

        // Internal, coherent state
        let isPaused = false;
        let navHidden = false;

        // Best-effort initial state inference (avoid first reset flicker)
        try {
            const yP = Number(gsap.getProperty(desktopNav, "yPercent")) || 0;
            const op = Number(gsap.getProperty(desktopNav, "opacity"));
            navHidden = yP < -1 || (Number.isFinite(op) && op <= 0.01);
        } catch (_) {
            navHidden = false;
        }

        const pause = (state) => {
            isPaused = !!state;
            // Reset baseline so resume cannot create a fake "scroll up".
            lastScrollY = window.scrollY || 0;
        };

        const resetNav = (forceFade = true) => {
            if (!desktopNav) return;

            // Ensure no pending slide tweens survive the transition
            gsap.killTweensOf(desktopNav);

            // 1) Correct position immediately, no slide
            gsap.set(desktopNav, { yPercent: 0 });

            // 2) Opacity handling
            if (CONFIG.scrollDir.animateOpacity === false) {
                gsap.set(desktopNav, { opacity: 1 });
                navHidden = false;
                return;
            }

            if (navHidden && forceFade) {
                gsap.fromTo(
                    desktopNav,
                    { opacity: 0 },
                    {
                        opacity: 1,
                        duration: CONFIG.scrollDir.transitionFadeDur || 0.28,
                        ease: CONFIG.scrollDir.ease,
                        overwrite: true,
                        onComplete: () => {
                            navHidden = false;
                        },
                    }
                );
            } else {
                gsap.set(desktopNav, { opacity: 1 });
                navHidden = false;
            }
        };

        const mm = gsap.matchMedia();

        mm.add(
            {
                isDesktop: `(min-width: ${CONFIG.scrollDir.desktopMinWidth})`,
                isMobile: `(max-width: calc(${CONFIG.scrollDir.desktopMinWidth} - 0.001px))`,
            },
            (ctx) => {
                const onScroll = () => {
                    if (ticking) return;
                    ticking = true;

                    requestAnimationFrame(() => {
                        const y = window.scrollY || 0;

                        // Pause guard: keep baseline in sync, no direction updates
                        if (isPaused) {
                            lastScrollY = y;
                            ticking = false;
                            return;
                        }

                        if (Math.abs(y - lastScrollY) < CONFIG.scrollDir.minDelta) {
                            ticking = false;
                            return;
                        }

                        const direction = y > lastScrollY ? "down" : "up";
                        const started = y > CONFIG.scrollDir.startedY;

                        lastScrollY = y;

                        if (CONFIG.scrollDir.setBodyAttributes !== false) {
                            try {
                                document.body.setAttribute("data-scrolling-direction", direction);
                                document.body.setAttribute("data-scrolling-started", String(started));
                            } catch (_) { }
                        }

                        // Desktop behavior only
                        if (ctx.conditions.isDesktop) {
                            // Hide only once when conditions are met
                            if (direction === "down" && started && !navHidden) {
                                gsap.to(desktopNav, {
                                    yPercent: CONFIG.scrollDir.desktopHideYPercent,
                                    duration: CONFIG.scrollDir.tweenDur,
                                    opacity: CONFIG.scrollDir.animateOpacity === false ? undefined : 0,
                                    ease: CONFIG.scrollDir.ease,
                                    overwrite: true,
                                });
                                navHidden = true;
                            }

                            // Show only when it was hidden
                            if (direction === "up" && navHidden) {
                                gsap.to(desktopNav, {
                                    yPercent: 0,
                                    opacity: CONFIG.scrollDir.animateOpacity === false ? undefined : 1,
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

                return () => {
                    try { window.removeEventListener("scroll", onScroll); } catch (_) { }
                };
            }
        );

        const cleanup = () => {
            try { mm.revert(); } catch (_) { }
        };

        const controller = {
            pause,
            reset: resetNav,
            cleanup,
        };

        ScrollDir = controller;
        return controller;
    }


    /* =========================
    BOOTSTRAP (one-time globals)
    ========================= */

    function bootstrapOnce() {
        if (window.__coreBootstrapDone) return;
        window.__coreBootstrapDone = true;

        // 1) Safety first (avoid pipeline breaks)
        bindGlobalSafetyOnce();

        // 2) Click guard (avoid Barba on same-page anchors)
        preventSamePageClicks();

        // 2b) Custom cursor (outside Barba container, bind once)
        initCustomCursor();

        // 2c) Console signature (credits, one time)
        initSignature();

        // 2d) Menu (nav is outside Barba container, init once)
        initMenu(document);
        prefetchNavLinksOnce();

        // 2e) Scroll direction (nav hide/show on desktop, global)
        ScrollDir = initDetectScrollingDirection();

        // 2f) Barba integration for scroll-direction (pause during transitions + fade-only restore)
        if (barba && barba.hooks && __scrollDirBarbaHooksBound === false) {
            __scrollDirBarbaHooksBound = true;

            barba.hooks.beforeLeave(() => {
                try { ScrollDir?.pause(true); } catch (_) { }
            });

            // NOTE: ScrollDir reset moved to transitionEnter() for proper sync with hero animation
            // barba.hooks.afterEnter(() => {
            //   requestAnimationFrame(() => {
            //     try { ScrollDir?.reset(true); } catch (_) {}
            //     try { ScrollDir?.pause(false); } catch (_) {}
            //   });
            // });
        }

        // 3) Scroll engine (Lenis) + resume handlers
        Scroll.initLenis();
        Scroll.bindResumeHandlersOnce();
        bindWebflowFormsResumeOnce();
        bindSplitTextBarbaHooksOnce();

        log("Bootstrap OK");
    }

    // Boot once at script evaluation time (earliest possible)
    bootstrapOnce();

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

    /* =========================
       STAGGERED CHILDREN HELPER
    ========================= */
    function getStaggerableElements(section) {
        if (!section) return [];

        const elements = Array.from(
            section.querySelectorAll("[data-reveal-children='stagger']")
        );

        // Filtra elementi non validi
        return elements.filter((el) => {
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


    /* =========================
    PREPARE PAGE
    ========================= */
    function preparePage(container) {
        if (!container) return;

        // HOME: il crisp-header è già composto nel DOM (is--loading + is--hidden).
        // Non nascondere hero-content/hero-media — il loader gestisce tutto.
        // Nascondo solo sections/dividers below fold.
        if (getNamespace(container) === "home") {
            gsap.set(container, { autoAlpha: 1 });

            // FIX: imposta i path del logo a yPercent:300 prima che il container
            // diventi visibile, così non c'è nessun frame intermedio con i path visibili.
            const logoLeft = container.querySelector(".crisp-loader__logo .logo_text.is--left");
            const logoRight = container.querySelector(".crisp-loader__logo .logo_text.is--right");
            const leftPaths = logoLeft ? Array.from(logoLeft.querySelectorAll("path")) : [];
            const rightPaths = logoRight ? Array.from(logoRight.querySelectorAll("path")) : [];
            if (leftPaths.length) gsap.set(leftPaths, { yPercent: 300 });
            if (rightPaths.length) gsap.set(rightPaths, { yPercent: 300 });

            // FIX: rimuovi is--loading e is--hidden subito, prima che il container
            // sia visibile. In questo momento è ancora position:fixed fuori schermo
            // quindi nessun flash. Il loader non serve più (loaderDone === true).
            const crispHeader = container.querySelector(".crisp-header");
            if (crispHeader && loaderDone) {
                crispHeader.classList.remove("is--loading", "is--hidden");
            }

            try {
                if (window.colorThemes?.getTheme) {
                    const lightVars = window.colorThemes.getTheme("light");
                    if (lightVars) {
                        gsap.set(container, lightVars); // solo il container, non body/html
                    }
                }
            } catch (_) {}
            container.querySelectorAll("[data-reveal='section'], [data-reveal='divider']").forEach(el => {
                const children = getAnimatableChildren(el);
                if (children.length) gsap.set(children, { autoAlpha: 0 });
                else gsap.set(getRealElement(el), { autoAlpha: 0 });
                const staggerable = getStaggerableElements(el);
                if (staggerable.length) gsap.set(staggerable, { autoAlpha: 0 });
            });
            log("Page prepared (HOME)");
            return;
        }

        const namespace = getNamespace(container);
        gsap.set(container, { autoAlpha: 1 });

        // Reset tema a light: sia sul container che su body/html
        // (body/html hanno il background via CSS vars → mobile flash fix)
        try {
            if (window.colorThemes?.getTheme) {
                const lightVars = window.colorThemes.getTheme("light");
                if (lightVars) {
                    gsap.set(container, lightVars);
                    gsap.set(document.body, lightVars);
                    gsap.set(document.documentElement, lightVars);
                }
            }
        } catch (_) {}

        const heroContent = container.querySelector("[data-hero-content]");
        if (heroContent) {
            const children = getAnimatableChildren(heroContent);
            if (children.length) gsap.set(children, { autoAlpha: 0 });
        }

        const heroMedia = container.querySelector("[data-hero-media]");
        if (heroMedia) {
            const realMedia = getRealElement(heroMedia);
            gsap.set(realMedia, { autoAlpha: 0 });
        }

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
            if (children.length) {
                gsap.set(children, { autoAlpha: 0 });
            } else {
                const realSection = getRealElement(section);
                gsap.set(realSection, { autoAlpha: 0 });
            }

            // Nascondi elementi staggerabili
            const staggerable = getStaggerableElements(section);
            if (staggerable.length) {
                gsap.set(staggerable, { autoAlpha: 0 });
            }
        });

        // NEW: Dividers
        container.querySelectorAll("[data-reveal='divider']").forEach((divider) => {
            const children = getAnimatableChildren(divider);
            if (children.length) {
                gsap.set(children, { autoAlpha: 0 });
            } else {
                const realDivider = getRealElement(divider);
                gsap.set(realDivider, { autoAlpha: 0 });
            }
        });

        // CRISP HEADER: pre-setta gli overlay slider al valore corretto
        // PRIMA che il container scivoli nella viewport, per evitare il flash
        if (namespace === "home") {
            const sliderOverlays = container.querySelectorAll(
                ".crisp-header__slider-slide .u-overlay"
            );
            if (sliderOverlays.length) {
                gsap.set(sliderOverlays, { opacity: 0.1 });
            }
        }

        log(`Page prepared: ${namespace}`);
    }

    /* =========================
       DYNAMIC YEAR (footer)
    ========================= */

    function initDynamicYear(scope = document) {
        const year = String(new Date().getFullYear());

        // 1) Cerca dentro lo scope corrente (container Barba o document)
        const scopedRoot = scope?.querySelectorAll ? scope : document;
        const scopedEls = scopedRoot.querySelectorAll("[data-dynamic-year]");

        // 2) Cerca anche in tutto il documento (per elementi globali fuori container)
        const docEls = document.querySelectorAll("[data-dynamic-year]");

        // 3) Deduplica (nel caso un elemento sia in entrambe le liste)
        const all = new Set([...scopedEls, ...docEls]);

        all.forEach((el) => {
            el.textContent = year;
        });

        return () => { };
    }

    /* =========================
       SLIDERS (Swiper, per-container)
    ========================= */

    function readBoolAttr(el, name, fallback) {
        if (!el) return !!fallback;
        const v = el.getAttribute(name);
        if (v == null || v === "") return !!fallback;
        return v === "true";
    }

    function readNumAttr(el, name, fallback) {
        if (!el) return Number(fallback || 0);
        const v = el.getAttribute(name);
        const n = Number(v);
        return Number.isFinite(n) ? n : Number(fallback || 0);
    }

    function readStrAttr(el, name, fallback) {
        if (!el) return String(fallback || "");
        const v = el.getAttribute(name);
        return v == null ? String(fallback || "") : String(v);
    }

    function getSliderVariant(component) {
        const attr = CONFIG.sliders?.variantAttr || "data-slider-variant";
        const def = CONFIG.sliders?.defaultVariant || "default";
        const v = (component?.getAttribute?.(attr) || "").trim().toLowerCase();
        return v || def;
    }

    function getSliderConfigFor(component) {
        const base = CONFIG.sliders?.defaults || {};
        const variants = CONFIG.sliders?.variants || {};
        const variantName = getSliderVariant(component);
        const variant = variants[variantName] || variants[CONFIG.sliders?.defaultVariant || "default"] || {};

        // Merge order: defaults -> variant
        return {
            name: variantName,
            ...base,
            ...variant,
        };
    }

    function normalizeSliderDom(component, swiperWrapper) {
        // Normalizzazione DOM (Webflow wrappers)
        flattenDisplayContents(swiperWrapper);

        // removeCMSList() exists elsewhere in the file (used in your previous slider code)
        // Keep it optional for safety.
        try {
            if (typeof removeCMSList === "function") removeCMSList(swiperWrapper);
        } catch (_) { }

        // Ensure slides have the correct class
        [...swiperWrapper.children].forEach((el) => el.classList.add("swiper-slide"));

        // CSS hook: slide count (useful for your CSS width formula)
        const slideCount = swiperWrapper.children.length;
        component.style.setProperty("--slide-count", String(Math.max(slideCount, 1)));

        return slideCount;
    }

    function initSliders(scope = document) {
        if (!CONFIG.sliders?.enabled) return () => { };

        const SwiperClass = window.Swiper;
        if (!SwiperClass) {
            log("[SLIDERS] Swiper not found, skip");
            return () => { };
        }

        const root = getRoot(scope);
        const selector = CONFIG.sliders?.componentSelector || "[data-slider]";
        const components = root.querySelectorAll(selector);
        if (!components.length) return () => { };

        const instances = [];

        components.forEach((component) => {
            if (component.dataset.scriptInitialized === "true") return;
            component.dataset.scriptInitialized = "true";

            const swiperElement = component.querySelector(".slider_element");
            const swiperWrapper = component.querySelector(".slider_list");
            if (!swiperElement || !swiperWrapper) return;

            const cfg = getSliderConfigFor(component);

            // DOM normalization (always), then optional behaviors (variant-driven)
            if (cfg.pruneEmptySlides === false) {
                // temporarily bypass pruneEmptySlides by shadowing the function call
                // We still normalize display contents + CMS list.
                flattenDisplayContents(swiperWrapper);
                try {
                    if (typeof removeCMSList === "function") removeCMSList(swiperWrapper);
                } catch (_) { }
                [...swiperWrapper.children].forEach((el) => el.classList.add("swiper-slide"));

                const slideCount = swiperWrapper.children.length;
                if (cfg.setCssSlideCount !== false) {
                    component.style.setProperty("--slide-count", String(Math.max(slideCount, 1)));
                }

                if (slideCount <= 0) {
                    // Nothing to init: avoid Swiper crash (updateSlidesClasses expects at least one slide)
                    delete component.dataset.scriptInitialized;
                    return;
                }

                // Hide controls if single slide (variant-driven)
                if (cfg.hideControlsIfSingle && slideCount <= 1) {
                    const controls = component.querySelector(".slider_controls");
                    if (controls) controls.style.display = "none";
                    return;
                }
            } else {
                // Optional: prune empty slides (variant-driven)
                if (cfg.pruneEmptySlides) {
                    try { pruneEmptySlides(swiperWrapper); } catch (_) { }
                }

                const slideCount = normalizeSliderDom(component, swiperWrapper);

                if (slideCount <= 0) {
                    // Nothing to init: avoid Swiper crash (updateSlidesClasses expects at least one slide)
                    delete component.dataset.scriptInitialized;
                    return;
                }

                // Hide controls if single slide (variant-driven)
                if (cfg.hideControlsIfSingle && slideCount <= 1) {
                    const controls = component.querySelector(".slider_controls");
                    if (controls) controls.style.display = "none";
                    return;
                }
            }

            // Attribute overrides (last layer)
            const followFinger = readBoolAttr(swiperElement, "data-follow-finger", cfg.followFinger);
            const freeMode = readBoolAttr(swiperElement, "data-free-mode", cfg.freeMode);
            const mousewheel = readBoolAttr(swiperElement, "data-mousewheel", cfg.mousewheel);
            const slideToClickedSlide = readBoolAttr(swiperElement, "data-slide-to-clicked", cfg.slideToClickedSlide);
            const speed = readNumAttr(swiperElement, "data-speed", cfg.speed);
            const loop = readBoolAttr(swiperElement, "data-loop", cfg.loop);

            // Swiper loop requires at least 2 slides; force-disable when not possible.
            const effectiveLoop = loop && swiperWrapper.children.length > 1;

            const effectAttr = readStrAttr(swiperElement, "data-effect", "").trim().toLowerCase();
            const effect = effectAttr || (cfg.effect || "");

            const swiperConfig = {
                slidesPerView: cfg.slidesPerView,
                centeredSlides: cfg.centeredSlides,
                autoHeight: cfg.autoHeight,
                speed,

                followFinger,
                freeMode,
                slideToClickedSlide,

                loop: effectiveLoop,
                // Loop stability (required with slidesPerView:'auto' + centeredSlides)
                ...(effectiveLoop
                    ? {
                        loopedSlides: Math.max(1, Math.min(swiperWrapper.children.length, 12)),
                        loopAdditionalSlides: Math.max(
                            Number(cfg.loopAdditionalSlides) || 0,
                            Math.max(1, Math.min(swiperWrapper.children.length, 12))
                        ),
                    }
                    : {}),

                mousewheel: {
                    enabled: mousewheel,
                    forceToAxis: cfg.mousewheelForceToAxis,
                },

                keyboard: {
                    enabled: cfg.keyboardEnabled,
                    onlyInViewport: cfg.keyboardOnlyInViewport,
                },

                navigation: {
                    nextEl: component.querySelector("[data-slider='next'] button"),
                    prevEl: component.querySelector("[data-slider='previous'] button"),
                },

                pagination: {
                    el: component.querySelector(".slider_bullet_list"),
                    bulletActiveClass: "is-active",
                    bulletClass: "slider_bullet_item",
                    bulletElement: "button",
                    clickable: true,
                },

                slideActiveClass: "is-active",
                slideDuplicateActiveClass: "is-active",
            };

            // Remove any initialSlide override for works variant
            // (If initialSlide was set conditionally for works, it should not be set at all or always 0)
            // Effect handling
            if (effect === "fade") {
                swiperConfig.effect = "fade";
                swiperConfig.fadeEffect = { crossFade: !!cfg.fadeCrossFade };
            }

            try {
                const instance = new SwiperClass(swiperElement, swiperConfig);
                component.__swiper = instance;
                instances.push(component);

                log(`[SLIDERS] init OK (${cfg.name})`, component);
            } catch (e) {
                console.warn("[SLIDERS] init error:", e);
            }
        });

        // Cleanup per scope
        // NOTE: two-phase cleanup.
        // - "soft": disable interactions immediately (no visual reset)
        // - "hard": destroy Swiper instances (still keep cleanStyles=false)
        // Default (no args) remains HARD to preserve existing behavior.
        return (mode = "hard") => {
            const phase = String(mode || "hard").toLowerCase();
            instances.forEach((component) => {
                const instance = component.__swiper;
                // Always stop reacting to input immediately.
                try { component.style.pointerEvents = "none"; } catch (_) { }
                try {
                    const el = component.querySelector(".slider_element");
                    if (el) el.style.pointerEvents = "none";
                } catch (_) { }
                if (phase === "soft") {
                    // Do NOT destroy: keep current translate/active slide to avoid jump-to-first-slide.
                    // Best-effort: disable internal listeners without touching layout.
                    try {
                        if (instance && typeof instance.disable === "function") instance.disable();
                    } catch (_) { }
                    try {
                        if (instance && typeof instance.detachEvents === "function") instance.detachEvents();
                    } catch (_) { }
                    try {
                        if (instance) {
                            instance.allowTouchMove = false;
                            instance.enabled = false;
                        }
                    } catch (_) { }
                    return;
                }
                // HARD phase: remove instance (but keep cleanStyles=false to avoid visible snap).
                try {
                    // destroy(deleteInstance=true, cleanStyles=false)
                    instance?.destroy?.(true, false);
                } catch (_) { }
                component.__swiper = null;
                try { delete component.dataset.scriptInitialized; } catch (_) { }
            });
        };
    }






    /* =========================
       SLIDESHOW (per-container)
    ========================= */

    function getSlideshowDelayOverride(namespace) {
        const ns = String(namespace || "").trim();
        const byNs = CONFIG.slideshow?.byNamespace || {};

        const vNs = Number(byNs[ns]);
        if (Number.isFinite(vNs)) return vNs;

        const vGlobal = Number(CONFIG.slideshow?.delayOverrideSec);
        if (Number.isFinite(vGlobal)) return vGlobal;

        const vDefault = Number(CONFIG.slideshow?.startDelaySec);
        return Number.isFinite(vDefault) ? vDefault : undefined;
    }

    function initSlideshow(scope = document, delayOverrideSec) {
        if (!CONFIG.slideshow?.enabled) return () => { };
        if (!gsap) return () => { };

        const root = getRoot(scope);
        const wraps = root.querySelectorAll(CONFIG.slideshow.wrapperSelector || ".slideshow-wrapper");
        if (!wraps.length) return () => { };

        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        const cleanups = [];

        wraps.forEach((wrap) => {
            if (wrap.hasAttribute("data-slideshow-initialized")) return;
            wrap.setAttribute("data-slideshow-initialized", "true");

            const visualCol = wrap.querySelector(".u-layout-column-2");
            if (!visualCol) return;

            const stack = visualCol.querySelector(".slideshow_wrap");
            if (!stack) return;

            const frames = Array.from(
                stack.querySelectorAll('.u-image-wrapper[data-wf--visual-image--variant="cover"]')
            );
            if (frames.length < 2) return;

            const HOLD = parseFloat(wrap.getAttribute("data-slideshow-hold")) || 2.5;
            const FADE = parseFloat(wrap.getAttribute("data-slideshow-fade")) || 1.0;

            const START_DELAY =
                Number.isFinite(delayOverrideSec)
                    ? delayOverrideSec
                    : parseFloat(wrap.getAttribute("data-slideshow-start-delay")) || 3.0;

            gsap.set(stack, { position: "relative" });

            frames.forEach((el, idx) => {
                gsap.set(el, {
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    autoAlpha: idx === 0 ? 1 : 0,
                    zIndex: idx === 0 ? 2 : 1,
                    willChange: "opacity",
                });
            });

            if (reduceMotion) {
                cleanups.push(() => {
                    wrap.removeAttribute("data-slideshow-initialized");
                });
                return;
            }

            try { wrap.__slideshowTl?.kill?.(); } catch { }
            try { wrap.__slideshowST?.kill?.(); } catch { }
            try { wrap.__slideshowStartCall?.kill?.(); } catch { }

            const tl = gsap.timeline({
                paused: true,
                repeat: -1,
                defaults: { ease: "none" },
            });

            for (let i = 0; i < frames.length; i++) {
                const current = frames[i];
                const next = frames[(i + 1) % frames.length];

                tl.to({}, { duration: HOLD });
                tl.to(current, { autoAlpha: 0, duration: FADE }, ">");
                tl.to(next, { autoAlpha: 1, duration: FADE }, "<");
                tl.set(current, { zIndex: 1 });
                tl.set(next, { zIndex: 2 });
            }

            wrap.__slideshowTl = tl;

            const start = () => {
                if (!document.documentElement.contains(wrap)) return;

                if (ScrollTrigger) {
                    wrap.__slideshowST = ScrollTrigger.create({
                        trigger: wrap,
                        start: "top bottom",
                        end: "bottom top",
                        onEnter: () => tl.play(),
                        onEnterBack: () => tl.play(),
                        onLeave: () => tl.pause(),
                        onLeaveBack: () => tl.pause(),
                    });

                    if (typeof ScrollTrigger.isInViewport === "function" && ScrollTrigger.isInViewport(wrap, 0.1)) {
                        tl.play();
                    }
                } else {
                    tl.play();
                }
            };

            if (gsap && typeof gsap.delayedCall === "function") {
                wrap.__slideshowStartCall = gsap.delayedCall(START_DELAY, start);
            } else {
                const t = setTimeout(start, START_DELAY * 1000);
                wrap.__slideshowStartCall = { kill: () => clearTimeout(t) };
            }

            cleanups.push(() => {
                try { wrap.__slideshowTl?.kill?.(); } catch { }
                try { wrap.__slideshowST?.kill?.(); } catch { }
                try { wrap.__slideshowStartCall?.kill?.(); } catch { }
                wrap.__slideshowTl = null;
                wrap.__slideshowST = null;
                wrap.__slideshowStartCall = null;
                wrap.removeAttribute("data-slideshow-initialized");
            });
        });

        return () => cleanups.forEach((fn) => { try { fn(); } catch { } });
    }

    /* =========================
       ACCORDIONS (per-container)
       - Webflow-safe: no preventDefault, no DOM removals
       - Idempotent init via data-scriptInitialized
       - Deterministic cleanup: removes ONLY our listeners + timelines
    ========================= */

    function initAccordions(scope = document) {
        if (!CONFIG.accordions?.enabled) return () => { };
        if (!gsap) {
            console.warn("[ACCORDION] GSAP non trovato, carica GSAP prima di index.js");
            return () => { };
        }

        const root = getRoot(scope);
        const cfg = CONFIG.accordions;

        const components = root.querySelectorAll(cfg.rootSelector || ".accordion_wrap");
        if (!components.length) return () => { };

        const cleanups = [];

        components.forEach((component, listIndex) => {
            if (component.dataset.scriptInitialized === "true") return;
            component.dataset.scriptInitialized = "true";

            const closePrevious = component.getAttribute("data-close-previous") !== "false";
            const closeOnSecondClick = component.getAttribute("data-close-on-second-click") !== "false";
            const openOnHover = component.getAttribute("data-open-on-hover") === "true";

            const openByDefault =
                component.getAttribute("data-open-by-default") !== null &&
                    !Number.isNaN(+component.getAttribute("data-open-by-default"))
                    ? +component.getAttribute("data-open-by-default")
                    : false;

            const list = component.querySelector(cfg.listSelector || ".accordion_list");
            let previousIndex = null;
            const closeFunctions = [];

            if (list) {
                // DOM normalization (Webflow wrappers)
                try { flattenDisplayContents(list); } catch (_) { }
                try {
                    if (typeof removeCMSList === "function") removeCMSList(list);
                } catch (_) { }
            }

            const cards = component.querySelectorAll(cfg.itemSelector || ".accordion_component");
            if (!cards.length) {
                cleanups.push(() => {
                    try { delete component.dataset.scriptInitialized; } catch (_) { }
                });
                return;
            }

            cards.forEach((card, cardIndex) => {
                const button = card.querySelector(cfg.buttonSelector || ".accordion_toggle_button");
                const content = card.querySelector(cfg.contentSelector || ".accordion_content_wrap");

                if (!button || !content) {
                    console.warn("[ACCORDION] Elementi mancanti:", card);
                    return;
                }

                // Accessibility
                button.setAttribute("aria-expanded", "false");
                button.setAttribute("id", `accordion_button_${listIndex}_${cardIndex}`);
                content.setAttribute("id", `accordion_content_${listIndex}_${cardIndex}`);
                button.setAttribute("aria-controls", content.id);
                content.setAttribute("aria-labelledby", button.id);

                // Initial state
                content.style.display = "none";

                const refresh = () => {
                    try {
                        if (ScrollTrigger) ScrollTrigger.refresh();
                    } catch (_) { }
                };

                // --- Begin replaced timeline block ---
                const icon = button.querySelector(cfg.iconSelector || ".accordion_icon, [data-accordion-icon]") || null;

                const tl = gsap.timeline({
                    paused: true,
                    defaults: { duration: cfg.duration || 0.3, ease: cfg.ease || "power2.inOut" },
                });

                // Open: height + subtle fade + micro lift (simple, elegant)
                tl.set(content, {
                    display: "block",
                    overflow: "hidden",
                    willChange: "height, opacity, transform",
                });

                const openFrom = { height: 0 };
                const openTo = { height: "auto" };

                if (cfg.animateOpacity !== false) {
                    openFrom.autoAlpha = 0;
                    openTo.autoAlpha = 1;
                }

                const y0 = Number(cfg.openYOffset || 0);
                if (y0) {
                    openFrom.y = y0;
                    openTo.y = 0;
                }

                tl.fromTo(content, openFrom, openTo, 0);

                // Optional icon rotation (if present)
                if (icon) {
                    tl.to(icon, { rotate: 180, duration: (cfg.duration || 0.3) * 0.9, ease: cfg.ease || "power2.inOut" }, 0);
                }

                // Finalize open
                tl.add(() => {
                    try { content.style.overflow = ""; } catch (_) { }
                    try { content.style.willChange = ""; } catch (_) { }
                    try { if (ScrollTrigger) ScrollTrigger.refresh(); } catch (_) { }
                });

                // Finalize close
                tl.eventCallback("onReverseComplete", () => {
                    try { content.style.display = "none"; } catch (_) { }
                    try { content.style.overflow = ""; } catch (_) { }
                    try { content.style.willChange = ""; } catch (_) { }
                    try { gsap.set(content, { clearProps: "height,opacity,transform" }); } catch (_) { }
                    try { if (icon) gsap.set(icon, { rotate: 0, clearProps: "transform" }); } catch (_) { }
                    refresh();
                });

                tl.eventCallback("onComplete", () => {
                    refresh();
                });
                // --- End replaced timeline block ---

                const closeAccordion = () => {
                    if (!card.classList.contains(cfg.activeClass || "is-active")) return;
                    card.classList.remove(cfg.activeClass || "is-active");
                    try { tl.reverse(); } catch (_) { }
                    button.setAttribute("aria-expanded", "false");
                };

                const openAccordion = (instant = false) => {
                    if (closePrevious && previousIndex !== null && previousIndex !== cardIndex) {
                        closeFunctions[previousIndex]?.();
                    }
                    previousIndex = cardIndex;
                    button.setAttribute("aria-expanded", "true");
                    card.classList.add(cfg.activeClass || "is-active");
                    try { instant ? tl.progress(1) : tl.play(); } catch (_) { }
                };

                closeFunctions[cardIndex] = closeAccordion;

                // Default open (1-based index from attribute)
                if (openByDefault === cardIndex + 1) openAccordion(true);

                // Handlers (stored for cleanup)
                const onClick = () => {
                    const isActive = card.classList.contains(cfg.activeClass || "is-active");
                    if (isActive && closeOnSecondClick) {
                        closeAccordion();
                        previousIndex = null;
                    } else {
                        openAccordion();
                    }
                };

                const onEnter = () => openAccordion();

                button.addEventListener("click", onClick);
                if (openOnHover) button.addEventListener("mouseenter", onEnter);

                cleanups.push(() => {
                    try { button.removeEventListener("click", onClick); } catch (_) { }
                    try { button.removeEventListener("mouseenter", onEnter); } catch (_) { }
                    try { tl.kill(); } catch (_) { }
                    try {
                        // Reset minimal state (keep DOM intact)
                        try { if (icon) gsap.set(icon, { rotate: 0, clearProps: "transform" }); } catch (_) { }
                        button.setAttribute("aria-expanded", "false");
                        card.classList.remove(cfg.activeClass || "is-active");
                        content.style.display = "none";
                        content.style.height = "";
                    } catch (_) { }
                });
            });

            cleanups.push(() => {
                try { delete component.dataset.scriptInitialized; } catch (_) { }
            });
        });

        return () => cleanups.forEach((fn) => { try { fn(); } catch (_) { } });
    }

    /* =========================
    CLASSIFY REVEALS (section + divider)
    ========================= */
    function classifyReveals(container) {
        const reveals = Array.from(
            container.querySelectorAll("[data-reveal='section'], [data-reveal='divider']")
        );

        const threshold = window.innerHeight * CONFIG.viewport.aboveThreshold;

        const above = [];
        const below = [];

        reveals.forEach((el) => {
            const rect = el.getBoundingClientRect();
            (rect.top < threshold ? above : below).push(el);
        });

        log(`Reveals: ${above.length} above, ${below.length} below`);
        return { above, below };
    }

    function getRevealType(el) {
        return el?.getAttribute("data-reveal") || "unknown";
    }


    /* =========================
       THEME SCROLL ANIMATION (per-container)
       - Anima body theme su scroll-trigger
       - Richiede colorThemes global API
       - Cleanup deterministic per Barba
       - Usa data-animate-theme-to="none" per disabilitare
    ========================= */

    function initThemeScrollAnimation(scope = document) {
        if (!gsap || !ScrollTrigger) {
            log("[THEME SCROLL] GSAP o ScrollTrigger mancante, skip");
            return () => { };
        }

        const root = getRoot(scope);
        const container = (scope !== document) ? scope : document.querySelector("[data-barba='container']");
        const triggers = root.querySelectorAll("[data-animate-theme-to]");
        if (!triggers.length) return () => { };

        const scrollTriggers = [];

        // NUOVO: Funzione di init vera e propria
        const initTriggers = () => {
            // Controlla di nuovo se colorThemes è pronto
            if (!window.colorThemes || typeof window.colorThemes.getTheme !== "function") {
                log("[THEME SCROLL] colorThemes API ancora non disponibile");
                return;
            }

            triggers.forEach((trigger) => {
                const themeName = trigger.getAttribute("data-animate-theme-to");
                const brandName = trigger.getAttribute("data-animate-brand-to");

                if (!themeName || themeName.trim() === "" || themeName.toLowerCase() === "none") {
                    return;
                }

                let themeVars;
                try {
                    themeVars = window.colorThemes.getTheme(themeName, brandName);
                } catch (e) {
                    console.warn("[THEME SCROLL] Errore nel recupero tema:", e);
                    return;
                }

                if (!themeVars || typeof themeVars !== "object") {
                    console.warn("[THEME SCROLL] Tema non valido:", themeName, brandName);
                    return;
                }

                const st = ScrollTrigger.create({
                    trigger: trigger,
                    start: "top center",
                    end: "bottom center",
                    onToggle: ({ isActive }) => {
                        if (isActive) {
                            gsap.to(container, {
                                ...themeVars,
                                duration: 0.6,
                                ease: "power2.out",
                                overwrite: "auto",
                            });
                            log(`[THEME SCROLL] Activated: ${themeName}${brandName ? ` (${brandName})` : ""}`);
                        }
                    },
                });

                scrollTriggers.push(st);
            });

            log(`[THEME SCROLL] Init OK: ${scrollTriggers.length} triggers`);
        };

        // NUOVO: Se colorThemes è già disponibile, init subito
        if (window.colorThemes && typeof window.colorThemes.getTheme === "function") {
            initTriggers();
        } else {
            // Altrimenti aspetta l'evento
            log("[THEME SCROLL] Aspetto evento colorThemesReady...");

            const onReady = () => {
                initTriggers();
                document.removeEventListener("colorThemesReady", onReady);
            };

            document.addEventListener("colorThemesReady", onReady);
        }

        // Cleanup
        return () => {
            scrollTriggers.forEach((st) => {
                try {
                    st.kill();
                } catch (_) { }
            });
            scrollTriggers.length = 0;
        };
    }

    /* =========================
    MAIL BUTTON HOVER THEME (per-container)
    - Solo namespace "contact"
    - Hover = dark theme su body
    - Cleanup deterministic per Barba
    ========================= */


    function initMailButtonTheme(scope = document) {
        if (!gsap) {
            log("[MAIL BUTTON] GSAP mancante, skip");
            return () => { };
        }

        const root = getRoot(scope);
        const container = (scope !== document) ? scope : document.querySelector("[data-barba='container']");
        const button = root.querySelector("#mail-button");
        if (!button) return () => { };

        // Aspetta che colorThemes sia pronto
        const init = () => {
            if (!window.colorThemes || typeof window.colorThemes.getTheme !== "function") {
                log("[MAIL BUTTON] colorThemes API non disponibile");
                return;
            }

            let darkVars, lightVars;
            try {
                darkVars = window.colorThemes.getTheme("dark");
                lightVars = window.colorThemes.getTheme("light");
            } catch (e) {
                console.warn("[MAIL BUTTON] Errore recupero temi:", e);
                return;
            }

            if (!darkVars || !lightVars) {
                console.warn("[MAIL BUTTON] Temi non validi");
                return;
            }

            const onEnter = () => {
                gsap.to(container, {
                    ...darkVars,
                    duration: 0.7,
                    ease: "power2.out",
                    overwrite: "auto",
                });
                log("[MAIL BUTTON] Hover: dark theme");
            };

            const onLeave = () => {
                gsap.to(container, {
                    ...lightVars,
                    duration: 0.7,
                    ease: "power2.out",
                    overwrite: "auto",
                });
                log("[MAIL BUTTON] Hover out: light theme");
            };

            button.addEventListener("mouseenter", onEnter);
            button.addEventListener("mouseleave", onLeave);

            log("[MAIL BUTTON] Theme hover init OK");

            // Return cleanup
            return () => {
                try {
                    button.removeEventListener("mouseenter", onEnter);
                    button.removeEventListener("mouseleave", onLeave);
                } catch (_) { }
            };
        };

        // Se colorThemes è già disponibile, init subito
        if (window.colorThemes && typeof window.colorThemes.getTheme === "function") {
            return init() || (() => { });
        }

        // Altrimenti aspetta l'evento
        log("[MAIL BUTTON] Aspetto evento colorThemesReady...");

        let cleanup = null;
        const onReady = () => {
            cleanup = init() || (() => { });
            document.removeEventListener("colorThemesReady", onReady);
        };

        document.addEventListener("colorThemesReady", onReady);

        // Return cleanup che rimuove anche il listener dell'evento
        return () => {
            try {
                document.removeEventListener("colorThemesReady", onReady);
            } catch (_) { }
            if (cleanup) cleanup();
        };
    }



    /* =========================
    ANIMATE HERO
    ========================= */
    function animateHero(container) {
        const namespace = getNamespace(container);
        const config = getHeroConfig(namespace);

        const tl = gsap.timeline({
            defaults: { ease: "power2.out" },
            onStart: () => log(`Hero START: ${namespace}`),
            onComplete: () => log(`Hero COMPLETE: ${namespace}`),
        });

        const heroContent = container.querySelector("[data-hero-content]");
        const heroMedia = container.querySelector("[data-hero-media]");

        // Fallback content detection for pages like "apply" (no data-hero-content)
        let applyTextElements = null;
        if (namespace === "apply" && !heroContent) {
            const heroSection = container.querySelector("[data-hero]");
            applyTextElements = heroSection?.querySelectorAll(
                ".u-layout-column-1 .u-text, .u-layout-column-1 .u-rich-text"
            );
        }

        const hasMedia = !!(heroMedia && config.mediaDuration > 0);
        const mediaDelay = Number(config.mediaDelay || 0);
        const mediaDuration = Number(config.mediaDuration || 0);
        const mediaToContentGap = Number(config.mediaToContentGap || 0);

        // If there is nothing to animate (no content, no media), keep labels deterministic at 0
        const contentChildren = heroContent ? getAnimatableChildren(heroContent) : [];
        const hasContent = (contentChildren && contentChildren.length > 0) || (applyTextElements && applyTextElements.length > 0);

        if (!hasContent && !hasMedia) {
            log(`Hero SKIP (no content/media): ${namespace}`);
            tl.addLabel("hero:contentStart", 0);
            tl.addLabel("hero:done", 0);
            return tl;
        }

        // Quando richiesto (es. home): prima media, poi content
        if (hasMedia && config.mediaFirst === true) {
            const realMedia = getRealElement(heroMedia);
            const contentAt = Math.max(0, mediaDelay + mediaDuration + mediaToContentGap);

            tl.to(realMedia, { autoAlpha: 1, duration: mediaDuration }, mediaDelay);

            // Label: inizio contenuti hero (dopo media + gap)
            tl.addLabel("hero:contentStart", contentAt);

            if (heroContent) {
                const children = getAnimatableChildren(heroContent);
                if (children.length) {
                    tl.to(children, { autoAlpha: 1, duration: config.duration, stagger: config.stagger }, contentAt);
                }
            } else if (namespace === "apply") {
                const textElements = applyTextElements;
                if (textElements?.length) {
                    tl.to(textElements, { autoAlpha: 1, duration: config.duration, stagger: config.stagger }, contentAt);
                }
            }

            // Label: fine hero (completa)
            tl.addLabel("hero:done");
            return tl;
        }

        // Default: prima content, poi media (come prima)
        if (heroContent) {
            const children = getAnimatableChildren(heroContent);
            if (children.length) {
                tl.to(children, { autoAlpha: 1, duration: config.duration, stagger: config.stagger }, 0);
            }
        }

        if (namespace === "apply" && !heroContent) {
            const textElements = applyTextElements;
            if (textElements?.length) {
                tl.to(textElements, { autoAlpha: 1, duration: config.duration, stagger: config.stagger }, 0);
            }
        }

        // Label: inizio contenuti hero (default)
        tl.addLabel("hero:contentStart", 0);

        if (hasMedia) {
            const realMedia = getRealElement(heroMedia);
            tl.to(realMedia, { autoAlpha: 1, duration: mediaDuration }, mediaDelay);
        }

        // Label: fine hero (completa)
        tl.addLabel("hero:done");
        return tl;
    }

    /* =========================
    ANIMATE SECTION
    ========================= */
    function animateSection(section) {
        const children = getAnimatableChildren(section);
        const staggerable = getStaggerableElements(section);
        const minCount = CONFIG.revealChildren?.minCount || 2;

        // Se abbiamo abbastanza elementi staggerabili
        if (staggerable.length >= minCount) {
            const tl = gsap.timeline();

            // Anima i children normali (esclusi quelli staggerabili)
            const normalChildren = children.filter(
                (child) => !child.hasAttribute("data-reveal-children")
            );

            if (normalChildren.length) {
                tl.to(normalChildren, {
                    autoAlpha: 1,
                    duration: CONFIG.sections.duration,
                    stagger: CONFIG.sections.childStagger,
                    ease: CONFIG.sections.ease,
                }, 0);
            }

            // Stagger degli elementi marcati (usa config dedicata)
            const revealDelay = CONFIG.revealChildren.delay || 0;
            tl.to(staggerable, {
                autoAlpha: 1,
                duration: CONFIG.revealChildren.duration,
                stagger: CONFIG.revealChildren.stagger,
                ease: CONFIG.revealChildren.ease,
            }, revealDelay);

            return tl;
        }

        // Comportamento standard
        if (children.length) {
            return gsap.to(children, {
                autoAlpha: 1,
                duration: CONFIG.sections.duration,
                stagger: CONFIG.sections.childStagger,
                ease: CONFIG.sections.ease,
            });
        }

        const realSection = getRealElement(section);
        return gsap.to(realSection, {
            autoAlpha: 1,
            duration: CONFIG.sections.duration,
            ease: CONFIG.sections.ease,
        });
    }

    /* =========================
    ANIMATE DIVIDER
    ========================= */
    function animateDivider(divider) {
        const children = getAnimatableChildren(divider);

        if (children.length) {
            return gsap.to(children, {
                autoAlpha: 1,
                duration: CONFIG.dividers.duration,
                stagger: CONFIG.dividers.childStagger,
                ease: CONFIG.dividers.ease,
            });
        }

        const realDivider = getRealElement(divider);
        return gsap.to(realDivider, {
            autoAlpha: 1,
            duration: CONFIG.dividers.duration,
            ease: CONFIG.dividers.ease,
        });
    }

    /* =========================
    REVEAL DISPATCHER (section + divider)
    ========================= */
    function animateReveal(el) {
        const type = getRevealType(el);
        if (type === "divider") return animateDivider(el);
        return animateSection(el);
    }

    function getAboveStaggerFor(el) {
        const type = getRevealType(el);
        return type === "divider" ? CONFIG.dividers.stagger : CONFIG.sections.stagger;
    }

    function animateRevealsAbove(reveals) {
        if (!reveals.length) return gsap.timeline();
        const tl = gsap.timeline();

        let cursor = 0;
        reveals.forEach((el) => {
            tl.add(() => animateReveal(el), cursor);
            cursor += getAboveStaggerFor(el);
        });

        return tl;
    }

    function setupBelowFold(reveals) {
        if (!ScrollTrigger || !reveals.length) return [];
        return reveals.map((el) => {
            const type = getRevealType(el);
            const start = type === "divider" ? CONFIG.dividers.triggerStart : CONFIG.sections.triggerStart;

            return ScrollTrigger.create({
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

        // Hero timeline (la durata puo variare per namespace, es. mediaFirst)
        const heroTL = animateHero(container);
        master.add(heroTL, 0);

        // Fallback: if heroTL is effectively empty (no content/media), reveal above-the-fold immediately.
        const heroDur = typeof heroTL.totalDuration === "function" ? heroTL.totalDuration() : heroTL.duration();
        if (!heroDur || heroDur <= 0.001) {
            master.add(animateRevealsAbove(above), 0);
            const triggers = setupBelowFold(below);

            return {
                timeline: master,
                triggers,
                cleanup: () => {
                    master.kill();
                    triggers.forEach((t) => t.kill());
                },
            };
        }

        // Per-namespace control (se presente): anchor + offset rispetto alle label della hero.
        // Fallback: usa il comportamento globale (gap relativo alla fine hero).
        const namespace = getNamespace(container);
        const heroCfg = getHeroConfig(namespace);

        let anchor = String(heroCfg.revealAnchor || "").trim();
        const offsetRaw = heroCfg.revealOffset;
        const offset = Number(offsetRaw);

        // Safety: if revealOffset is provided but revealAnchor is missing, default to "done"
        if (!anchor && offsetRaw != null && !Number.isNaN(offset)) {
            anchor = "done";
        }

        if (anchor) {
            const baseLabel = anchor === "contentStart" ? "hero:contentStart" : "hero:done";
            const abs = Math.abs(Number.isNaN(offset) ? 0 : offset);
            const pos = Number.isNaN(offset) || offset === 0
                ? baseLabel
                : offset > 0
                    ? `${baseLabel}+=${abs}`
                    : `${baseLabel}-=${abs}`;

            master.add(animateRevealsAbove(above), pos);
        } else {
            const heroGap = Number(CONFIG.overlap.heroToSections || 0);
            const revealPos =
                heroGap === 0
                    ? ">"
                    : heroGap > 0
                        ? `>+=${heroGap}`
                        : `>-= ${Math.abs(heroGap)}`.replace(" ", "");
            master.add(animateRevealsAbove(above), revealPos);
        }

        const triggers = setupBelowFold(below);

        return {
            timeline: master,
            triggers,
            cleanup: () => {
                master.kill();
                triggers.forEach((t) => t.kill());
            },
        };
    }

    /* =========================
       LOADER
    ========================= */
    let loaderDone = false;

    async function runLoader(onHeroStart) {
        if (loaderDone) {
            onHeroStart?.();
            return;
        }
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

        scrollLock();

        gsap.set(loader, { autoAlpha: 1, display: "flex" });
        if (contain) gsap.set(contain, { visibility: "visible", opacity: 1 });
        if (svgs.length) gsap.set(svgs, { y: 20, force3D: true });
        if (paths.length) gsap.set(paths, { autoAlpha: 0 });

        const start = performance.now();

        // === ENTRANCE ===
        const tlIn = gsap.timeline({ defaults: { ease: "power3.out" } });

        // 1. Paths si dissolvono carattere per carattere
        if (paths.length) {
            tlIn.to(paths, {
                autoAlpha: 1,
                duration: 0.9,
                stagger: { each: 0.03, from: "start" },
                ease: "power2.inOut",
            }, 0.4);
        }

        // 2. SVGs salgono — parte a metà del dissolve dei paths
        if (svgs.length) {
            tlIn.to(svgs, {
                y: 0,
                duration: 1.0,
                stagger: 0.05,
                ease: "power2.out",
            }, 0.45);
        }

        await tlIn;

        const elapsed = performance.now() - start;
        const wait = CONFIG.loader.minDuration - elapsed;
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));

        // === EXIT ===
        const tlOut = gsap.timeline({ defaults: { ease: "power2.inOut" } });

        if (svgs.length) {
            tlOut.to(svgs, {
                opacity: 0,
                y: -20,
                duration: CONFIG.loader.fadeOutDuration,
                stagger: 0.04,
            }, 0);
        }

        if (paths.length) {
            tlOut.to(paths, {
                autoAlpha: 0,
                duration: CONFIG.loader.fadeOutDuration * 0.8,
            }, 0);
        }

        tlOut.to(loader, { autoAlpha: 0, duration: CONFIG.loader.fadeOutDuration }, 0.15);

        const heroAt = Math.max(0, CONFIG.loader.fadeOutDuration + CONFIG.overlap.loaderToHero);
        tlOut.call(() => onHeroStart?.(), null, heroAt);

        await tlOut;

        gsap.set(loader, { display: "none" });
        if (svgs.length) gsap.set(svgs, { clearProps: "all" });
        if (contain) gsap.set(contain, { clearProps: "all" });
        document.documentElement.classList.remove("is-loading");
        scrollUnlock();
    }

    /* =========================
       LOADER HOME (crisp)
       Solo per namespace === "home", chiamato da once()
    ========================= */

    async function runLoaderHome(container, onHeroStart) {
    if (loaderDone) { onHeroStart?.(); return; }
    loaderDone = true;

    const crispHeader = container.querySelector(".crisp-header");
    if (!crispHeader) {
        loaderDone = false;
        return runLoader(onHeroStart);
    }

    if (!gsap.parseEase("parallax")) {
        try { CustomEase?.create("parallax", "0.7, 0.05, 0.13, 1"); } catch (_) {}
    }

    scrollLock();

    const headerWrap = document.querySelector(".header_wrap");
    if (headerWrap) gsap.set(headerWrap, { autoAlpha: 0 });

    const heroContent   = crispHeader.querySelector("[data-hero-content]");
    const splitTargets  = heroContent
        ? Array.from(heroContent.querySelectorAll('[data-split="heading"]'))
        : [];

    splitTargets.forEach(el => { el.dataset.soSplitInit = "true"; });

    const revealImgs     = crispHeader.querySelectorAll(".crisp-loader__group > *");
    const scaleUp        = crispHeader.querySelectorAll(".crisp-loader__media");
    const scaleDown      = crispHeader.querySelectorAll(".crisp-loader__media .is--scale-down");
    const isRadius       = crispHeader.querySelectorAll(".crisp-loader__media.is--scaling.is--radius");
    const smallEls       = crispHeader.querySelectorAll(".crisp-header__top, .crisp-header__p");
    const sliderNav      = crispHeader.querySelectorAll(".crisp-header__slider-nav > *");
    const loaderOverlays = crispHeader.querySelectorAll(".crisp-loader__media .u-overlay");

    // LOGO
    const logoWrap  = crispHeader.querySelector(".crisp-loader__logo");
    const logoLeft  = logoWrap?.querySelector(".logo_text.is--left");
    const logoRight = logoWrap?.querySelector(".logo_text.is--right");

    const leftPaths  = logoLeft  ? Array.from(logoLeft.querySelectorAll("path"))  : [];
    const rightPaths = logoRight ? Array.from(logoRight.querySelectorAll("path")) : [];

    if (logoWrap) gsap.set(logoWrap, { autoAlpha: 0 });

    // FIX FLASH: overlay a 0 immediato
    if (loaderOverlays.length) gsap.set(loaderOverlays, { opacity: 0 });

    let allLines = [];

    const tl = gsap.timeline({
        defaults: { ease: "expo.inOut" },
        onStart: () => {
            crispHeader.classList.remove("is--hidden");

            // FIX: path già sotto la maschera PRIMA che logoWrap diventi visibile
            if (leftPaths.length)  gsap.set(leftPaths,  { yPercent: 300 });
            if (rightPaths.length) gsap.set(rightPaths, { yPercent: 300 });

            splitTargets.forEach(el => {
                gsap.set(el, { opacity: 1, visibility: "visible" });
            });

            if (splitTargets.length && SplitText) {
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

    // 0) LOGO IN — rivela il wrap appena prima che i path inizino ad animarsi
    if (logoWrap) tl.set(logoWrap, { autoAlpha: 1 }, 0.49);

    if (leftPaths.length) {
        tl.to(leftPaths, {
            yPercent: 0,
            duration: 1.8,
            stagger: { each: 0.06, from: "end" },
            ease: "expo.out",
        }, 0.5);
    }
    if (rightPaths.length) {
        tl.to(rightPaths, {
            yPercent: 0,
            duration: 1.8,
            stagger: { each: 0.06, from: "start" },
            ease: "expo.out",
        }, 0.8);
    }

    // 1) IMMAGINI
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

    // 2) SCALE UP + LOGO OUT — simultanei
    if (scaleUp.length) {
    const isSmall = window.matchMedia("(width < 48em)").matches;
    tl.fromTo(scaleUp,
        { width: isSmall ? "7.5em" : "10em", height: isSmall ? "10em" : "7.5em" },
        { width: "100vw", height: "100svh", duration: 2.2 },
        "< 0.2"
    );
}

    // LOGO OUT — path escono verso l'ALTO
    if (leftPaths.length) {
        tl.to(leftPaths, {
            yPercent: 200,
            duration: 1.0,
            stagger: { each: 0.04, from: "start" },
            ease: "expo.in",
        }, "<");
    }
    if (rightPaths.length) {
        const isSmall = window.matchMedia("(width < 48em)").matches;
        tl.to(rightPaths, {
            yPercent: 200,
            duration: 1.0,
            stagger: { each: 0.04, from: isSmall ? "end" : "start" },
            ease: "expo.in",
        }, "<0.02");
    }

    if (sliderNav.length) {
        tl.from(sliderNav, { yPercent: 150, stagger: 0.05, ease: "expo.out", duration: 1.2 }, "-=0.9");
    }


    tl.addLabel("overlayDone");


    // 5) Header wrap
    if (headerWrap) {
        tl.to(headerWrap, {
            autoAlpha: 1,
            duration: 0.8,
            ease: "power2.out",
        }, "<1.65");
    }

    // 4) Testo reveal
    tl.add(() => {
        if (!allLines.length) return;
        gsap.to(allLines, {
            yPercent: 0,
            stagger: 0.35,
            ease: "expo.out",
            duration: 1.0,
        });
    }, "<0.7");

    

    if (smallEls.length) {
        tl.from(smallEls, { opacity: 0, ease: "power1.inOut", duration: 0.2 }, "overlayDone+=0.1");
    }

    tl.call(() => {
        crispHeader.classList.remove("is--loading");
        document.documentElement.classList.remove("is-loading");

        container.querySelectorAll('[data-slideshow="wrap"]').forEach(wrap => {
            wrap.__slideshowStart?.();
        });

        onHeroStart?.();
        scrollUnlock();
    }, null, "+=0.45");

    await tl;
    log("[LOADER HOME] completato");
}


    /* =========================
       BARBA NAV UPDATE
    ========================= */

    function initBarbaNavUpdate(data) {
        if (!data?.next?.html) return;

        const $ = window.jQuery || window.$;
        if (!$) return;

        const $next = $(data.next.html).find('[data-barba-update="nav"]');
        if (!$next.length) return;

        $('[data-barba-update="nav"]').each(function (index) {
            const $source = $($next[index]);
            if (!$source.length) return;

            const ariaCurrent = $source.attr("aria-current");
            if (ariaCurrent !== undefined) $(this).attr("aria-current", ariaCurrent);
            else $(this).removeAttr("aria-current");

            const className = $source.attr("class");
            if (className !== undefined) $(this).attr("class", className);
        });
    }

    /* =========================
    TRANSITIONS, slide sync
    ========================= */
    /* =========================
       transitionLeave() — v4

       Comportamento invariato rispetto alla versione originale.
       La nav_wrap viene ignorata — non viene toccata.
       Resta aperta e visibile durante la leave.
       ========================= */
    function transitionLeave(data) {
        const current = data?.current?.container;

        log("Leave: dark overlay + parallax standard");
        scrollLock();

        const transitionWrap = document.querySelector("[data-transition-wrap]");
        const transitionDark = transitionWrap?.querySelector("[data-transition-dark]");

        const tl = gsap.timeline({
            onComplete: () => {
                try { current.remove(); } catch (_) {}
            },
        });

        if (!transitionWrap || !transitionDark) {
            tl.to(current, { autoAlpha: 0, duration: 0.4 });
            return tl;
        }

        // Reduced motion: swap immediato senza animazione
        if (prefersReducedMotion()) {
            tl.set(current, { autoAlpha: 0 });
            return tl;
        }

        if (!gsap.parseEase("parallax")) {
            CustomEase.create("parallax", "0.7, 0.05, 0.13, 1");
        }

        if (window.__navWasOpen) {
            gsap.set(transitionWrap, { zIndex: 45 }); // tra next (50) e nav (40)
        } else {
            gsap.set(transitionWrap, { zIndex: 2 });
        }

        // Dark overlay a 80%
        tl.fromTo(transitionDark,
            { autoAlpha: 0 },
            { autoAlpha: 0.8, duration: 1.2, ease: "parallax" },
            0
        );

        // Current container scivola via verso l'alto
        tl.fromTo(current,
            { y: "0vh" },
            { y: CONFIG.transition.leaveToY, duration: 1.2, ease: "parallax" },
            0
        );

        // nav_wrap si muove identica al current container (solo se menu era aperto)
        if (window.__navWasOpen) {
            const navWrap = document.querySelector(".nav_wrap");
            if (navWrap) {
                tl.fromTo(navWrap,
                    { y: "0vh" },
                    { y: CONFIG.transition.leaveToY, duration: 1.2, ease: "parallax" },
                    0  // stessa position → perfettamente sincronizzati
                );
            }
        }

        // Desktop nav bar (hamburger strip) — micro hide
        const desktopNav = document.querySelector(CONFIG.scrollDir.desktopNavSelector);
        if (desktopNav) {
            tl.to(desktopNav, {
                y: -12,
                autoAlpha: 0,
                duration: 0.5,
                ease: "power2.in",
            }, 0.1);
        }

        tl.set(transitionDark, { autoAlpha: 0 });

        return tl;
    }

    /* =========================
       transitionEnter() — v6

       Se __navWasOpen === true: z-index 50 sul next container
       A t=0.8s (next copre già tutto): reset silenzioso nav + bottone hamburger
       ========================= */
    function transitionEnter(data, onHeroStart) {
        const next = data?.next?.container;

        // FIX: posiziona PRIMA il container fuori schermo, POI esegui preparePage.
        // Così qualsiasi modifica al DOM (is--hidden removal) avviene
        // quando il container è già invisibile e non può flashare.
        const fromMenu = !!window.__navWasOpen;

        gsap.set(next, {
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            zIndex: fromMenu ? 50 : 3,
            y: "100vh",
            autoAlpha: 1,
        });

        // ORA è sicuro: il container è fuori schermo
        preparePage(next);

        if (!gsap.parseEase("parallax")) {
            CustomEase.create("parallax", "0.7, 0.05, 0.13, 1");
        }

        // Reduced motion: swap immediato senza animazione
        if (prefersReducedMotion()) {
            gsap.set(next, { clearProps: "all", autoAlpha: 1 });
            const rmTl = gsap.timeline();
            rmTl.call(() => onHeroStart?.(), null, 0);
            rmTl.call(() => { hardScrollTop(); scrollUnlock(); }, null, 0.05);
            return rmTl;
        }

        const tl = gsap.timeline();

        // Slide up del next container
        tl.fromTo(next,
            { y: "100vh" },
            {
                y: "0vh",
                duration: 1.2,
                ease: "parallax",
                onComplete: () => {
                    gsap.set(next, { clearProps: "position,top,left,width,zIndex,y" });
                },
            },
            0
        );

        // A t=1.0s il next container è già oltre metà schermo — copre la nav.
        // Resettiamo tutto in silenzio: y, display, stato, bottone.
        if (fromMenu) {
            tl.call(() => {
                const navWrap = document.querySelector(".nav_wrap");
                if (!navWrap) return;

                gsap.killTweensOf(navWrap);
                gsap.set(navWrap, { clearProps: "y,transform" });
                navWrap.setAttribute("data-nav", "closed");
                navWrap.style.display = "none";

                // Ripristina il bottone hamburger (era a yPercent:-150 con menu open)
                const btnLayout = document.querySelectorAll(".menu_btn_layout");
                if (btnLayout.length) gsap.to(btnLayout, { yPercent: 0, duration: 0.9, ease: "main" });

                // Ripristina z-index del transition wrap (era 45 durante la leave)
                const transitionWrap = document.querySelector("[data-transition-wrap]");
                if (transitionWrap) gsap.set(transitionWrap, { zIndex: 2 });

                window.__navWasOpen = false;
            }, null, 1.0);
        }

        // Hero start
        const heroAt = CONFIG.transition.heroDelay || 0.7;
        tl.call(() => {
            // Applica tema su body/html SOLO ORA che il next container copre già la viewport
            if (getNamespace(next) === "home") {
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
            try { ScrollDir?.pause(true); } catch (_) {}
            try {
                const desktopNav = document.querySelector(CONFIG.scrollDir.desktopNavSelector);
                if (desktopNav) gsap.set(desktopNav, { clearProps: "y" });
            } catch (_) {}
            try { ScrollDir?.reset(true); } catch (_) {}
            try { ScrollDir?.pause(false); } catch (_) {}
            onHeroStart?.();
        }, null, heroAt);

        // Page ready
        tl.call(() => {
            hardScrollTop();
            if (ScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh(true));
            try { Scroll.lenis?.resize?.(); } catch (_) {}
            scrollUnlock();
            log("Enter: complete");
        }, null, ">");

        return tl;
    }


    /* =========================
       AUTO SCROLL SLIDER (Smooothy)

       Dipendenze: Smooothy (global), GSAP (global)
       Markup: [data-smooothy="1"] sul wrapper del slider

       Pattern: identico agli altri init del blueprint
       - initSmoothySlider(scope) → ritorna cleanup fn
       - chiamato in once() e enter() con data.next.container
       - cleanup chiamato in leave() prima della transizione
       ========================= */

    function initSmoothySlider(scope = document) {
        // Guard: dipendenze
        if (!window.Smooothy) {
            log("[SMOOOTHY] Smooothy non trovato, skip");
            return () => {};
        }
        if (!gsap) {
            log("[SMOOOTHY] GSAP non trovato, skip");
            return () => {};
        }

        const root = getRoot(scope);
        const wrappers = root.querySelectorAll('[data-smooothy="1"]');
        if (!wrappers.length) return () => {};

        // ----------------------------------------
        class AutoScrollSlider extends window.Smooothy {
            #isPaused = false;
            #scrollSpeed = 0.15;     // units per frame (delta-time corrected)
            #wasDragging = false;

            #resumeDelay = 50;
            #resumeTimer = null;

            // Rampa velocità (0..1)
            #speedMul = 0;
            #speedMulTarget = 1;
            #BRAKE_LERP = 0.08;
            #RESUME_LERP = 0.05;

            // Viewport visibility
            #inView = true;
            #io = null;

            // GSAP ticker reference (per cleanup deterministico)
            #tickerFn = null;

            constructor(container, config = {}) {
                super(container, {
                    ...config,
                    infinite: true,
                    snap: false,
                    scrollInput: false,
                    lerpFactor: 0.3,
                    dragSensitivity: 0.005,
                });

                const originalUpdate = super.update.bind(this);

                this.#tickerFn = () => {
                    // 1) Rampa speedMul
                    const lerp = this.#speedMulTarget < this.#speedMul
                        ? this.#BRAKE_LERP
                        : this.#RESUME_LERP;
                    this.#speedMul += (this.#speedMulTarget - this.#speedMul) * lerp;
                    if (Math.abs(this.#speedMulTarget - this.#speedMul) < 0.001) {
                        this.#speedMul = this.#speedMulTarget;
                    }

                    // 2) Auto-scroll: solo se non in pausa, in viewport, visibile, non dragging
                    if (!this.#isPaused && this.#inView && this.isVisible && !this.isDragging) {
                        const v = this.#scrollSpeed * this.#speedMul;
                        // Clamp deltaTime: evita mega catch-up a tab/viewport resume
                        const dt = Math.min(this.deltaTime || 0, 0.05);
                        if (v && dt) this.target -= v * dt;
                    }

                    // 3) Update originale Smooothy + check drag
                    originalUpdate();
                    this.#checkDragging();
                };

                gsap.ticker.add(this.#tickerFn);

                this.#setupPauseOnInteraction(container);
                this.#setupViewportPause(container);

                // Start morbido
                this.#speedMul = 0;
                this.#speedMulTarget = 1;

                log("[SMOOOTHY] init OK", container);
            }

            // ---- PAUSE / RESUME ----
            #pause() {
                this.#isPaused = true;
                this.#speedMulTarget = 0;
                this.#clearResume();
            }

            #resume() {
                this.#isPaused = false;
                this.#speedMulTarget = 1;
            }

            #resumeAfterDelay() {
                this.#clearResume();
                this.#resumeTimer = setTimeout(() => this.#resume(), this.#resumeDelay);
            }

            #clearResume() {
                clearTimeout(this.#resumeTimer);
                this.#resumeTimer = null;
            }

            // ---- DRAG CHECK ----
            #checkDragging() {
                if (this.isDragging && !this.#wasDragging) {
                    this.#wasDragging = true;
                    this.#pause();
                } else if (!this.isDragging && this.#wasDragging) {
                    this.#wasDragging = false;
                    if (this.#inView) this.#resumeAfterDelay();
                }
            }

            // ---- INTERACTION PAUSE ----
            #setupPauseOnInteraction(sliderEl) {
                sliderEl.addEventListener("mouseenter", () => this.#pause());
                sliderEl.addEventListener("mouseleave", () => {
                    if (this.#inView) this.#resumeAfterDelay();
                });

                sliderEl.addEventListener("touchstart", () => this.#pause(), { passive: true });

                const resume = () => {
                    if (this.#inView) this.#resumeAfterDelay();
                };
                sliderEl.addEventListener("touchend",   resume, { passive: true });
                sliderEl.addEventListener("touchcancel", resume, { passive: true });
            }

            // ---- VIEWPORT PAUSE (IntersectionObserver) ----
            #setupViewportPause(sliderEl) {
                if (!("IntersectionObserver" in window)) return;

                this.#io = new IntersectionObserver(
                    (entries) => {
                        const entry = entries[0];
                        const nowInView = !!entry && entry.isIntersecting;
                        if (nowInView === this.#inView) return;

                        this.#inView = nowInView;

                        if (!this.#inView) {
                            this.#speedMulTarget = 0;
                            this.#clearResume();
                        } else {
                            this.#speedMulTarget = (!this.#isPaused && !this.isDragging) ? 1 : 0;
                        }
                    },
                    { threshold: 0.1 }
                );

                this.#io.observe(sliderEl);
            }

            // ---- DESTROY ----
            destroy() {
                this.#clearResume();
                if (this.#tickerFn) {
                    try { gsap.ticker.remove(this.#tickerFn); } catch (_) {}
                    this.#tickerFn = null;
                }
                try { this.#io?.disconnect(); } catch (_) {}
                this.#io = null;
                try { super.destroy?.(); } catch (_) {}
                log("[SMOOOTHY] destroyed");
            }
        }
        // ----------------------------------------

        const instances = [];

        wrappers.forEach((wrapper) => {
            // Guard: no doppio init
            if (wrapper.dataset.smoothyInitialized === "true") return;
            wrapper.dataset.smoothyInitialized = "true";

            try {
                const instance = new AutoScrollSlider(wrapper);
                instances.push({ wrapper, instance });
            } catch (e) {
                console.warn("[SMOOOTHY] init error:", e);
                delete wrapper.dataset.smoothyInitialized;
            }
        });

        // Cleanup deterministico
        return () => {
            instances.forEach(({ wrapper, instance }) => {
                try { instance.destroy(); } catch (_) {}
                try { delete wrapper.dataset.smoothyInitialized; } catch (_) {}
            });
            instances.length = 0;
            log("[SMOOOTHY] cleanup complete");
        };
    }


    /* =========================
    STICKY TOP (layout sticky-left)
    ========================= */
    function initStickyTop(scope = document) {
        const root = getRoot(scope);
        const layout = root.querySelector('[data-wf--layout--variant="sticky-left"]');
        if (!layout) return () => { };

        const col = layout.querySelector('.u-layout-column-1');
        if (!col) return () => { };

        const img = col.querySelector('.u-image-wrapper');
        if (!img) return () => { };

        function update() {
            const imgH = img.offsetHeight;
            const vh = window.innerHeight;
            const top = Math.max(0, (vh - imgH) / 2);
            col.style.top = top + 'px';
        }

        update();
        window.addEventListener('resize', update);

        // Cleanup
        return () => {
            window.removeEventListener('resize', update);
            col.style.top = '';
        };
    }

    /* =========================
    CMS NEXT/PREV
    ========================= */
    // Gestisce navigazione next/prev nei CMS collection list di Webflow
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

            items.forEach((item) => {
                if (item !== displayItem) item.remove();
            });

            if (!displayItem) {
                if (noResultEl) noResultEl.style.display = "block";
                if (hideEmpty) component.style.display = "none";
                return;
            }

            // Sovrascrivi il numero con "Next" (o "Prev")
            const numberEl = displayItem.querySelector(".works_number");
            if (numberEl) {
                numberEl.textContent = showPrev ? "Prev" : "Next";
            }
        });
    }

    /* =========================
       CRISP SLIDESHOW
    ========================= */

    function initSlideShow(el) {
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
    const animationDuration = 2.0;
    const autoplayDelay = 5000;
    let autoplayId = null;

    if (!length) return () => {};

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
        current = targetIndex !== null && targetIndex !== undefined
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
                if (ui.thumbs[current])  ui.thumbs[current].classList.add("is--current");

                // Slide uscente → overlay scurisce durante la transizione
                if (currentOverlay) {
                    gsap.killTweensOf(currentOverlay);
                    gsap.to(currentOverlay, {
                        delay: 0.2,
                        opacity: CONFIG.slideshow.overlayOpacity,
                        duration: animationDuration * 0.9,
                        ease: "power3.out"
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
        if (currentInner)  tl.to(currentInner,  { xPercent:  direction * 75 }, 0);
        tl.fromTo(upcomingSlide, { xPercent:  direction * 100 }, { xPercent: 0 }, 0);
        if (upcomingInner) tl.fromTo(upcomingInner, { xPercent: -direction * 75 }, { xPercent: 0 }, 0);
    }

    el.__slideshowStart = () => {
        if (autoplayId || length < 2) return;
        autoplayId = setInterval(() => navigate(1), autoplayDelay);
    };

    return () => {
        if (autoplayId) { clearInterval(autoplayId); autoplayId = null; }
        el.__slideshowStart = null;
        gsap.killTweensOf([...ui.slides, ...ui.inner.filter(Boolean)]);
        ui.slides[0]?.classList.add("is--current");
        ui.slides.forEach((s, i) => { if (i > 0) s.classList.remove("is--current"); });
        if (ui.thumbs[0]) ui.thumbs[0].classList.add("is--current");
        ui.thumbs.forEach((t, i) => { if (i > 0) t.classList.remove("is--current"); });
    };
}

    /* =========================
    BARBA
    ========================= */
    let currentReveal = null;
    let currentSlidersCleanup = null;
    let currentSlideshowCleanup = null;
    let currentAccordionsCleanup = null;
    let currentFormSuccessCleanup = null;
    let currentThemeScrollCleanup = null; 
    let currentMailButtonCleanup = null; 
    let currentStickyTopCleanup = null;
    let currentSmoothyCleanup = null;
    let currentCrispSlideshowCleanup = null;


    barba.init({
        preventRunning: true,
        //prefetch: true,
        debug: CONFIG.debug,

        transitions: [
            {
                name: "olimpo-slide",
                sync: true,

                async once(data) {
                    const namespace = getNamespace(data.next.container);
                    log(`=== ONCE: ${namespace} ===`);

                    hardScrollTop();
                    preparePage(data.next.container);
                    reinitWebflowForms();
                    initDynamicYear(data.next.container);

                    currentSlideshowCleanup?.();
                    currentSlideshowCleanup = initSlideshow(
                        data.next.container,
                        getSlideshowDelayOverride(namespace)
                    );

                    currentAccordionsCleanup?.();
                    currentAccordionsCleanup = initAccordions(data.next.container);

                    currentFormSuccessCleanup?.();
                    currentFormSuccessCleanup = initFormSuccess(data.next.container);

                    // NUOVO: Theme Scroll Animation
                    currentThemeScrollCleanup?.();
                    currentThemeScrollCleanup = initThemeScrollAnimation(data.next.container);

                    // NUOVO: Mail button theme (solo contact)
                    if (namespace === "contact") {
                        currentMailButtonCleanup?.();
                        currentMailButtonCleanup = initMailButtonTheme(data.next.container);
                    }


                    currentStickyTopCleanup?.();
                    currentStickyTopCleanup = initStickyTop(data.next.container);

                    currentSmoothyCleanup?.();
                    currentSmoothyCleanup = initSmoothySlider(data.next.container);

                    initCmsNextPrev(data.next.container);


                    if (namespace === "home") {
                        // Init slideshow (dentro container, cleanup gestito da Barba)
                        currentCrispSlideshowCleanup?.();
                        const crispWraps = Array.from(data.next.container.querySelectorAll('[data-slideshow="wrap"]'));
                        const crispFns = crispWraps.map(wrap => initSlideShow(wrap));
                        currentCrispSlideshowCleanup = () => crispFns.forEach(fn => { try { fn?.(); } catch (_) {} });

                        // Slider Swiper PRIMA del loader (DOM visibile, Swiper può misurare)
                        currentSlidersCleanup?.();
                        currentSlidersCleanup = initSlidersSimple(data.next.container);
                        data.next.container.__slidersCleanup = currentSlidersCleanup;

                        await runLoaderHome(data.next.container, () => {
                            // Hero già animato dal crisp loader — solo below-fold reveals
                            const { below } = classifyReveals(data.next.container);
                            const triggers = setupBelowFold(below);
                            currentReveal = {
                                timeline: null,
                                triggers,
                                cleanup: () => triggers.forEach(t => { try { t.kill(); } catch (_) {} }),
                            };
                        });

                    } else {
                        await runLoader(() => {
                            // Slider init dopo il loader — container visibile, Swiper può misurare
                            currentSlidersCleanup?.();
                            currentSlidersCleanup = initSlidersSimple(data.next.container);
                            data.next.container.__slidersCleanup = currentSlidersCleanup;

                            currentReveal = createRevealSequence(data.next.container);
                        });
                    }

                    if (ScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh(true));
                },

                leave(data) {
                    const namespace = getNamespace(data.current.container);
                    log(`=== LEAVE: ${namespace} ===`);

                    currentReveal?.cleanup();
                    currentReveal = null;

                    // Slider resta vivo finché l'overlay copre: il destroy avviene in afterLeave
                    currentSlidersCleanup = null;

                    currentSlideshowCleanup?.();
                    currentSlideshowCleanup = null;

                    currentAccordionsCleanup?.();
                    currentAccordionsCleanup = null;

                    currentFormSuccessCleanup?.();
                    currentFormSuccessCleanup = null;

                    // NUOVO: Theme Scroll cleanup
                    currentThemeScrollCleanup?.();
                    currentThemeScrollCleanup = null;

                    // NUOVO: Mail button cleanup
                    currentMailButtonCleanup?.();
                    currentMailButtonCleanup = null;


                    currentStickyTopCleanup?.();
                    currentStickyTopCleanup = null;

                    currentSmoothyCleanup?.();
                    currentSmoothyCleanup = null;

                    currentCrispSlideshowCleanup?.();
                    currentCrispSlideshowCleanup = null;

                    killAllScrollTriggers();

                    return transitionLeave(data);
                },

                enter(data) {
                    const namespace = getNamespace(data.next.container);
                    log(`=== ENTER: ${namespace} ===`);

                    // FIX FLASH: nasconde immediatamente il container appena inserito nel DOM,
                    // prima di qualsiasi init che possa causare reflow/paint.
                    // transitionEnter() lo riporterà autoAlpha:1 con y:100vh prima dello slide-in.
                    gsap.set(data.next.container, { autoAlpha: 0 });

                    initBarbaNavUpdate(data);
                    reinitWebflowForms();
                    initDynamicYear(data.next.container);

                    currentSlidersCleanup?.();
                    currentSlidersCleanup = initSlidersSimple(data.next.container);
                    data.next.container.__slidersCleanup = currentSlidersCleanup;

                    currentSlideshowCleanup?.();
                    currentSlideshowCleanup = initSlideshow(
                        data.next.container,
                        getSlideshowDelayOverride(namespace)
                    );

                    currentAccordionsCleanup?.();
                    currentAccordionsCleanup = initAccordions(data.next.container);

                    currentFormSuccessCleanup?.();
                    currentFormSuccessCleanup = initFormSuccess(data.next.container);

                    // NUOVO: Theme Scroll Animation
                    currentThemeScrollCleanup?.();
                    currentThemeScrollCleanup = initThemeScrollAnimation(data.next.container);

                    // NUOVO: Mail button theme (solo contact)
                    if (namespace === "contact") {
                        currentMailButtonCleanup?.();
                        currentMailButtonCleanup = initMailButtonTheme(data.next.container);
                    }


                    currentStickyTopCleanup?.();
                    currentStickyTopCleanup = initStickyTop(data.next.container);

                    currentSmoothyCleanup?.();
                    currentSmoothyCleanup = initSmoothySlider(data.next.container);

                    initCmsNextPrev(data.next.container);

                    // Crisp slideshow (solo home, arrivando da un'altra pagina)
                    if (namespace === "home") {
                        currentCrispSlideshowCleanup?.();
                        const crispWraps = Array.from(data.next.container.querySelectorAll('[data-slideshow="wrap"]'));
                        const crispFns = crispWraps.map(wrap => initSlideShow(wrap));
                        currentCrispSlideshowCleanup = () => crispFns.forEach(fn => { try { fn?.(); } catch (_) {} });
                    }

                    return transitionEnter(data, () => {
                        if (namespace === "home") {
                            // Avvia autoplay slideshow
                            data.next.container.querySelectorAll('[data-slideshow="wrap"]').forEach(wrap => {
                                wrap.__slideshowStart?.();
                            });
                            // Solo below-fold reveals
                            const { below } = classifyReveals(data.next.container);
                            const triggers = setupBelowFold(below);
                            currentReveal = {
                                timeline: null,
                                triggers,
                                cleanup: () => triggers.forEach(t => { try { t.kill(); } catch (_) {} }),
                            };
                        } else {
                            currentReveal = createRevealSequence(data.next.container);
                        }
                    });
                },
            },
        ],
    });

    // SLIDERS: hard cleanup after leave (container is gone / invisible)
    try {
        if (barba?.hooks?.afterLeave) {
            barba.hooks.afterLeave((data) => {
                const current = data?.current?.container;
                try {
                    if (current && typeof current.__slidersCleanup === "function") {
                        current.__slidersCleanup("hard");
                    }
                } catch (_) { }
            });
        }
    } catch (_) { }

})();
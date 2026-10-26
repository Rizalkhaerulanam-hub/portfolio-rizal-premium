/* ==========================================================
   motion.js — Animasi & Motion Design untuk Portfolio Rizal
   Fitur:
   1. Scroll Progress Bar (bar indikator progress scroll)
   2. Header Scroll State (glassmorphism & bayangan saat scroll)
   3. Page Load Sequence (animasi masuk bertahap hero, foto, chips)
   4. Scroll-Triggered Transitions (clip-path heading, stagger card, slide trait)
   5. Skill Bar & Counter Animation (progress bar & angka persen naik)
   6. 3D Card Tilt Effect (efek miring 3D mengikuti kursor)
   7. Card Shimmer Glow Sweep (kilauan cahaya saat card disentuh/hover)
   8. Active Navigation on Scroll (indikator garis navigasi aktif dinamis)
   9. Anchor Smooth Navigation & Section Highlight Flash
   10. Theme Toggle Ripple Effect (efek riak menyebar dari tombol tema)
   11. Floating Particles di Hero Section
   12. Page Transition (transisi halus saat berpindah antar halaman)
   ========================================================== */

(() => {
  "use strict";

  // Cek preferensi hemat gerak pengguna
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ----------------------------------------------------------
     1. SCROLL PROGRESS BAR
     Bar tipis bergradasi emas di atas layar penunjuk progress
  ---------------------------------------------------------- */
  function initScrollProgress() {
    let bar = document.querySelector(".scroll-progress-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "scroll-progress-bar";
      bar.setAttribute("aria-hidden", "true");
      document.body.appendChild(bar);
    }

    let ticking = false;
    const updateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, percent)) + "%";
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(updateProgress);
          ticking = true;
        }
      },
      { passive: true }
    );
    updateProgress();
  }

  /* ----------------------------------------------------------
     2. HEADER SCROLL STATE
     Menambah bayangan & border dinamis pada navbar saat di-scroll
  ---------------------------------------------------------- */
  function initHeaderScrollState() {
    const header =
      document.querySelector("header") ||
      document.querySelector(".site-header");
    if (!header) return;

    let ticking = false;
    const checkScroll = () => {
      const isScrolled = (window.scrollY || document.documentElement.scrollTop) > 20;
      header.classList.toggle("is-scrolled", isScrolled);
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(checkScroll);
          ticking = true;
        }
      },
      { passive: true }
    );
    checkScroll();
  }

  /* ----------------------------------------------------------
     3. PAGE LOAD SEQUENCE
     Animasi staggered saat halaman baru pertama kali dimuat
  ---------------------------------------------------------- */
  function initPageLoadSequence() {
    // Header slide down
    const header =
      document.querySelector("header") ||
      document.querySelector(".site-header");
    if (header) {
      header.classList.add("motion-header-init");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          header.classList.add("motion-header-in");
        });
      });
    }

    // Hero elemen berurutan
    const heroSequence = [
      { selector: ".hero .hi",                     delay: 180 },
      { selector: ".hero h1",                       delay: 320 },
      { selector: ".hero .roles",                   delay: 460 },
      { selector: ".hero .lead",                    delay: 580 },
      { selector: ".hero .btns",                    delay: 700 },
      { selector: ".hero .social",                  delay: 820 },
      { selector: ".hero .social-proof-above-fold", delay: 940 },
      // Untuk halaman sub (Canva, Video, dll)
      { selector: ".page-hero .back-link",          delay: 150 },
      { selector: ".page-hero .eyebrow",            delay: 260 },
      { selector: ".page-hero h1",                  delay: 380 },
      { selector: ".page-hero .heading-note",       delay: 500 },
    ];

    heroSequence.forEach(({ selector, delay }) => {
      const el = document.querySelector(selector);
      if (!el) return;
      el.classList.add("motion-hero-item-init");
      setTimeout(() => {
        requestAnimationFrame(() => el.classList.add("motion-hero-item-in"));
      }, delay);
    });

    // Foto profil hero masuk dari kanan
    const photo = document.querySelector(".hero .photo");
    if (photo) {
      photo.classList.add("motion-photo-init");
      setTimeout(() => {
        requestAnimationFrame(() => photo.classList.add("motion-photo-in"));
      }, 400);
    }

    // Chip badges pop bounce effect
    const chips = document.querySelectorAll(".hero .chip");
    chips.forEach((chip, i) => {
      chip.classList.add("motion-chip-init");
      setTimeout(() => {
        requestAnimationFrame(() => chip.classList.add("motion-chip-in"));
      }, 640 + i * 140);
    });
  }

  /* ----------------------------------------------------------
     4. SCROLL-TRIGGERED TRANSITIONS
     IntersectionObserver untuk transisi dramatis tiap bagian
  ---------------------------------------------------------- */
  function initScrollAnimations() {
    const makeObserver = (callback, options = {}) =>
      new IntersectionObserver(callback, {
        threshold: 0.15,
        ...options,
      });

    // 4a. Eyebrow labels (fade + letter-spacing expand)
    const eyebrowObs = makeObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("motion-eyebrow-in");
            eyebrowObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    document.querySelectorAll("section .eyebrow").forEach((el) => {
      el.classList.add("motion-eyebrow-init");
      eyebrowObs.observe(el);
    });

    // 4b. Section Headings H2 (clip-path reveal dari bawah)
    const h2Obs = makeObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("motion-h2-in");
            h2Obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    document.querySelectorAll("section h2").forEach((el) => {
      el.classList.add("motion-h2-init");
      h2Obs.observe(el);
    });

    // 4c. Sub-headings
    const subObs = makeObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("motion-sub-in");
            subObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    document.querySelectorAll("section .sub").forEach((el) => {
      el.classList.add("motion-sub-init");
      subObs.observe(el);
    });

    // 4d. Paragraf deskriptif
    const paraObs = makeObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("motion-para-in");
            paraObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document
      .querySelectorAll("section p:not(.eyebrow):not(.sub):not(.note)")
      .forEach((el, i) => {
        el.classList.add("motion-para-init");
        el.style.setProperty("--para-delay", `${(i % 3) * 90}ms`);
        paraObs.observe(el);
      });

    // 4e. Cards & Project Cards (staggered fade + slide up + scale)
    const cardObs = makeObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const card = e.target;
            const idx = parseInt(card.dataset.cardIdx || 0, 10);
            setTimeout(() => {
              requestAnimationFrame(() => card.classList.add("motion-card-in"));
            }, idx * 110);
            cardObs.unobserve(card);
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".card, .project-card").forEach((card, i) => {
      card.classList.add("motion-card-init");
      card.dataset.cardIdx = i % 6;
      cardObs.observe(card);
    });

    // 4f. Traits (slide dari kiri satu per satu)
    const traitObs = makeObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = parseInt(e.target.dataset.traitIdx || 0, 10);
            setTimeout(() => {
              requestAnimationFrame(() =>
                e.target.classList.add("motion-trait-in")
              );
            }, idx * 130);
            traitObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    document.querySelectorAll(".trait").forEach((el, i) => {
      el.classList.add("motion-trait-init");
      el.dataset.traitIdx = i;
      traitObs.observe(el);
    });

    // 4g. Blockquote (fade + rotate lembut)
    const bqObs = makeObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("motion-bq-in");
            bqObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    document.querySelectorAll("blockquote").forEach((el) => {
      el.classList.add("motion-bq-init");
      bqObs.observe(el);
    });

    // 4h. Journey items (timeline & sertifikat)
    const journeyObs = makeObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = parseInt(e.target.dataset.journeyIdx || 0, 10);
            setTimeout(() => {
              requestAnimationFrame(() =>
                e.target.classList.add("motion-journey-in")
              );
            }, idx * 160);
            journeyObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    document.querySelectorAll(".tl, .cert").forEach((el, i) => {
      el.classList.add("motion-journey-init");
      el.dataset.journeyIdx = i;
      journeyObs.observe(el);
    });
  }

  /* ----------------------------------------------------------
     5. SKILL BAR & NUMBER COUNTER ANIMATION
     Progress bar mengisi dari 0% ke nilai aktual dengan angka yang naik
  ---------------------------------------------------------- */
  function initSkillBars() {
    const barsSection = document.querySelector(".bars");
    if (!barsSection) return;

    const levelRegex = /skill-level-(\d+)/;
    const allBars = barsSection.querySelectorAll(".bar");

    allBars.forEach((bar) => {
      const fill = bar.querySelector("i[class*='skill-level-']");
      const numElem = bar.querySelector(".row b");
      if (!fill) return;

      const match = fill.className.match(levelRegex);
      if (match) {
        const targetPercent = parseInt(match[1], 10);
        fill.dataset.targetWidth = targetPercent + "%";
        fill.style.width = "0%";
        fill.style.transition = "none";

        if (numElem) {
          numElem.dataset.targetNum = targetPercent;
          numElem.textContent = "0%";
        }
      }
    });

    // Animasi counter angka halus
    const animateCounter = (elem, target, duration = 1200) => {
      const startTime = performance.now();
      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing cubic out
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.round(easeOut * target);
        elem.textContent = currentVal + "%";

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          elem.textContent = target + "%";
        }
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            allBars.forEach((bar, i) => {
              const fill = bar.querySelector("i[class*='skill-level-']");
              const numElem = bar.querySelector(".row b");
              const target = fill?.dataset.targetWidth || "0%";
              const targetNum = parseInt(numElem?.dataset.targetNum || "0", 10);

              setTimeout(() => {
                if (fill) {
                  fill.style.transition =
                    "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)";
                  requestAnimationFrame(() => {
                    fill.style.width = target;
                  });
                }
                if (numElem) {
                  animateCounter(numElem, targetNum, 1200);
                }
              }, 180 + i * 110);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(barsSection);
  }

  /* ----------------------------------------------------------
     6. 3D CARD TILT EFFECT
     Kartu miring dinamis 3D mengikuti posisi mouse
  ---------------------------------------------------------- */
  function initCardTilt() {
    if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches)
      return;

    const cards = document.querySelectorAll(".card, .project-card");
    cards.forEach((card) => {
      let bounds = null;

      const updateBounds = () => {
        bounds = card.getBoundingClientRect();
      };

      const onMouseMove = (e) => {
        if (!bounds) updateBounds();
        const mouseX = e.clientX - bounds.left;
        const mouseY = e.clientY - bounds.top;
        const xPct = mouseX / bounds.width - 0.5;
        const yPct = mouseY / bounds.height - 0.5;

        const rotateX = (-yPct * 7).toFixed(2);
        const rotateY = (xPct * 7).toFixed(2);

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.015)`;
      };

      const onMouseEnter = () => {
        updateBounds();
        card.style.transition =
          "transform 0.12s ease-out, box-shadow 0.25s ease, border-color 0.25s ease";
      };

      const onMouseLeave = () => {
        card.style.transition =
          "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.25s ease";
        card.style.transform = "";
      };

      card.addEventListener("mouseenter", onMouseEnter);
      card.addEventListener("mousemove", onMouseMove);
      card.addEventListener("mouseleave", onMouseLeave);
      window.addEventListener("resize", updateBounds, { passive: true });
    });
  }

  /* ----------------------------------------------------------
     7. CARD SHIMMER GLOW ELEMENT
     Kilauan cahaya yang menyapu kartu saat disentuh/hover
  ---------------------------------------------------------- */
  function initCardShimmer() {
    document.querySelectorAll(".card, .project-card").forEach((card) => {
      if (!card.querySelector(".card-shimmer")) {
        const shimmer = document.createElement("div");
        shimmer.className = "card-shimmer";
        shimmer.setAttribute("aria-hidden", "true");
        card.appendChild(shimmer);
      }
    });
  }

  /* ----------------------------------------------------------
     8. ACTIVE NAVIGATION INDICATOR ON SCROLL
     Update otomatis garis aktif di menu navigasi sesuai section
  ---------------------------------------------------------- */
  function initActiveNavOnScroll() {
    const navLinks = document.querySelectorAll("header nav a");
    if (!navLinks.length) return;

    const sections = Array.from(navLinks)
      .map((link) => {
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
          return document.querySelector(href);
        }
        return null;
      })
      .filter(Boolean);

    if (!sections.length) return;

    const updateActiveNav = () => {
      const scrollPos = window.scrollY + 120;
      let currentSectionId = "";

      sections.forEach((sec) => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          currentSectionId = sec.getAttribute("id");
        }
      });

      navLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (href === `#${currentSectionId}`) {
          link.classList.add("is-active");
        } else {
          link.classList.remove("is-active");
        }
      });
    };

    window.addEventListener("scroll", updateActiveNav, { passive: true });
    updateActiveNav();
  }

  /* ----------------------------------------------------------
     9. ANCHOR NAVIGATION & SECTION HIGHLIGHT FLASH
     Highlight lembut pada section tujuan saat diklik di navigasi
  ---------------------------------------------------------- */
  function initNavFlash() {
    document.querySelectorAll("header nav a, .logo, footer a").forEach((link) => {
      link.addEventListener("click", () => {
        const id = link.getAttribute("href");
        if (!id || !id.startsWith("#")) return;
        const target = document.querySelector(id);
        if (!target) return;

        target.classList.remove("motion-section-flash");
        void target.offsetWidth; // Force reflow
        target.classList.add("motion-section-flash");

        target.addEventListener(
          "animationend",
          () => target.classList.remove("motion-section-flash"),
          { once: true }
        );
      });
    });
  }

  /* ----------------------------------------------------------
     10. THEME TOGGLE RIPPLE EFFECT
     Riak cahaya melingkar yang menyebar saat tema diganti
  ---------------------------------------------------------- */
  function initThemeRipple() {
    const themeBtn =
      document.getElementById("theme") ||
      document.getElementById("themeToggle");
    if (!themeBtn) return;

    themeBtn.addEventListener("click", () => {
      const rect = themeBtn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const maxDist = Math.sqrt(
        Math.max(cx, window.innerWidth - cx) ** 2 +
          Math.max(cy, window.innerHeight - cy) ** 2
      );

      const ripple = document.createElement("div");
      ripple.className = "theme-ripple";
      ripple.style.cssText = `
        left: ${cx}px;
        top: ${cy}px;
        --ripple-size: ${Math.round(maxDist * 2.3)}px;
      `;
      document.body.appendChild(ripple);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ripple.classList.add("theme-ripple-active");
        });
      });

      ripple.addEventListener(
        "transitionend",
        () => ripple.remove(),
        { once: true }
      );
      // Fallback penghapusan
      setTimeout(() => ripple.remove(), 1000);
    });
  }

  /* ----------------------------------------------------------
     11. FLOATING PARTICLES DI HERO
     Titik partikel ambient bergerak halus di latar belakang hero
  ---------------------------------------------------------- */
  function initHeroParticles() {
    const heroBgAnim = document.querySelector(".hero-bg-anim");
    if (!heroBgAnim) return;

    // Koordinat, ukuran, delay, dan durasi partikel
    const configs = [
      [12, 22, 4, 0.0, 8.5],
      [82, 16, 3, 1.4, 11.0],
      [48, 70, 5, 2.8, 12.5],
      [24, 76, 3, 0.6, 9.0],
      [70, 42, 4, 2.1, 10.5],
      [36, 32, 3, 3.8, 7.5],
      [88, 65, 5, 1.2, 11.5],
      [10, 56, 3, 3.2, 9.5],
    ];

    configs.forEach(([x, y, size, delay, duration]) => {
      const p = document.createElement("div");
      p.className = "hero-particle";
      p.setAttribute("aria-hidden", "true");
      p.style.cssText = `
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
      `;
      heroBgAnim.appendChild(p);
    });
  }

  /* ----------------------------------------------------------
     12. PAGE TRANSITION (PERGANTIAN HALAMAN)
     Transisi fade halus saat pengguna berpindah halaman
  ---------------------------------------------------------- */
  function initPageTransitions() {
    let overlay = document.querySelector(".page-transition-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "page-transition-overlay";
      overlay.setAttribute("aria-hidden", "true");
      document.body.appendChild(overlay);
    }

    // Saat halaman selesai dimuat, hilangkan overlay
    requestAnimationFrame(() => {
      overlay.classList.remove("is-active");
    });

    // Handle bfcache (tombol back/forward browser)
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) {
        overlay.classList.remove("is-active");
      }
    });

    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        href.includes("://")
      ) {
        return;
      }

      link.addEventListener("click", (e) => {
        if (
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0
        )
          return;

        e.preventDefault();
        overlay.classList.add("is-active");
        setTimeout(() => {
          window.location.href = href;
        }, 280);
      });
    });
  }

  /* ----------------------------------------------------------
     13. INISIALISASI UTAMA
  ---------------------------------------------------------- */
  function init() {
    // Komponen utilitas & visual
    initScrollProgress();
    initHeaderScrollState();
    initHeroParticles();
    initCardShimmer();
    initNavFlash();
    initPageTransitions();
    initActiveNavOnScroll();

    // Jika reduced motion aktif, lewati animasi berbasis pergerakan
    if (prefersReducedMotion) {
      document
        .querySelectorAll(
          ".hero .hi, .hero h1, .hero .roles, .hero .lead, " +
            ".hero .btns, .hero .social, .hero .social-proof-above-fold, " +
            ".hero .photo, .hero .chip, .page-hero .back-link, " +
            ".page-hero .eyebrow, .page-hero h1, .page-hero .heading-note"
        )
        .forEach((el) => el.classList.add("motion-reduced"));
      return;
    }

    // Jalankan seluruh animasi interaktif
    initPageLoadSequence();
    initScrollAnimations();
    initSkillBars();
    initCardTilt();
    initThemeRipple();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

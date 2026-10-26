/* ==========================================================
   motion.js — Animasi & Motion Design untuk Portfolio Rizal
   Semua animasi menghormati prefers-reduced-motion
   Tidak menggunakan library eksternal (vanilla JS + CSS)
   ========================================================== */

(() => {
  "use strict";

  /* ----------------------------------------------------------
     CEK PREFERENSI GERAK PENGGUNA
     Jika reduced-motion aktif, semua animasi dinonaktifkan
  ---------------------------------------------------------- */
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ----------------------------------------------------------
     1. SCROLL PROGRESS BAR
     Bar tipis di bagian atas yang menunjukkan progress scroll
  ---------------------------------------------------------- */
  function initScrollProgress() {
    const bar = document.createElement("div");
    bar.className = "scroll-progress-bar";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = percent + "%";
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  /* ----------------------------------------------------------
     2. HEADER SCROLLED STATE
     Tambahkan class 'is-scrolled' saat user scroll ke bawah
  ---------------------------------------------------------- */
  function initHeaderScrollState() {
    const header = document.querySelector("header");
    if (!header) return;

    const toggleScrolled = () => {
      const isScrolled = window.scrollY > 20;
      header.classList.toggle("is-scrolled", isScrolled);
    };

    window.addEventListener("scroll", toggleScrolled, { passive: true });
    toggleScrolled();
  }

  /* ----------------------------------------------------------
     3. PAGE LOAD SEQUENCE
     Animasi staggered saat halaman pertama kali dimuat
  ---------------------------------------------------------- */
  function initPageLoadSequence() {
    // Header slide-down dari atas
    const header = document.querySelector("header");
    if (header) {
      header.classList.add("motion-header-init");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          header.classList.add("motion-header-in");
        });
      });
    }

    // Elemen hero dengan delay stagger (ms)
    const heroSequence = [
      { selector: ".hero .hi",                     delay: 200 },
      { selector: ".hero h1",                       delay: 350 },
      { selector: ".hero .roles",                   delay: 480 },
      { selector: ".hero .lead",                    delay: 600 },
      { selector: ".hero .btns",                    delay: 720 },
      { selector: ".hero .social",                  delay: 840 },
      { selector: ".hero .social-proof-above-fold", delay: 980 },
    ];

    heroSequence.forEach(({ selector, delay }) => {
      const el = document.querySelector(selector);
      if (!el) return;
      el.classList.add("motion-hero-item-init");
      setTimeout(() => {
        requestAnimationFrame(() => el.classList.add("motion-hero-item-in"));
      }, delay);
    });

    // Hero photo masuk dari kanan dengan scale
    const photo = document.querySelector(".hero .photo");
    if (photo) {
      photo.classList.add("motion-photo-init");
      setTimeout(() => {
        requestAnimationFrame(() => photo.classList.add("motion-photo-in"));
      }, 420);
    }

    // Chip badges masuk dengan bounce pop effect
    const chips = document.querySelectorAll(".hero .chip");
    chips.forEach((chip, i) => {
      chip.classList.add("motion-chip-init");
      setTimeout(() => {
        requestAnimationFrame(() => chip.classList.add("motion-chip-in"));
      }, 650 + i * 130);
    });
  }

  /* ----------------------------------------------------------
     4. SCROLL-TRIGGERED ANIMATIONS
     IntersectionObserver untuk animasi saat elemen masuk viewport
  ---------------------------------------------------------- */
  function initScrollAnimations() {

    // Helper: buat observer sederhana
    const makeObserver = (callback, options = {}) =>
      new IntersectionObserver(callback, {
        threshold: 0.15,
        ...options,
      });

    // --- 4a. Eyebrow labels: fade + letter-spacing expand ---
    const eyebrowObs = makeObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("motion-eyebrow-in");
          eyebrowObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll("section .eyebrow").forEach((el) => {
      el.classList.add("motion-eyebrow-init");
      eyebrowObs.observe(el);
    });

    // --- 4b. Section h2: clip-path reveal ---
    const h2Obs = makeObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("motion-h2-in");
          h2Obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll("section h2").forEach((el) => {
      el.classList.add("motion-h2-init");
      h2Obs.observe(el);
    });

    // --- 4c. Sub heading ---
    const subObs = makeObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("motion-sub-in");
          subObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll("section .sub").forEach((el) => {
      el.classList.add("motion-sub-init");
      subObs.observe(el);
    });

    // --- 4d. Paragraf section: fade + translateX ---
    const paraObs = makeObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("motion-para-in");
          paraObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    document
      .querySelectorAll("section p:not(.eyebrow):not(.sub):not(.note)")
      .forEach((el, i) => {
        el.classList.add("motion-para-init");
        el.style.setProperty("--para-delay", `${(i % 4) * 80}ms`);
        paraObs.observe(el);
      });

    // --- 4e. Cards: fade + translateY + scale stagger ---
    const cardObs = makeObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const card = e.target;
          const idx = parseInt(card.dataset.cardIdx || 0);
          setTimeout(() => {
            requestAnimationFrame(() => card.classList.add("motion-card-in"));
          }, idx * 110);
          cardObs.unobserve(card);
        }
      });
    }, { threshold: 0.06 });

    document.querySelectorAll(".card").forEach((card, i) => {
      card.classList.add("motion-card-init");
      card.dataset.cardIdx = i % 6;
      cardObs.observe(card);
    });

    // --- 4f. Traits: slide dari kiri satu per satu ---
    const traitObs = makeObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const idx = parseInt(e.target.dataset.traitIdx || 0);
          setTimeout(() => {
            requestAnimationFrame(() =>
              e.target.classList.add("motion-trait-in")
            );
          }, idx * 130);
          traitObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll(".trait").forEach((el, i) => {
      el.classList.add("motion-trait-init");
      el.dataset.traitIdx = i;
      traitObs.observe(el);
    });

    // --- 4g. Blockquote: fade + rotation ---
    const bqObs = makeObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("motion-bq-in");
          bqObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.25 });

    document.querySelectorAll("blockquote").forEach((el) => {
      el.classList.add("motion-bq-init");
      bqObs.observe(el);
    });

    // --- 4h. Journey items: slide in dengan stagger ---
    const journeyObs = makeObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const idx = parseInt(e.target.dataset.journeyIdx || 0);
          setTimeout(() => {
            requestAnimationFrame(() =>
              e.target.classList.add("motion-journey-in")
            );
          }, idx * 160);
          journeyObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll(".tl, .cert").forEach((el, i) => {
      el.classList.add("motion-journey-init");
      el.dataset.journeyIdx = i;
      journeyObs.observe(el);
    });
  }

  /* ----------------------------------------------------------
     5. SKILL BAR ANIMATION
     Animasikan fill bar dari 0% ke nilai sebenarnya saat masuk viewport
     Nilai dibaca dari class CSS: .skill-level-65 → 65%
  ---------------------------------------------------------- */
  function initSkillBars() {
    const barsSection = document.querySelector(".bars");
    if (!barsSection) return;

    const levelRegex = /skill-level-(\d+)/;

    // Simpan target width asli, lalu set ke 0
    const allFills = barsSection.querySelectorAll("i[class*='skill-level-']");
    allFills.forEach((fill) => {
      const match = fill.className.match(levelRegex);
      if (match) {
        fill.dataset.targetWidth = match[1] + "%";
        fill.style.width = "0%";
        fill.style.transition = "none";
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const fills = entry.target.querySelectorAll(
              "i[class*='skill-level-']"
            );
            fills.forEach((fill, i) => {
              const target = fill.dataset.targetWidth || "0%";
              setTimeout(() => {
                fill.style.transition =
                  "width 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
                requestAnimationFrame(() => {
                  fill.style.width = target;
                });
              }, 200 + i * 120);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(barsSection);
  }

  /* ----------------------------------------------------------
     6. THEME RIPPLE EFFECT
     Ripple menyebar dari posisi tombol theme toggle ke seluruh layar
  ---------------------------------------------------------- */
  function initThemeRipple() {
    const themeBtn = document.getElementById("theme");
    if (!themeBtn) return;

    themeBtn.addEventListener("click", () => {
      const rect = themeBtn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Hitung radius untuk menutupi seluruh layar
      const maxDist = Math.sqrt(
        Math.max(cx, window.innerWidth - cx) ** 2 +
          Math.max(cy, window.innerHeight - cy) ** 2
      );

      const ripple = document.createElement("div");
      ripple.className = "theme-ripple";
      ripple.style.cssText = `
        left: ${cx}px;
        top: ${cy}px;
        --ripple-size: ${maxDist * 2.2}px;
      `;
      document.body.appendChild(ripple);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ripple.classList.add("theme-ripple-active");
        });
      });

      // Bersihkan setelah animasi selesai
      ripple.addEventListener(
        "transitionend",
        () => ripple.remove(),
        { once: true }
      );
    });
  }

  /* ----------------------------------------------------------
     7. FLOATING PARTICLES DI HERO
     Partikel kecil melayang di background hero section
  ---------------------------------------------------------- */
  function initHeroParticles() {
    const heroBgAnim = document.querySelector(".hero-bg-anim");
    if (!heroBgAnim) return;

    // [x%, y%, ukuran-px, delay-s, durasi-s]
    const configs = [
      [12, 18, 4, 0.0, 8],
      [78, 12, 3, 1.5, 11],
      [52, 68, 5, 3.0, 13],
      [22, 72, 3, 0.8, 9],
      [68, 38, 4, 2.2, 10],
      [38, 28, 3, 4.0, 7],
      [86, 62, 5, 1.0, 12],
      [8,  52, 3, 3.5, 9],
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
     8. NAV SECTION HIGHLIGHT FLASH
     Saat klik nav link, section target mendapat highlight flash
  ---------------------------------------------------------- */
  function initNavFlash() {
    document.querySelectorAll("header nav a").forEach((link) => {
      link.addEventListener("click", () => {
        const id = link.getAttribute("href");
        if (!id || !id.startsWith("#")) return;
        const target = document.querySelector(id);
        if (!target) return;

        target.classList.remove("motion-section-flash");
        void target.offsetWidth; // force reflow
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
     9. CARD SHIMMER ELEMENT
     Inject elemen shimmer ke setiap card
  ---------------------------------------------------------- */
  function initCardShimmer() {
    document.querySelectorAll(".card").forEach((card) => {
      if (!card.querySelector(".card-shimmer")) {
        const shimmer = document.createElement("div");
        shimmer.className = "card-shimmer";
        shimmer.setAttribute("aria-hidden", "true");
        card.appendChild(shimmer);
      }
    });
  }

  /* ----------------------------------------------------------
     10. INISIALISASI UTAMA
  ---------------------------------------------------------- */
  function init() {
    // Selalu inisialisasi (tidak bergantung reduced-motion)
    initScrollProgress();
    initHeaderScrollState();
    initHeroParticles();
    initCardShimmer();
    initNavFlash();

    if (prefersReducedMotion) {
      // Tampilkan semua elemen langsung tanpa animasi
      document
        .querySelectorAll(
          ".hero .hi, .hero h1, .hero .roles, .hero .lead, " +
          ".hero .btns, .hero .social, .hero .social-proof-above-fold, " +
          ".hero .photo, .hero .chip"
        )
        .forEach((el) => el.classList.add("motion-reduced"));
      return;
    }

    // Jalankan semua animasi
    initPageLoadSequence();
    initScrollAnimations();
    initSkillBars();
    initThemeRipple();
  }

  // Jalankan setelah DOM siap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

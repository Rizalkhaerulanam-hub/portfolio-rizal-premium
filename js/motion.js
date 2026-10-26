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
     Bar tipis di bagian atas header yang menunjukkan progress scroll
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
     2. PAGE LOAD SEQUENCE
     Animasi staggered saat halaman pertama kali dimuat:
     header → hi → h1 → roles → lead → btns → social → proof → photo → chips
  ---------------------------------------------------------- */
  function initPageLoadSequence() {
    // Tandai elemen header untuk animasi slide-down
    const header = document.querySelector("header");
    if (header) {
      header.classList.add("motion-header-init");
      // Gunakan rAF untuk memastikan class ditambahkan setelah paint pertama
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          header.classList.add("motion-header-in");
        });
      });
    }

    // Daftar elemen hero dengan delay stagger (ms)
    const heroSequence = [
      { selector: ".hero .hi", delay: 200 },
      { selector: ".hero h1", delay: 350 },
      { selector: ".hero .roles", delay: 500 },
      { selector: ".hero .lead", delay: 650 },
      { selector: ".hero .btns", delay: 800 },
      { selector: ".hero .social", delay: 900 },
      { selector: ".hero .social-proof-above-fold", delay: 1050 },
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
      }, 400);
    }

    // Chip badges masuk dengan bounce pop
    const chips = document.querySelectorAll(".hero .chip");
    chips.forEach((chip, i) => {
      chip.classList.add("motion-chip-init");
      setTimeout(() => {
        requestAnimationFrame(() => chip.classList.add("motion-chip-in"));
      }, 600 + i * 120);
    });
  }

  /* ----------------------------------------------------------
     3. SCROLL-TRIGGERED ANIMATIONS
     IntersectionObserver untuk animasi saat elemen masuk viewport
  ---------------------------------------------------------- */
  function initScrollAnimations() {
    // --- 3a. Eyebrow labels: fade + letter-spacing expand ---
    const eyebrows = document.querySelectorAll("section .eyebrow");
    const eyebrowObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("motion-eyebrow-in");
            eyebrowObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    eyebrows.forEach((el) => {
      el.classList.add("motion-eyebrow-init");
      eyebrowObserver.observe(el);
    });

    // --- 3b. Section h2: clip-path reveal (dari bawah ke atas) ---
    const h2s = document.querySelectorAll("section h2");
    const h2Observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("motion-h2-in");
            h2Observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    h2s.forEach((el) => {
      el.classList.add("motion-h2-init");
      h2Observer.observe(el);
    });

    // --- 3c. Paragraf section: fade + translateX ---
    const sectionParas = document.querySelectorAll(
      "section p:not(.eyebrow):not(.sub):not(.note)"
    );
    const paraObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("motion-para-in");
            paraObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    sectionParas.forEach((el, i) => {
      el.classList.add("motion-para-init");
      el.style.setProperty("--para-delay", `${i % 4 * 80}ms`);
      paraObserver.observe(el);
    });

    // --- 3d. Cards: fade + translateY + scale stagger ---
    const cards = document.querySelectorAll(".card");
    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const card = entry.target;
            const idx = card.dataset.cardIdx || 0;
            setTimeout(() => {
              requestAnimationFrame(() => card.classList.add("motion-card-in"));
            }, idx * 100);
            cardObserver.unobserve(card);
          }
        });
      },
      { threshold: 0.08 }
    );
    cards.forEach((card, i) => {
      card.classList.add("motion-card-init");
      card.dataset.cardIdx = i % 6;
      cardObserver.observe(card);
    });

    // --- 3e. Traits: slide dari kiri satu per satu ---
    const traits = document.querySelectorAll(".trait");
    const traitObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const trait = entry.target;
            const idx = parseInt(trait.dataset.traitIdx || 0);
            setTimeout(() => {
              requestAnimationFrame(() =>
                trait.classList.add("motion-trait-in")
              );
            }, idx * 120);
            traitObserver.unobserve(trait);
          }
        });
      },
      { threshold: 0.2 }
    );
    traits.forEach((trait, i) => {
      trait.classList.add("motion-trait-init");
      trait.dataset.traitIdx = i;
      traitObserver.observe(trait);
    });

    // --- 3f. Blockquote: fade + slight rotation ---
    const blockquotes = document.querySelectorAll("blockquote");
    const bqObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("motion-bq-in");
            bqObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    blockquotes.forEach((el) => {
      el.classList.add("motion-bq-init");
      bqObserver.observe(el);
    });

    // --- 3g. Journey items: dot pulse + slide in ---
    const journeyItems = document.querySelectorAll(".tl, .cert");
    const journeyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const idx = parseInt(el.dataset.journeyIdx || 0);
            setTimeout(() => {
              requestAnimationFrame(() => el.classList.add("motion-journey-in"));
            }, idx * 150);
            journeyObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.2 }
    );
    journeyItems.forEach((el, i) => {
      el.classList.add("motion-journey-init");
      el.dataset.journeyIdx = i;
      journeyObserver.observe(el);
    });

    // --- 3h. Sub-heading paragraf di section ---
    const subs = document.querySelectorAll("section .sub");
    const subObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("motion-sub-in");
            subObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    subs.forEach((el) => {
      el.classList.add("motion-sub-init");
      subObserver.observe(el);
    });
  }

  /* ----------------------------------------------------------
     4. SKILL BAR ANIMATION
     Animasikan fill bar dari 0% ke nilai sebenarnya saat masuk viewport
     Nilai dibaca dari class CSS: .skill-level-65 → 65%
  ---------------------------------------------------------- */
  function initSkillBars() {
    const barsSection = document.querySelector(".bars");
    if (!barsSection) return;

    // Regex untuk membaca persentase dari class name
    const levelRegex = /skill-level-(\d+)/;

    const allFills = barsSection.querySelectorAll("i[class*='skill-level-']");
    // Simpan target width asli lalu set ke 0 untuk animasi
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
                  "width 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
                requestAnimationFrame(() => {
                  fill.style.width = target;
                });
              }, i * 100);
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
     5. THEME RIPPLE EFFECT
     Ripple menyebar dari posisi tombol theme toggle ke seluruh layar
  ---------------------------------------------------------- */
  function initThemeRipple() {
    const themeBtn = document.getElementById("theme");
    if (!themeBtn) return;

    themeBtn.addEventListener("click", () => {
      const rect = themeBtn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Hitung radius maksimal untuk menutupi seluruh layar
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

      // Aktifkan animasi setelah frame berikutnya
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ripple.classList.add("theme-ripple-active");
        });
      });

      // Bersihkan setelah animasi selesai
      ripple.addEventListener("transitionend", () => {
        ripple.remove();
      });
    });
  }

  /* ----------------------------------------------------------
     6. FLOATING PARTICLES DI HERO
     Partikel kecil melayang di background hero section
  ---------------------------------------------------------- */
  function initHeroParticles() {
    const heroBgAnim = document.querySelector(".hero-bg-anim");
    if (!heroBgAnim) return;

    // Konfigurasi partikel: [x%, y%, ukuran, delay, durasi]
    const particleConfigs = [
      [15, 20, 4, 0, 8],
      [80, 15, 3, 1.5, 10],
      [55, 70, 5, 3, 12],
      [25, 75, 3, 0.8, 9],
      [70, 40, 4, 2.2, 11],
      [40, 30, 3, 4, 7],
      [88, 65, 5, 1, 13],
      [10, 55, 3, 3.5, 9],
    ];

    particleConfigs.forEach(([x, y, size, delay, duration]) => {
      const particle = document.createElement("div");
      particle.className = "hero-particle";
      particle.setAttribute("aria-hidden", "true");
      particle.style.cssText = `
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
      `;
      heroBgAnim.appendChild(particle);
    });
  }

  /* ----------------------------------------------------------
     7. NAV SECTION HIGHLIGHT FLASH
     Saat klik nav link, section target mendapat highlight flash
  ---------------------------------------------------------- */
  function initNavFlash() {
    const navLinks = document.querySelectorAll("header nav a");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const targetId = link.getAttribute("href");
        if (!targetId || !targetId.startsWith("#")) return;
        const target = document.querySelector(targetId);
        if (!target) return;

        target.classList.remove("motion-section-flash");
        // Force reflow agar animasi bisa diulang
        void target.offsetWidth;
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
     8. SHIMMER EFFECT PADA CARD (via JS injection class)
     Tambahkan wrapper shimmer element ke setiap card
  ---------------------------------------------------------- */
  function initCardShimmer() {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => {
      if (!card.querySelector(".card-shimmer")) {
        const shimmer = document.createElement("div");
        shimmer.className = "card-shimmer";
        shimmer.setAttribute("aria-hidden", "true");
        card.appendChild(shimmer);
      }
    });
  }

  /* ----------------------------------------------------------
     9. INISIALISASI UTAMA
  ---------------------------------------------------------- */
  function init() {
    // Selalu jalankan progress bar dan particles (tidak dipengaruhi reduced-motion secara langsung)
    initScrollProgress();
    initHeroParticles();
    initCardShimmer();
    initNavFlash();

    if (prefersReducedMotion) {
      // Untuk reduced-motion: tampilkan semua elemen langsung tanpa animasi
      document.querySelectorAll(
        ".hero .hi, .hero h1, .hero .roles, .hero .lead, .hero .btns, .hero .social, .hero .social-proof-above-fold, .hero .photo, .hero .chip"
      ).forEach((el) => el.classList.add("motion-reduced"));
      return;
    }

    // Jalankan semua animasi normal
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

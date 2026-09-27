(() => {
  "use strict";

  const root = document.documentElement;
  const STORAGE_KEY = "rizal-theme";
  const themeToggle = document.getElementById("themeToggle");
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");
  const cursorGlow = document.querySelector(".cursor-glow");

  const getTheme = () => (root.dataset.theme === "light" ? "light" : "dark");

  function updateThemeUI() {
    const theme = getTheme();
    const icon = document.querySelector(".theme-icon");
    if (icon) icon.textContent = theme === "dark" ? "☼" : "☾";
    themeToggle?.setAttribute("aria-pressed", String(theme === "light"));
    themeToggle?.setAttribute(
      "aria-label",
      theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap",
    );
    themeToggle?.setAttribute(
      "title",
      theme === "dark" ? "Mode terang" : "Mode gelap",
    );
  }

  function setTheme(theme) {
    const next = theme === "light" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
    updateThemeUI();
  }

  // Pastikan halaman yang dibuka langsung mengikuti tema tersimpan.
  const storedTheme = localStorage.getItem(STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    root.dataset.theme = storedTheme;
  }
  updateThemeUI();

  themeToggle?.addEventListener("click", () => {
    setTheme(getTheme() === "dark" ? "light" : "dark");
  });

  // Mobile navigation.
  menuToggle?.addEventListener("click", () => {
    const open = navMenu?.classList.toggle("open") ?? false;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  });

  navMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      menuToggle?.setAttribute("aria-expanded", "false");
    });
  });

  // Reveal animation hanya untuk elemen yang memang menggunakannya.
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(".reveal")
      .forEach((el) => revealObserver.observe(el));
  } else {
    document
      .querySelectorAll(".reveal")
      .forEach((el) => el.classList.add("show"));
  }

  // Active section hanya diperlukan di halaman beranda.
  const sections = document.querySelectorAll("main section[id]");
  const hashLinks = document.querySelectorAll('.nav-link[href^="#"]');
  if (sections.length && hashLinks.length && "IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          hashLinks.forEach((link) => link.classList.remove("active"));
          document
            .querySelector(`.nav-link[href="#${entry.target.id}"]`)
            ?.classList.add("active");
        });
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    sections.forEach((section) => sectionObserver.observe(section));
  }

  // Cursor glow dimatikan pada touch device dan saat reduced motion.
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (
    cursorGlow &&
    window.matchMedia("(pointer:fine)").matches &&
    !reduceMotion
  ) {
    window.addEventListener(
      "pointermove",
      (e) => {
        cursorGlow.style.transform = `translate(${e.clientX - 160}px, ${e.clientY - 160}px)`;
      },
      { passive: true },
    );
  } else if (cursorGlow) {
    cursorGlow.hidden = true;
  }

  document.getElementById("contactForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get("name") || "Pengunjung";
    const email = form.get("email") || "-";
    const message = form.get("message") || "";
    const subject = encodeURIComponent(`Pesan Portofolio dari ${name}`);
    const body = encodeURIComponent(
      `Nama: ${name}\nEmail: ${email}\n\n${message}`,
    );
    window.location.href = `mailto:rizal.khaerulanam@gmail.com?subject=${subject}&body=${body}`;
  });
})();

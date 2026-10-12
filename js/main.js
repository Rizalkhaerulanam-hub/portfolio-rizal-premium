/* Portfolio Rizal — tema, navigasi responsif, dan formulir kontak. */
(() => {
  "use strict";
  const root = document.documentElement;
  const themeButton = document.getElementById("theme") || document.getElementById("themeToggle");
  const themeIcon = themeButton?.querySelector(".theme-icon");
  const menuButton = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");
  const contactForm = document.getElementById("f");
  const emailTujuan = "rizal.khaerulanam25028@mhs.uingusdur.ac.id";

  try {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") root.setAttribute("data-theme", savedTheme);
  } catch (_) {}

  if (themeButton) {
    const updateThemeButton = () => {
      const isDark = root.getAttribute("data-theme") === "dark";
      if (themeIcon) themeIcon.textContent = isDark ? "☾" : "☼";
      else themeButton.textContent = isDark ? "☾" : "☼";
      themeButton.setAttribute("aria-pressed", String(isDark));
      themeButton.setAttribute("aria-label", isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap");
    };
    updateThemeButton();
    themeButton.addEventListener("click", () => {
      const current = root.getAttribute("data-theme");
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      root.setAttribute("data-theme", (current ? current === "dark" : !!prefersDark) ? "light" : "dark");
      try { localStorage.setItem("theme", root.getAttribute("data-theme")); } catch (_) {}
      updateThemeButton();
    });
  }

  if (menuButton && navMenu) {
    const closeMenu = () => {
      navMenu.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Buka menu");
    };
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") !== "true";
      navMenu.classList.toggle("is-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    });
    navMenu.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { closeMenu(); menuButton.focus(); }
    });
    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 861px)").matches) closeMenu();
    }, { passive: true });
  }

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;
      const data = new FormData(contactForm);
      const body = `Nama: ${String(data.get("n") || "").trim()}\nEmail: ${String(data.get("e") || "").trim()}\n\n${String(data.get("m") || "").trim()}`;
      window.location.href = `mailto:${emailTujuan}?subject=${encodeURIComponent("Pesan dari portofolio")}&body=${encodeURIComponent(body)}`;
    });
  }
})();
/* Portfolio Rizal — tema, navigasi responsif, dan formulir kontak. */
(() => {
  "use strict";
  const root = document.documentElement;
  const themeButton =
    document.getElementById("theme") || document.getElementById("themeToggle");
  const themeIcon = themeButton?.querySelector(".theme-icon");
  const menuButton = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");
  const contactForm = document.getElementById("f");
  const certTriggers = document.querySelectorAll("[data-cert-modal]");
  const certModal = document.getElementById("certModal");
  const certModalTitle = document.getElementById("certTitle");
  const certModalImg = certModal?.querySelector("img");
  const closeCertButtons = document.querySelectorAll("[data-close-cert]");
  const cursorGlow = document.querySelector(".cursor-glow");
  let cursorTrail = document.querySelector(".cursor-trail");
  const revealItems = document.querySelectorAll(
    ".reveal, .card, .trait, .bar, .proof-item, .social a, .cert",
  );
  const emailTujuan = "rizal.khaerulanam25028@mhs.uingusdur.ac.id";

  if (window.matchMedia("(pointer: fine)").matches) {
    if (!cursorTrail) {
      cursorTrail = document.createElement("div");
      cursorTrail.className = "cursor-trail";
      document.body.appendChild(cursorTrail);
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let trailX = mouseX;
    let trailY = mouseY;

    const animateCursor = () => {
      trailX += (mouseX - trailX) * 0.12;
      trailY += (mouseY - trailY) * 0.12;
      cursorTrail.style.transform = `translate(${trailX - 14}px, ${trailY - 14}px)`;
      if (cursorGlow) {
        const offset = cursorGlow.classList.contains("is-down") ? 18 : 11;
        cursorGlow.style.transform = `translate(${mouseX - offset}px, ${mouseY - offset}px)`;
      }
      requestAnimationFrame(animateCursor);
    };

    window.addEventListener("pointermove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    window.addEventListener("pointerdown", () =>
      cursorGlow?.classList.add("is-down"),
    );
    window.addEventListener("pointerup", () =>
      cursorGlow?.classList.remove("is-down"),
    );

    requestAnimationFrame(animateCursor);
  }

  if (revealItems.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  if (certTriggers.length && certModal) {
    const openCertModal = (e) => {
      const btn = e.currentTarget;
      const title = btn.getAttribute("data-cert-title");
      const imgSrc = btn.getAttribute("data-cert-img");
      if (title && certModalTitle) certModalTitle.textContent = title;
      if (imgSrc && certModalImg) {
        certModalImg.src = imgSrc;
        certModalImg.alt = title || "Sertifikat";
      }
      certModal.classList.add("is-open");
      certModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    };

    const closeCertModal = () => {
      certModal.classList.remove("is-open");
      certModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    };

    certTriggers.forEach((btn) => btn.addEventListener("click", openCertModal));
    closeCertButtons.forEach((button) => {
      button.addEventListener("click", closeCertModal);
    });
    certModal.addEventListener("click", (event) => {
      if (event.target === certModal) closeCertModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && certModal.classList.contains("is-open"))
        closeCertModal();
    });
  }

  try {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark")
      root.setAttribute("data-theme", savedTheme);
  } catch (_) {}

  if (themeButton) {
    const updateThemeButton = () => {
      const isDark = root.getAttribute("data-theme") === "dark";
      if (themeIcon) themeIcon.textContent = isDark ? "☾" : "☼";
      else themeButton.textContent = isDark ? "☾" : "☼";
      themeButton.setAttribute("aria-pressed", String(isDark));
      themeButton.setAttribute(
        "aria-label",
        isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap",
      );
    };
    updateThemeButton();
    themeButton.addEventListener("click", () => {
      const current = root.getAttribute("data-theme");
      const prefersDark = window.matchMedia?.(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.setAttribute(
        "data-theme",
        (current ? current === "dark" : !!prefersDark) ? "light" : "dark",
      );
      try {
        localStorage.setItem("theme", root.getAttribute("data-theme"));
      } catch (_) {}
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
      if (event.key === "Escape") {
        closeMenu();
        menuButton.focus();
      }
    });
    window.addEventListener(
      "resize",
      () => {
        if (window.matchMedia("(min-width: 861px)").matches) closeMenu();
      },
      { passive: true },
    );
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

/* =========================================================
   PORTOFOLIO RIZAL KHAERUL ANAM
   JavaScript utama: tema dan formulir kontak
   ========================================================= */
(() => {
  "use strict";

  const root = document.documentElement;
  const themeButton = document.getElementById("theme");
  const contactForm = document.getElementById("f");
  const emailTujuan = "rizal.khaerul.anam25028@mhs.uingusdur.ac.id";

  // Terapkan tema yang pernah dipilih pengunjung.
  try {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      root.setAttribute("data-theme", savedTheme);
    }
  } catch (error) {
    // Website tetap berjalan jika localStorage tidak tersedia.
  }

  // Tombol ganti tema.
  if (themeButton) {
    const updateThemeButton = () => {
      const isDark = root.getAttribute("data-theme") === "dark";
      themeButton.textContent = isDark ? "☾" : "☼";
      themeButton.setAttribute("aria-pressed", String(isDark));
      themeButton.setAttribute(
        "aria-label",
        isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap"
      );
    };

    updateThemeButton();

    themeButton.addEventListener("click", () => {
      const currentTheme = root.getAttribute("data-theme");
      const prefersDark = window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = currentTheme ? currentTheme === "dark" : prefersDark;
      const nextTheme = isDark ? "light" : "dark";

      root.setAttribute("data-theme", nextTheme);

      try {
        localStorage.setItem("theme", nextTheme);
      } catch (error) {
        // Tema tetap berubah untuk sesi saat ini.
      }

      updateThemeButton();
    });
  }

  // Form kontak membuka aplikasi email perangkat pengunjung.
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);
      const nama = String(formData.get("n") || "").trim();
      const email = String(formData.get("e") || "").trim();
      const pesan = String(formData.get("m") || "").trim();

      const isiEmail = `Nama: ${nama}\nEmail: ${email}\n\n${pesan}`;
      const mailto = `mailto:${emailTujuan}?subject=${encodeURIComponent(
        "Pesan dari portofolio"
      )}&body=${encodeURIComponent(isiEmail)}`;

      window.location.href = mailto;
    });
  }
})();

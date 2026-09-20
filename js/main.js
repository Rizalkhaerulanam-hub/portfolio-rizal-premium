const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("main section[id]");
const cursorGlow = document.querySelector(".cursor-glow");

const savedTheme = localStorage.getItem("rizal-theme");
if (savedTheme) root.dataset.theme = savedTheme;
updateThemeIcon();

themeToggle?.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("rizal-theme", root.dataset.theme);
  updateThemeIcon();
});

function updateThemeIcon() {
  const icon = document.querySelector(".theme-icon");
  if (icon) icon.textContent = root.dataset.theme === "dark" ? "☼" : "☾";
}

menuToggle?.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", open);
  menuToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
});

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("show");
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => link.classList.remove("active"));
    const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
    active?.classList.add("active");
  });
}, { rootMargin: "-35% 0px -55% 0px" });

sections.forEach(section => sectionObserver.observe(section));

if (window.matchMedia("(pointer:fine)").matches) {
  window.addEventListener("pointermove", (e) => {
    cursorGlow.style.left = `${e.clientX}px`;
    cursorGlow.style.top = `${e.clientY}px`;
  });
} else {
  cursorGlow.style.display = "none";
}

document.getElementById("contactForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = new FormData(e.currentTarget);
  const name = form.get("name");
  const email = form.get("email");
  const message = form.get("message");
  const subject = encodeURIComponent(`Pesan Portofolio dari ${name}`);
  const body = encodeURIComponent(`Nama: ${name}\nEmail: ${email}\n\n${message}`);
  window.location.href = `mailto:rizal.khaerulanam@gmail.com?subject=${subject}&body=${body}`;
});

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("[data-nav-links]");
const navAnchors = document.querySelectorAll(".nav-links a");
const revealSections = document.querySelectorAll(".section-reveal");

function setMenuState(isOpen) {
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  navLinks.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  setMenuState(!isOpen);
});

navAnchors.forEach((anchor) => {
  anchor.addEventListener("click", () => setMenuState(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuState(false);
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealSections.forEach((section) => revealObserver.observe(section));

// Futuro: conectar autenticação, Firebase, permissões por perfil e rotas protegidas aqui.

// public/js/main.js
// BlackHub - versión estática
// Únicamente controla el enlace activo de la barra de navegación.

document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
        const linkPath = new URL(
            link.href,
            window.location.origin
        ).pathname;

        const esInicio =
            (currentPath === "/" ||
             currentPath === "/index.html") &&
            (linkPath === "/" ||
             linkPath === "/index.html");

        if (currentPath === linkPath || esInicio) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
});
/* shared-footer.js */

(function () {
  const FOOTER_HTML = `
    <div class="footer-row footer-row-top">
      <a
        class="footer-site-link"
        href="https://awareness-hub.bokss.org.hk"
        target="_blank"
        rel="noopener noreferrer"
      >
        Awareness Hub · 資安及私隱教育
      </a>

      <a
        class="footer-site-link"
        href="https://bokss.org.hk"
        target="_blank"
        rel="noopener noreferrer"
      >
        bokss.org.hk
      </a>

      <a
        class="footer-brand-link"
        href="https://bokss.org.hk"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit BOKSS official website"
      >
        <img
          src="/ITD_Logo.png"
          alt="BOKSS ITD Logo"
          class="footer-logo"
        >
      </a>
    </div>

    <div class="footer-row footer-row-bottom">
      <span class="footer-copy">
        © 2026 Baptist Oi Kwan Social Service (BOKSS). All rights reserved.
      </span>
    </div>
  `;

  function injectSharedFooter() {
    const footerContainer = document.getElementById("siteFooter");
    if (!footerContainer) return;

    footerContainer.classList.add("shared-site-footer");
    footerContainer.innerHTML = FOOTER_HTML;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectSharedFooter);
  } else {
    injectSharedFooter();
  }
})();

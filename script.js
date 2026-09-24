(() => {
  const header = document.querySelector(".site-header");
  const nav = document.getElementById("site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const themeToggle = document.querySelector(".theme-toggle");
  const year = document.getElementById("year");

  if (year) year.textContent = String(new Date().getFullYear());

  const syncThemeToggle = () => {
    if (!themeToggle) return;
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
  };
  syncThemeToggle();

  themeToggle?.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("pk-theme", next);
    } catch (e) {}
    syncThemeToggle();
  });

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      nav.classList.toggle("is-open", !open);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
        nav.classList.remove("is-open");
      });
    });
  }

  /* Scroll reveal */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* Reusable media slider */
  const createSlider = (root) => {
    const track = root.querySelector(".media-track");
    const allSlides = [...root.querySelectorAll(".media-slide")];
    const dotsWrap = root.querySelector(".media-dots");
    const prevBtn = root.querySelector(".media-prev");
    const nextBtn = root.querySelector(".media-next");
    const currentEl = root.querySelector("[data-current]");
    const totalEl = root.querySelector("[data-total]");
    const delay = Number(root.dataset.autoplay) || 4500;

    if (!track || !allSlides.length) return null;

    let filter = "all";
    let index = 0;
    let autoTimer = null;
    let visibleSlides = [];

    const getVisible = () =>
      allSlides.filter((slide) => filter === "all" || slide.dataset.category === filter);

    const goTo = (i) => {
      if (!visibleSlides.length) return;
      index = ((i % visibleSlides.length) + visibleSlides.length) % visibleSlides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      visibleSlides.forEach((slide, n) => {
        slide.classList.toggle("is-active", n === index);
      });
      dotsWrap?.querySelectorAll(".media-dot").forEach((dot, n) => {
        dot.classList.toggle("is-active", n === index);
      });
      if (currentEl) currentEl.textContent = String(index + 1);
    };

    const buildDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      visibleSlides.forEach((_, n) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "media-dot" + (n === index ? " is-active" : "");
        dot.setAttribute("aria-label", `Go to photo ${n + 1}`);
        dot.addEventListener("click", () => {
          goTo(n);
          restartAuto();
        });
        dotsWrap.appendChild(dot);
      });
    };

    const applyFilter = (nextFilter) => {
      filter = nextFilter;
      allSlides.forEach((slide) => {
        const show = filter === "all" || slide.dataset.category === filter;
        slide.classList.toggle("is-hidden", !show);
      });
      visibleSlides = getVisible();
      visibleSlides.forEach((slide) => track.appendChild(slide));
      allSlides
        .filter((slide) => slide.classList.contains("is-hidden"))
        .forEach((slide) => track.appendChild(slide));
      index = 0;
      if (totalEl) totalEl.textContent = String(visibleSlides.length);
      buildDots();
      goTo(0);
      restartAuto();
    };

    const stopAuto = () => {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    };

    const startAuto = () => {
      stopAuto();
      if (visibleSlides.length < 2) return;
      autoTimer = setInterval(() => goTo(index + 1), delay);
    };

    const restartAuto = () => {
      stopAuto();
      startAuto();
    };

    applyFilter("all");

    prevBtn?.addEventListener("click", () => {
      goTo(index - 1);
      restartAuto();
    });
    nextBtn?.addEventListener("click", () => {
      goTo(index + 1);
      restartAuto();
    });

    root.addEventListener("mouseenter", stopAuto);
    root.addEventListener("mouseleave", startAuto);
    root.addEventListener("focusin", stopAuto);
    root.addEventListener("focusout", startAuto);

    let touchStartX = 0;
    track.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAuto();
      },
      { passive: true }
    );
    track.addEventListener(
      "touchend",
      (e) => {
        const dx = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(dx) > 40) goTo(dx < 0 ? index + 1 : index - 1);
        startAuto();
      },
      { passive: true }
    );

    return {
      root,
      applyFilter,
      goTo,
      stopAuto,
      startAuto,
      getIndex: () => index,
      step: (delta) => {
        goTo(index + delta);
        restartAuto();
      },
    };
  };

  const sliders = [...document.querySelectorAll(".media-slider")].map(createSlider).filter(Boolean);
  const gallerySlider = sliders.find((s) => s.root.dataset.lightboxGroup === "gallery");

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      gallerySlider?.applyFilter(btn.dataset.filter || "all");
    });
  });

  /* Lightbox */
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = lightbox?.querySelector(".lightbox-img");
  const closeBtn = lightbox?.querySelector(".lightbox-close");
  const lbPrev = lightbox?.querySelector(".lightbox-prev");
  const lbNext = lightbox?.querySelector(".lightbox-next");

  let currentGroup = [];
  let currentIndex = 0;

  const openLightbox = (sources, i) => {
    if (!lightbox || !lightboxImg) return;
    currentGroup = sources;
    currentIndex = i;
    lightboxImg.src = currentGroup[currentIndex];
    lightboxImg.alt = "Enlarged kennel photo";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    sliders.forEach((s) => s.stopAuto());
  };

  const closeLightbox = () => {
    if (!lightbox || !lightboxImg) return;
    lightbox.hidden = true;
    lightboxImg.src = "";
    document.body.style.overflow = "";
    sliders.forEach((s) => s.startAuto());
  };

  const stepLightbox = (delta) => {
    if (!currentGroup.length || !lightboxImg) return;
    currentIndex = (currentIndex + delta + currentGroup.length) % currentGroup.length;
    lightboxImg.src = currentGroup[currentIndex];
  };

  document.querySelectorAll("[data-lightbox-group]").forEach((groupEl) => {
    const items = [...groupEl.querySelectorAll("[data-src]")];
    items.forEach((item) => {
      item.addEventListener("click", () => {
        const visible = items.filter((el) => !el.classList.contains("is-hidden"));
        const sources = visible.map((el) => el.dataset.src);
        const idx = sources.indexOf(item.dataset.src);
        openLightbox(sources, idx >= 0 ? idx : 0);
      });
    });
  });

  closeBtn?.addEventListener("click", closeLightbox);
  lbPrev?.addEventListener("click", () => stepLightbox(-1));
  lbNext?.addEventListener("click", () => stepLightbox(1));

  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox?.hidden) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
      return;
    }

    const active = sliders.find((s) => {
      const rect = s.root.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.3;
    });
    if (!active) return;
    if (e.key === "ArrowLeft") active.step(-1);
    if (e.key === "ArrowRight") active.step(1);
  });
})();

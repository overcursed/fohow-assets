"use strict";

/**
 * FOHOW site interactions.
 * All visible strings and telephone numbers are easy to edit in the HTML.
 * The script works on all three pages, including when opened locally.
 */

function initFohowSite() {
  if (document.body.dataset.fohowInitialized === "true") return;
  document.body.dataset.fohowInitialized = "true";
  const body = document.body;

  // --------------------------------------------------------------------------
  // 1. Navigation drawer
  // --------------------------------------------------------------------------
  const menuTrigger = document.querySelector(".menu-trigger");
  const drawer = document.getElementById("site-drawer");
  const drawerBackdrop = document.querySelector("[data-drawer-backdrop]");
  const drawerClose = document.querySelector(".drawer-close");
  let previousDrawerFocus = null;

  function openDrawer() {
    if (!drawer) return;
    previousDrawerFocus = document.activeElement;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    menuTrigger?.setAttribute("aria-expanded", "true");
    if (drawerBackdrop) drawerBackdrop.hidden = false;
    body.classList.add("no-scroll");
    drawerClose?.focus();
  }

  function closeDrawer() {
    if (!drawer?.classList.contains("open")) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    menuTrigger?.setAttribute("aria-expanded", "false");
    if (drawerBackdrop) drawerBackdrop.hidden = true;
    body.classList.remove("no-scroll");
    previousDrawerFocus?.focus();
  }

  menuTrigger?.addEventListener("click", () => {
    if (drawer?.classList.contains("open")) closeDrawer();
    else openDrawer();
  });
  drawerClose?.addEventListener("click", closeDrawer);
  drawerBackdrop?.addEventListener("click", closeDrawer);
  drawer?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeDrawer);
  });

  // --------------------------------------------------------------------------
  // 2. Enlarging product / device photos
  // --------------------------------------------------------------------------
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImage = lightbox?.querySelector("img");
  const lightboxCaption = lightbox?.querySelector(".lightbox-caption");
  let zoomTrigger = null;

  function openLightbox(button) {
    if (!lightbox || !lightboxImage) return;
    zoomTrigger = button;
    lightboxImage.src = button.dataset.zoomSrc;
    lightboxImage.alt = button.dataset.zoomTitle || "Фото товара";
    if (lightboxCaption) lightboxCaption.textContent = button.dataset.zoomTitle || "";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    body.classList.add("no-scroll");
    lightbox.querySelector(".lightbox-close")?.focus();
  }

  function closeLightbox() {
    if (!lightbox?.classList.contains("open")) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    body.classList.remove("no-scroll");
    lightboxImage?.removeAttribute("src");
    zoomTrigger?.focus();
  }

  document.querySelectorAll("[data-zoom-src]").forEach(button => {
    button.addEventListener("click", () => openLightbox(button));
  });
  lightbox?.querySelector(".lightbox-close")?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", event => {
    if (event.target === lightbox) closeLightbox();
  });

  // --------------------------------------------------------------------------
  // 3. Copy numbers, including a plain tap on a footer number
  // --------------------------------------------------------------------------
  const toast = document.getElementById("site-toast");
  let toastTimeout = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove("visible"), 1800);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      // Fallback for file:// previews and restricted clipboard permissions.
    }

    const field = document.createElement("textarea");
    field.value = text;
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    let succeeded = false;
    try {
      succeeded = document.execCommand("copy");
    } catch (error) {
      succeeded = false;
    }
    field.remove();
    return succeeded;
  }

  document.querySelectorAll("[data-copy]").forEach(button => {
    button.addEventListener("click", async () => {
      const success = await copyText(button.dataset.copy || "");
      if (button.classList.contains("footer-copy-number")) {
        showToast(success ? "Номер скопирован" : "Не удалось скопировать номер");
        return;
      }
      const label = button.querySelector("span");
      if (!label) {
        showToast(success ? "Номер скопирован" : "Не удалось скопировать номер");
        return;
      }
      const originalLabel = label.textContent;
      label.textContent = success ? "Скопировано" : "Попробуйте ещё раз";
      button.classList.toggle("copied", success);
      window.setTimeout(() => {
        label.textContent = originalLabel;
        button.classList.remove("copied");
      }, 1700);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Only the homepage call button opens the number picker.
  //    It is disabled on desktop; appointment links on other pages stay active.
  // --------------------------------------------------------------------------
  const mobileCallMedia = window.matchMedia("(max-width: 1024px) and (pointer: coarse)");
  const callButtons = [...document.querySelectorAll("[data-call-chooser]")];
  const callDialog = document.getElementById("call-dialog");
  const callPanel = callDialog?.querySelector(".call-dialog-panel");
  let previousCallFocus = null;

  function syncCallButtons() {
    const mobile = mobileCallMedia.matches;
    callButtons.forEach(button => {
      button.disabled = !mobile;
      button.title = mobile ? "Выбрать номер для звонка" : "Звонок доступен с телефона";
    });
    if (!mobile) closeCallDialog();
  }

  function openCallDialog() {
    if (!mobileCallMedia.matches || !callDialog) return;
    previousCallFocus = document.activeElement;
    callDialog.hidden = false;
    callDialog.setAttribute("aria-hidden", "false");
    body.classList.add("no-scroll");
    callPanel?.focus();
  }

  function closeCallDialog() {
    if (!callDialog || callDialog.hidden) return;
    callDialog.hidden = true;
    callDialog.setAttribute("aria-hidden", "true");
    body.classList.remove("no-scroll");
    previousCallFocus?.focus();
  }

  mobileCallMedia.addEventListener?.("change", syncCallButtons);
  syncCallButtons();

  callButtons.forEach(button => button.addEventListener("click", openCallDialog));
  callDialog?.querySelectorAll("[data-close-call]").forEach(button => {
    button.addEventListener("click", closeCallDialog);
  });
  callDialog?.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener("click", closeCallDialog);
  });

  // --------------------------------------------------------------------------
  // 5. Catalog category filters and product search
  // --------------------------------------------------------------------------
  const categoryButtons = [...document.querySelectorAll(".category-option")];
  const productCards = [...document.querySelectorAll(".catalog-grid .product-card")];
  const mobileCategory = document.getElementById("mobile-category");
  const search = document.getElementById("catalog-search");
  const catalogStatus = document.getElementById("catalog-status");
  const emptyState = document.querySelector(".empty-state");
  let selectedCategory = "all";

  function updateCatalog() {
    const query = (search?.value || "").trim().toLocaleLowerCase("ru");
    let shown = 0;

    productCards.forEach(card => {
      const categoryMatches = selectedCategory === "all" || card.dataset.category === selectedCategory;
      const nameMatches = !query || (card.dataset.title || "").toLocaleLowerCase("ru").includes(query);
      card.hidden = !(categoryMatches && nameMatches);
      if (!card.hidden) shown++;
    });

    if (catalogStatus) catalogStatus.textContent = `Показано товаров: ${shown}`;
    if (emptyState) emptyState.hidden = shown > 0;
    categoryButtons.forEach(button => {
      const active = button.dataset.filter === selectedCategory;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (mobileCategory) mobileCategory.value = selectedCategory;
  }

  categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.filter;
      updateCatalog();
    });
  });
  mobileCategory?.addEventListener("change", () => {
    selectedCategory = mobileCategory.value;
    updateCatalog();
  });
  search?.addEventListener("input", updateCatalog);
  if (productCards.length) updateCatalog();

  // Keyboard accessibility for both dialogs and navigation.
  window.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    closeCallDialog();
    closeLightbox();
    closeDrawer();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFohowSite, { once: true });
} else {
  initFohowSite();
}

import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// ─── Constants ──────────────────────────────────────────────────────────────
const BREAKPOINT = window.matchMedia('(min-width: 1024px)');

// ─── Keyboard / focus helpers ────────────────────────────────────────────────
function closeOnEscape(e) {
  if (e.code !== 'Escape') return;
  const nav = document.getElementById('nav');
  const navSections = nav.querySelector('.nav-sections');
  if (!navSections) return;
  const expanded = navSections.querySelector('[aria-expanded="true"]');
  if (expanded && BREAKPOINT.matches) {
    collapseAllDropdowns(navSections);
    expanded.querySelector('a')?.focus();
  } else if (!BREAKPOINT.matches) {
    toggleMobileMenu(nav, navSections, false);
    nav.querySelector('.nav-hamburger button')?.focus();
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (nav.contains(e.relatedTarget)) return;
  const navSections = nav.querySelector('.nav-sections');
  if (!navSections) return;
  if (BREAKPOINT.matches) {
    collapseAllDropdowns(navSections);
  } else {
    toggleMobileMenu(nav, navSections, false);
  }
}

// ─── Dropdown helpers ────────────────────────────────────────────────────────
function collapseAllDropdowns(sections, except = null) {
  if (!sections) return;
  sections.querySelectorAll('.nav-drop[aria-expanded="true"]').forEach((li) => {
    if (li !== except) li.setAttribute('aria-expanded', 'false');
  });
}

function bindDropdownKeyboard(drop) {
  drop.setAttribute('tabindex', '0');
  drop.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      const open = drop.getAttribute('aria-expanded') === 'true';
      collapseAllDropdowns(drop.closest('.nav-sections'));
      drop.setAttribute('aria-expanded', open ? 'false' : 'true');
    }
  });
}

// ─── Mobile menu ─────────────────────────────────────────────────────────────
function toggleMobileMenu(nav, navSections, forceOpen = null) {
  const isOpen = forceOpen !== null ? forceOpen : nav.getAttribute('aria-expanded') !== 'true';
  nav.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  document.body.style.overflowY = isOpen && !BREAKPOINT.matches ? 'hidden' : '';
  const btn = nav.querySelector('.nav-hamburger button');
  if (btn) btn.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');

  if (isOpen) {
    window.addEventListener('keydown', closeOnEscape);
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    collapseAllDropdowns(navSections);
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

// ─── Sticky / headroom ───────────────────────────────────────────────────────
function initHeadroom(wrapper) {
  let lastScroll = 0;
  let ticking = false;

  const update = () => {
    const current = window.scrollY;
    const delta = current - lastScroll;

    if (current <= 10) {
      // At top — show full header, no shadow
      wrapper.classList.remove('nav-wrapper--scrolled', 'nav-wrapper--hidden');
    } else if (delta > 4) {
      // Scrolling down — hide header
      wrapper.classList.add('nav-wrapper--hidden');
      wrapper.classList.add('nav-wrapper--scrolled');
    } else if (delta < -4) {
      // Scrolling up — show sticky header with shadow
      wrapper.classList.remove('nav-wrapper--hidden');
      wrapper.classList.add('nav-wrapper--scrolled');
    }

    lastScroll = current <= 0 ? 0 : current;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

// ─── Search expand ───────────────────────────────────────────────────────────
function initSearchExpand(searchBtn) {
  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Search…';
  input.className = 'nav-search-input';
  input.setAttribute('aria-label', 'Search site');

  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.action = '/search';
  form.method = 'get';
  form.append(input);
  form.append(searchBtn);

  searchBtn.addEventListener('click', (e) => {
    if (!form.classList.contains('nav-search-form--open')) {
      e.preventDefault();
      form.classList.add('nav-search-form--open');
      input.focus();
    }
  });

  input.addEventListener('blur', () => {
    if (!input.value) {
      form.classList.remove('nav-search-form--open');
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      input.value = '';
      form.classList.remove('nav-search-form--open');
      searchBtn.focus();
    }
  });

  return form;
}

// ─── Utility bar ─────────────────────────────────────────────────────────────
function buildUtilityBar(navUtility) {
  const bar = document.createElement('div');
  bar.className = 'nav-utility-bar';

  const links = navUtility
    ? Array.from(navUtility.querySelectorAll('a')).map((a) => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href') || '#',
    }))
    : [
      { text: 'Find a Doctor', href: '/find-a-doc' },
      { text: 'Get Updates', href: '/get-updates' },
      { text: 'Share Your Story', href: '/share-your-story' },
    ];

  const nav = document.createElement('nav');
  nav.className = 'nav-utility-links';
  nav.setAttribute('aria-label', 'Utility navigation');

  links.forEach((link) => {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    a.className = 'nav-utility-link';
    nav.append(a);
  });

  bar.append(nav);
  return bar;
}

// ─── Search button ───────────────────────────────────────────────────────────
function buildSearchIcon() {
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'nav-search-btn';
  btn.setAttribute('aria-label', 'Search');
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-285 377 40 40" width="20" height="20" aria-hidden="true" focusable="false">
    <path d="M-257.5,402.7l-1.1,1.3l5.9,6l1.3-1.2L-257.5,402.7z"/>
    <path d="M-255.1,395.6c0-6.4-5.2-11.6-11.6-11.6s-11.6,5.2-11.6,11.6s5.2,11.6,11.6,11.6S-255.1,402-255.1,395.6z
      M-266.7,405.5c-5.5,0-9.9-4.4-9.9-9.9s4.4-9.9,9.9-9.9s9.9,4.4,9.9,9.9S-261.2,405.5-266.7,405.5z"/>
  </svg>`;
  return btn;
}

// ─── Main decorate ────────────────────────────────────────────────────────────
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Nav fragment section order: [0] utility, [1] brand/logo, [2] nav links, [3] search
  const sectionLabels = ['utility', 'brand', 'sections', 'tools'];
  sectionLabels.forEach((label, i) => {
    if (nav.children[i]) nav.children[i].classList.add(`nav-${label}`);
  });

  // ── Brand: replace with SVG logo ──
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const logoLink = document.createElement('a');
    logoLink.href = '/';
    logoLink.setAttribute('aria-label', 'ReadyPatient – home');
    const logoImg = document.createElement('img');
    logoImg.src = '/icons/logo-readypatient.svg';
    logoImg.alt = 'ReadyPatient – Brought to you by Zimmer Biomet';
    logoImg.className = 'nav-brand-logo';
    logoImg.width = 195;
    logoImg.height = 40;
    logoLink.append(logoImg);
    navBrand.textContent = '';
    navBrand.append(logoLink);
  }

  // ── Nav sections: unwrap <p> tags, strip button classes, add dropdowns ──
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    // Unwrap <p> wrappers around top-level links
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li > p').forEach((p) => {
      while (p.firstChild) p.parentElement.insertBefore(p.firstChild, p);
      p.remove();
    });

    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((li) => {
      // Strip boilerplate button classes
      li.querySelectorAll('a.button').forEach((a) => {
        a.classList.remove('button', 'primary', 'secondary');
        const bc = a.closest('.button-container');
        if (bc) bc.classList.remove('button-container');
      });

      if (li.querySelector('ul')) {
        li.classList.add('nav-drop');
        li.setAttribute('aria-expanded', 'false');
        li.setAttribute('aria-haspopup', 'true');

        // Add chevron
        const chevron = document.createElement('span');
        chevron.className = 'nav-drop-chevron';
        chevron.setAttribute('aria-hidden', 'true');
        const topLink = li.querySelector('a');
        if (topLink) topLink.after(chevron);

        // Desktop: click to toggle
        li.addEventListener('click', (e) => {
          if (!BREAKPOINT.matches) return;
          // Don't toggle if clicking a sub-link
          if (e.target.closest('ul ul')) return;
          const open = li.getAttribute('aria-expanded') === 'true';
          collapseAllDropdowns(navSections, li);
          li.setAttribute('aria-expanded', open ? 'false' : 'true');
        });

        // Desktop: hover to open/close
        li.addEventListener('mouseenter', () => {
          if (!BREAKPOINT.matches) return;
          collapseAllDropdowns(navSections, li);
          li.setAttribute('aria-expanded', 'true');
        });
        li.addEventListener('mouseleave', () => {
          setTimeout(() => {
            if (!BREAKPOINT.matches) return;
            if (li.matches(':hover')) return;
            li.setAttribute('aria-expanded', 'false');
          }, 100);
        });

        bindDropdownKeyboard(li);
      }

      // Mobile: tap to expand nested list
      if (!BREAKPOINT.matches) {
        li.addEventListener('click', (e) => {
          if (BREAKPOINT.matches) return;
          if (e.target.tagName === 'A') return;
          const open = li.getAttribute('aria-expanded') === 'true';
          li.setAttribute('aria-expanded', open ? 'false' : 'true');
        });
      }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!navSections.contains(e.target)) {
        collapseAllDropdowns(navSections);
      }
    });
  }

  // ── Build utility bar from nav-utility section ──
  const navUtility = nav.querySelector('.nav-utility');
  const utilityBar = buildUtilityBar(navUtility);
  if (navUtility) navUtility.remove();

  // ── Remove fragment tools section (replaced by our search) ──
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) navTools.remove();

  // ── Hamburger (mobile) ──
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-hidden', 'true');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation" aria-expanded="false">
    <span class="nav-hamburger-icon"></span>
  </button>`;
  hamburger.addEventListener('click', () => toggleMobileMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // ── Search in tools area ──
  const toolsWrapper = document.createElement('div');
  toolsWrapper.className = 'nav-tools';
  const searchBtn = buildSearchIcon();
  const searchForm = initSearchExpand(searchBtn);
  toolsWrapper.append(searchForm);
  nav.append(toolsWrapper);

  // ── Handle desktop/mobile transitions ──
  const handleBreakpointChange = () => {
    if (BREAKPOINT.matches) {
      // Reset mobile state
      nav.setAttribute('aria-expanded', 'false');
      document.body.style.overflowY = '';
      // Re-bind hover on drops
      navSections?.querySelectorAll('.nav-drop').forEach(bindDropdownKeyboard);
    }
  };
  BREAKPOINT.addEventListener('change', handleBreakpointChange);
  handleBreakpointChange();

  // ── Assemble wrapper ──
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(utilityBar);
  navWrapper.append(nav);
  block.append(navWrapper);

  // ── Sticky headroom ──
  initHeadroom(navWrapper);
}

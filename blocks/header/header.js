import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('.nav-hamburger button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.classList.contains('nav-drop');
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * Builds the utility bar (top row: Find a Doctor, Get Updates, Share Your Story)
 * from any <ul> in the nav-tools section, or uses hardcoded fallback links.
 */
function buildUtilityBar(navUtility) {
  const utilityBar = document.createElement('div');
  utilityBar.classList.add('nav-utility-bar');

  // Try to pull links from the nav-utility fragment section (first section)
  const toolLinks = navUtility ? navUtility.querySelectorAll('a') : [];
  let links = [];

  if (toolLinks.length > 0) {
    links = Array.from(toolLinks).map((a) => ({ text: a.textContent.trim(), href: a.getAttribute('href') || a.href }));
  } else {
    // Fallback: mirror the live site's utility links
    links = [
      { text: 'Find a Doctor', href: '/find-a-doc' },
      { text: 'Get Updates', href: '/get-updates' },
      { text: 'Share Your Story', href: '/share-your-story' },
    ];
  }

  const nav = document.createElement('nav');
  nav.classList.add('nav-utility-links');
  nav.setAttribute('aria-label', 'Utility navigation');

  links.forEach((link) => {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    a.classList.add('nav-utility-link');
    nav.append(a);
  });

  utilityBar.append(nav);
  return utilityBar;
}

/**
 * Builds the search button for the main nav row.
 */
function buildSearchButton() {
  const searchBtn = document.createElement('button');
  searchBtn.classList.add('nav-search-btn');
  searchBtn.setAttribute('aria-label', 'Search');
  searchBtn.setAttribute('type', 'button');
  searchBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <path d="M16.9,15.5c2.4-3.2,2.2-7.7-0.7-10.6c-3.1-3.1-8.1-3.1-11.3,0c-3.1,3.2-3.1,8.3,0,11.4
      c2.9,2.9,7.5,3.1,10.6,0.6c0,0.1,0,0.1,0,0.1l4.2,4.2c0.5,0.4,1.1,0.4,1.5,0c0.4-0.4,0.4-1,0-1.4L16.9,15.5z
      M14.8,6.3c2.3,2.3,2.3,6.1,0,8.5c-2.3,2.3-6.1,2.3-8.5,0C4,12.5,4,8.7,6.3,6.3C8.7,4,12.5,4,14.8,6.3z"/>
  </svg>`;
  return searchBtn;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';

  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Nav fragment section order: [0] utility links, [1] logo/brand, [2] nav sections, [3] search/tools
  const classes = ['utility', 'brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('.button');
    if (brandLink) {
      brandLink.className = '';
      if (brandLink.closest('.button-container')) {
        brandLink.closest('.button-container').className = '';
      }
    }
    // Wrap the existing logo image in a link if needed, or replace with our SVG logo
    const existingImg = navBrand.querySelector('img');
    const logoLink = document.createElement('a');
    logoLink.href = '/';
    const logoImg = document.createElement('img');
    logoImg.src = '/icons/logo-readypatient.svg';
    logoImg.alt = 'ReadyPatient – Brought to you by Zimmer Biomet';
    logoImg.className = 'nav-brand-logo';
    logoLink.append(logoImg);
    navBrand.textContent = '';
    navBrand.append(logoLink);
    // suppress the unused existingImg variable lint warning
    void existingImg;
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    // The top-level link may be wrapped in a <p> tag — unwrap it so CSS selectors work cleanly
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li > p').forEach((p) => {
      // Move children of <p> directly into the <li>
      const li = p.parentElement;
      while (p.firstChild) li.insertBefore(p.firstChild, p);
      p.remove();
    });

    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');

      // Strip button classes that the boilerplate auto-applies to links
      navSection.querySelectorAll('a.button').forEach((btn) => {
        btn.classList.remove('button', 'primary', 'secondary');
        if (btn.closest('.button-container')) {
          btn.closest('.button-container').classList.remove('button-container');
        }
      });

      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // Build utility bar from the nav-utility section (first section in the fragment)
  const navUtility = nav.querySelector('.nav-utility');
  const utilityBar = buildUtilityBar(navUtility);
  if (navUtility) navUtility.remove();

  // Remove the nav-tools section from the fragment (we'll add our own search button)
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) navTools.remove();

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
    <span class="nav-hamburger-icon"></span>
  </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // Add search button to tools area
  const searchBtn = buildSearchButton();
  const navToolsWrapper = document.createElement('div');
  navToolsWrapper.classList.add('nav-tools');
  navToolsWrapper.append(searchBtn);
  nav.append(navToolsWrapper);

  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  // Build wrapper: utility bar on top, main nav row below
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(utilityBar);
  navWrapper.append(nav);
  block.append(navWrapper);
}

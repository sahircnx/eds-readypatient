import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Identify footer rows and add semantic classes
  const rows = [...footer.children];
  if (rows[0]) rows[0].classList.add('footer-nav');
  if (rows[1]) rows[1].classList.add('footer-legal');
  if (rows[2]) rows[2].classList.add('footer-bottom');

  // Decorate navigation columns
  if (rows[0]) {
    rows[0].querySelectorAll('ul').forEach((ul) => ul.classList.add('footer-nav-col'));
  }

  // Decorate bottom utility section
  if (rows[2]) {
    const ul = rows[2].querySelector('ul');
    if (ul) ul.classList.add('footer-bottom-links');
    const p = rows[2].querySelector('p');
    if (p) p.classList.add('footer-copyright');
  }

  block.append(footer);
}

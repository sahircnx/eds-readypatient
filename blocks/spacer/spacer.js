export default function decorate(block) {
  const rows = [...block.children];
  const cell = rows[0]?.firstElementChild;
  if (!cell) return;

  const size = cell.textContent.trim().toLowerCase();
  block.classList.add(`spacer-${size}`);

  // Handle custom height if "custom" is selected
  if (size === 'custom') {
    const customHeightCell = rows[1]?.firstElementChild;
    if (customHeightCell) {
      const height = customHeightCell.textContent.trim();
      block.style.height = height;
    }
  }

  // Clear original content
  block.textContent = '';
}

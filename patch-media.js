const fs = require('fs');
let css = fs.readFileSync('artifacts/objet-decoratif-store/src/index.css', 'utf8');

const additionalMedia = `
  .admin-catalog-header,
  .admin-scent-header {
    display: none;
  }
  .admin-catalog-row,
  .admin-scent-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .admin-catalog-row > div:not(:last-child) {
    border-bottom: 1px solid rgba(32, 32, 28, 0.05);
    padding-bottom: 12px;
  }
  .admin-row-actions {
    justify-content: flex-start;
  }
  .admin-form-row {
    grid-template-columns: 1fr;
  }
  .admin-form-row.cols-3 {
    grid-template-columns: 1fr;
  }
`;

const closingBraceIndex = css.lastIndexOf('}');
if (closingBraceIndex !== -1) {
  css = css.slice(0, closingBraceIndex) + additionalMedia + css.slice(closingBraceIndex);
  fs.writeFileSync('artifacts/objet-decoratif-store/src/index.css', css);
}

const fs = require('fs');
const css = fs.readFileSync('artifacts/objet-decoratif-store/src/index.css', 'utf8');

const newCSS = `

/* Admin CMS Forms & Drawers */
.admin-input,
.admin-textarea,
.admin-select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--line);
  border-radius: 0;
  outline: 0;
  padding: 14px 15px;
  background: rgba(255, 255, 255, 0.26);
  color: var(--ink);
  font: 13px var(--sans);
  transition: all 0.2s;
}
.admin-input,
.admin-select {
  min-height: 48px;
}
.admin-textarea {
  min-height: 120px;
  resize: vertical;
  line-height: 1.6;
}
.admin-input:focus,
.admin-textarea:focus,
.admin-select:focus {
  border-color: var(--saffron);
  background: rgba(255, 255, 255, 0.5);
}
.admin-input:disabled {
  background: rgba(32, 32, 28, 0.05);
  color: #8c887e;
  cursor: not-allowed;
}

.admin-form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}
.admin-form-group label {
  font: 11px var(--mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #777369;
}
.admin-form-group .error {
  font: 11px var(--mono);
  color: #d84c4c;
  margin-top: 4px;
}

.admin-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.admin-form-row.cols-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.admin-checkbox-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  cursor: pointer;
}
.admin-checkbox-group input[type="checkbox"] {
  appearance: none;
  width: 18px;
  height: 18px;
  border: 1px solid var(--line);
  border-radius: 0;
  background: rgba(255,255,255,0.26);
  outline: none;
  cursor: pointer;
  position: relative;
}
.admin-checkbox-group input[type="checkbox"]:checked {
  background: var(--ink);
  border-color: var(--ink);
}
.admin-checkbox-group input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 6px;
  width: 4px;
  height: 8px;
  border: solid var(--paper);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.admin-checkbox-group span {
  font: 13px var(--sans);
  color: var(--ink);
}

.admin-drawer {
  position: fixed;
  z-index: 60;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(650px, 100%);
  display: flex;
  flex-direction: column;
  background: var(--bone);
  transform: translateX(100%);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border-left: 1px solid var(--line);
}
.admin-drawer.open {
  transform: translateX(0);
}
.admin-drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px 40px;
}
.admin-drawer-footer {
  padding: 24px 40px;
  border-top: 1px solid var(--line);
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  background: var(--bone);
}

/* Image Upload CMS */
.admin-image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 12px;
}
.admin-image-preview {
  position: relative;
  aspect-ratio: 1;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.3);
  overflow: hidden;
}
.admin-image-preview.single {
  max-width: 200px;
  aspect-ratio: 4/3;
}
.admin-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.admin-image-actions {
  position: absolute;
  inset: 0;
  background: rgba(32, 32, 28, 0.7);
  opacity: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: opacity 0.2s;
}
.admin-image-preview:hover .admin-image-actions {
  opacity: 1;
}
.admin-icon-btn {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.4);
  color: white;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s;
}
.admin-icon-btn:hover:not(:disabled) {
  background: white;
  color: var(--ink);
}
.admin-icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.admin-text-btn {
  background: transparent;
  border: 0;
  color: white;
  font: 10px var(--mono);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.admin-text-btn:hover {
  color: #ffb8b8;
}

.admin-image-uploading,
.admin-image-placeholder {
  border: 1px dashed var(--line);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
  background: rgba(255,255,255,0.2);
  aspect-ratio: 1;
  font: 11px var(--mono);
  color: #777369;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  gap: 8px;
}
.admin-image-placeholder {
  cursor: pointer;
  transition: all 0.2s;
}
.admin-image-placeholder:hover {
  background: rgba(255,255,255,0.4);
  border-color: var(--saffron);
}
.admin-image-placeholder.single {
  max-width: 200px;
  aspect-ratio: 4/3;
}
.admin-image-uploading.single {
  max-width: 200px;
  aspect-ratio: 4/3;
}
.admin-image-error {
  color: #d84c4c;
}

/* Specific table headers/rows for catalog */
.admin-catalog-header {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr;
  gap: 20px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
  color: var(--saffron);
  font: 10px var(--mono);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.admin-catalog-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr;
  gap: 20px;
  padding: 24px 0;
  border-bottom: 1px solid var(--line);
  align-items: center;
}
.admin-scent-header, .admin-scent-row {
  grid-template-columns: 1fr 1.5fr 1fr 1fr;
}
.admin-catalog-row > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #57544d;
}
.admin-catalog-row strong {
  font: 400 16px var(--hero);
  color: var(--ink);
}
.admin-catalog-row small {
  font: 11px var(--mono);
  color: #777369;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.admin-row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.admin-action-btn {
  background: transparent;
  border: 0;
  padding: 4px;
  color: #777369;
  cursor: pointer;
  transition: color 0.2s;
}
.admin-action-btn:hover {
  color: var(--ink);
}
.admin-action-btn.delete:hover {
  color: #d84c4c;
}
.admin-badge {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(32, 32, 28, 0.05);
  color: var(--ink);
  font: 9px var(--mono);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  width: max-content;
}
.admin-badge.active {
  background: rgba(116, 123, 100, 0.15);
  color: var(--moss);
}
.admin-badge.inactive {
  background: rgba(32, 32, 28, 0.05);
  color: #8c887e;
}
`;

const mediaQueryIndex = css.lastIndexOf('@media (max-width: 768px)');
if (mediaQueryIndex !== -1) {
  const newContent = css.slice(0, mediaQueryIndex) + newCSS + css.slice(mediaQueryIndex);
  fs.writeFileSync('artifacts/objet-decoratif-store/src/index.css', newContent);
} else {
  fs.writeFileSync('artifacts/objet-decoratif-store/src/index.css', css + newCSS);
}

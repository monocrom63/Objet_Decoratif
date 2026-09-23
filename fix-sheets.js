const fs = require('fs');
let cms = fs.readFileSync('patch-temp3.js', 'utf8');

// Replace standard shadcn Sheet components with editorial drawres
// We added .admin-drawer to index.css earlier

const sheetsOld = `      <Sheet
        open={productSheet.open}
        onOpenChange={(open) => !open && setProductSheet({ open: false })}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-paper border-l-line">
          <SheetHeader>
            <SheetTitle>
              {productSheet.product ? "Edit Product" : "New Product"}
            </SheetTitle>
            <SheetDescription>
              Make changes to the product catalog entry.
            </SheetDescription>
          </SheetHeader>
          {productSheet.open && (
            <ProductForm
              product={productSheet.product}
              scents={scents.data || []}
              onClose={() => setProductSheet({ open: false })}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet
        open={scentSheet.open}
        onOpenChange={(open) => !open && setScentSheet({ open: false })}
      >
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-paper border-l-line">
          <SheetHeader>
            <SheetTitle>
              {scentSheet.scent ? "Edit Scent" : "New Scent"}
            </SheetTitle>
            <SheetDescription>
              Make changes to the signature scent profile.
            </SheetDescription>
          </SheetHeader>
          {scentSheet.open && (
            <ScentForm
              scent={scentSheet.scent}
              onClose={() => setScentSheet({ open: false })}
            />
          )}
        </SheetContent>
      </Sheet>`;

const sheetsNew = `
      {/* Product Drawer */}
      <div
        className={\`overlay \${productSheet.open ? "open" : ""}\`}
        onClick={() => setProductSheet({ open: false })}
        aria-hidden="true"
        style={{ zIndex: 55 }}
      />
      <aside
        className={\`admin-drawer \${productSheet.open ? "open" : ""}\`}
        role="dialog"
        aria-modal="true"
      >
        <div className="drawer-head">
          <h2>{productSheet.product ? "Edit Product" : "New Product"}</h2>
          <button
            className="close-button"
            onClick={() => setProductSheet({ open: false })}
            aria-label="Close drawer"
            type="button"
          >
            <X size={15} />
          </button>
        </div>
        <div className="admin-drawer-content">
          <p style={{ font: "13px var(--sans)", color: "#777369", margin: 0 }}>
            Make changes to the product catalog entry.
          </p>
          {productSheet.open && (
            <ProductForm
              product={productSheet.product}
              scents={scents.data || []}
              onClose={() => setProductSheet({ open: false })}
            />
          )}
        </div>
        <div className="admin-drawer-footer">
          <button 
            type="button" 
            className="outline-button"
            onClick={() => setProductSheet({ open: false })}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="product-form"
            className="solid-button"
          >
            Save Product <ArrowRight size={13} />
          </button>
        </div>
      </aside>

      {/* Scent Drawer */}
      <div
        className={\`overlay \${scentSheet.open ? "open" : ""}\`}
        onClick={() => setScentSheet({ open: false })}
        aria-hidden="true"
        style={{ zIndex: 55 }}
      />
      <aside
        className={\`admin-drawer \${scentSheet.open ? "open" : ""}\`}
        role="dialog"
        aria-modal="true"
      >
        <div className="drawer-head">
          <h2>{scentSheet.scent ? "Edit Scent" : "New Scent"}</h2>
          <button
            className="close-button"
            onClick={() => setScentSheet({ open: false })}
            aria-label="Close drawer"
            type="button"
          >
            <X size={15} />
          </button>
        </div>
        <div className="admin-drawer-content">
          <p style={{ font: "13px var(--sans)", color: "#777369", margin: 0 }}>
            Make changes to the signature scent profile.
          </p>
          {scentSheet.open && (
            <ScentForm
              scent={scentSheet.scent}
              onClose={() => setScentSheet({ open: false })}
            />
          )}
        </div>
        <div className="admin-drawer-footer">
          <button 
            type="button" 
            className="outline-button"
            onClick={() => setScentSheet({ open: false })}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="scent-form"
            className="solid-button"
          >
            Save Scent <ArrowRight size={13} />
          </button>
        </div>
      </aside>`;

cms = cms.replace(sheetsOld, sheetsNew);

fs.writeFileSync('artifacts/objet-decoratif-store/src/components/admin/catalog-cms.tsx', cms);

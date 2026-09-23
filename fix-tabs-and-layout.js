const fs = require('fs');
let cms = fs.readFileSync('patch-temp2.js', 'utf8');

// Replace Tabs and UI components with editorial styles

const tabsOld = `      <Tabs defaultValue="products" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="scents">Scents</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setProductSheet({ open: true })}>
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Collection</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : products.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.data?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.collection}</TableCell>
                      <TableCell>€{(p.priceCents / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <span
                            className={\`px-2 py-1 text-xs rounded-full \${p.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}\`}
                          >
                            {p.active ? "Active" : "Inactive"}
                          </span>
                          <span
                            className={\`px-2 py-1 text-xs rounded-full \${p.published ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}\`}
                          >
                            {p.published ? "Published" : "Draft"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setProductSheet({ open: true, product: p })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteProduct(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="scents" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setScentSheet({ open: true })}>
              <Plus className="h-4 w-4 mr-2" /> Add Scent
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scent</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scents.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : scents.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No scents found.
                    </TableCell>
                  </TableRow>
                ) : (
                  scents.data?.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
                        {s.notes}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <span
                            className={\`px-2 py-1 text-xs rounded-full \${s.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}\`}
                          >
                            {s.active ? "Active" : "Inactive"}
                          </span>
                          <span
                            className={\`px-2 py-1 text-xs rounded-full \${s.published ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}\`}
                          >
                            {s.published ? "Published" : "Draft"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setScentSheet({ open: true, scent: s })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteScent(s.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>`;

const tabsNew = `
      <section className="editorial-section mt-12">
        <div className="editorial-section-label">
          01 / Products
          <br />
          <span>Core Catalog</span>
        </div>
        <div className="editorial-section-content">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="section-kicker">Manage</div>
              <h2>Products</h2>
            </div>
            <button className="solid-button" onClick={() => setProductSheet({ open: true })}>
              Add Product <Plus size={13} />
            </button>
          </div>

          <div className="admin-orders-list !mt-0">
            <div className="admin-catalog-header">
              <span>Product</span>
              <span>Collection</span>
              <span>Price</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            
            {products.isLoading ? (
              <div className="py-8 text-center text-sm text-[#777369]">Loading products...</div>
            ) : products.data?.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#777369]">No products found.</div>
            ) : (
              products.data?.map((p) => (
                <div key={p.id} className="admin-catalog-row">
                  <div>
                    <strong>{p.name}</strong>
                    <small>{p.id}</small>
                  </div>
                  <div>
                    <span style={{ color: "var(--ink)" }}>{p.collection}</span>
                    <small>{p.category}</small>
                  </div>
                  <div>€{(p.priceCents / 100).toFixed(2)}</div>
                  <div>
                    <div className="flex flex-col gap-1 items-start">
                      <span className={\`admin-badge \${p.active ? "active" : "inactive"}\`}>
                        {p.active ? "Active" : "Inactive"}
                      </span>
                      <span className={\`admin-badge \${p.published ? "active" : "inactive"}\`}>
                        {p.published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="admin-row-actions text-right">
                      <button
                        className="admin-action-btn"
                        onClick={() => setProductSheet({ open: true, product: p })}
                        aria-label="Edit product"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="admin-action-btn delete"
                        onClick={() => handleDeleteProduct(p.id)}
                        aria-label="Delete product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="editorial-section">
        <div className="editorial-section-label">
          02 / Scents
          <br />
          <span>Profiles</span>
        </div>
        <div className="editorial-section-content">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="section-kicker">Manage</div>
              <h2>Scents</h2>
            </div>
            <button className="solid-button" onClick={() => setScentSheet({ open: true })}>
              Add Scent <Plus size={13} />
            </button>
          </div>

          <div className="admin-orders-list !mt-0">
            <div className="admin-catalog-header admin-scent-header">
              <span>Scent</span>
              <span>Notes</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            
            {scents.isLoading ? (
              <div className="py-8 text-center text-sm text-[#777369]">Loading scents...</div>
            ) : scents.data?.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#777369]">No scents found.</div>
            ) : (
              scents.data?.map((s) => (
                <div key={s.id} className="admin-catalog-row admin-scent-row">
                  <div>
                    <strong>{s.name}</strong>
                    <small>{s.id}</small>
                  </div>
                  <div>
                    <span style={{ color: "var(--ink)", maxWidth: "300px" }} className="truncate">
                      {s.notes}
                    </span>
                  </div>
                  <div>
                    <div className="flex flex-col gap-1 items-start">
                      <span className={\`admin-badge \${s.active ? "active" : "inactive"}\`}>
                        {s.active ? "Active" : "Inactive"}
                      </span>
                      <span className={\`admin-badge \${s.published ? "active" : "inactive"}\`}>
                        {s.published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="admin-row-actions text-right">
                      <button
                        className="admin-action-btn"
                        onClick={() => setScentSheet({ open: true, scent: s })}
                        aria-label="Edit scent"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="admin-action-btn delete"
                        onClick={() => handleDeleteScent(s.id)}
                        aria-label="Delete scent"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>`;

cms = cms.replace(tabsOld, tabsNew);


// Replace header text formatting to match app
const headerOld = `      <div>
        <h1 className="text-3xl font-serif text-ink tracking-tight mb-2">
          Catalog CMS
        </h1>
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
          Manage products and scents
        </p>
      </div>`;
const headerNew = `      <div className="editorial-hero-copy" style={{ padding: 0 }}>
        <div className="section-kicker">Administration / Objet Décoratif</div>
        <h1 style={{ marginTop: "16px" }}>
          Catalog
          <br />
          <em>management.</em>
        </h1>
        <p>Curate products and signature scent profiles.</p>
      </div>`;
cms = cms.replace(headerOld, headerNew);


// Replace wrapper
const wrapperOld = `<div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 mt-12">`;
const wrapperNew = `<div className="pb-24">`;
cms = cms.replace(wrapperOld, wrapperNew);

fs.writeFileSync('patch-temp3.js', cms);

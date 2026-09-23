import re

with open("artifacts/objet-decoratif-store/src/App.tsx", "r") as f:
    content = f.read()

# 1. Import mapApiCatalogToFrontend and useGetCatalog
content = content.replace('import { Link, Route, Switch, useLocation } from "wouter";', 
                          'import { Link, Route, Switch, useLocation } from "wouter";\nimport { mapApiCatalogToFrontend, type FrontendProduct as Product, type ScentOption, type ProductCollection } from "@/lib/catalog";\nimport { CatalogCms } from "@/components/admin/catalog-cms";\nimport { useGetCatalog } from "@workspace/api-client-react";')

# 2. Remove types that are now imported
content = re.sub(r'type ProductCollection =[\s\S]*?type ScentOption = \{[\s\S]*?\};\n', 'type CartLine = { product: Product; scent: string; quantity: number };\n', content)

# 3. Remove milanoScents and products
content = re.sub(r'const milanoScents: ScentOption\[\] = \[[\s\S]*?\];\n', '', content)
content = re.sub(r'const products: Product\[\] = \[[\s\S]*?\];\n', '', content)

# 4. Fix ScentShowcase signature and implementation
scent_showcase_old = """function ScentShowcase({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: (p: Product, scent: string) => void;
}) {"""
scent_showcase_new = """function ScentShowcase({
  product,
  scents,
  onOpen,
}: {
  product: Product;
  scents: ScentOption[];
  onOpen: (p: Product, scent: string) => void;
}) {"""
content = content.replace(scent_showcase_old, scent_showcase_new)

content = content.replace("const selected = milanoScents[activeIndex];", "const selected = scents[activeIndex];")
content = content.replace("milanoScents.length", "scents.length")
content = content.replace("milanoScents.map", "scents.map")

# 5. Fix Collection signature
collection_old = """function Collection({
  onOpen,
}: {
  onOpen: (p: Product, scent: string) => void;
}) {"""
collection_new = """function Collection({
  products,
  onOpen,
}: {
  products: Product[];
  onOpen: (p: Product, scent: string) => void;
}) {"""
content = content.replace(collection_old, collection_new)

# 6. Fix SearchPanel signature
search_old = """function SearchPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {"""
search_new = """function SearchPanel({
  products,
  open,
  onClose,
}: {
  products: Product[];
  open: boolean;
  onClose: () => void;
}) {"""
content = content.replace(search_old, search_new)

# 7. Add Catalog CMS link in AdminContent
admin_links_old = """            <div className="account-hero-actions">
              <Link href="/account" className="outline-button">
                Customer view <ArrowRight size={13} />
              </Link>
              <UserButton />
            </div>"""
admin_links_new = """            <div className="account-hero-actions">
              <Link href="/admin/catalog" className="solid-button">
                Catalog CMS <ArrowRight size={13} />
              </Link>
              <Link href="/account" className="outline-button">
                Customer view <ArrowRight size={13} />
              </Link>
              <UserButton />
            </div>"""
content = content.replace(admin_links_old, admin_links_new)

# 8. Add Route for CatalogCMS
router_old = """        <Route path="/admin" component={AdminPage} />"""
router_new = """        <Route path="/admin" component={AdminPage} />\n        <Route path="/admin/catalog" component={CatalogCms} />"""
content = content.replace(router_old, router_new)

# 9. Store component
store_old = """function Store() {
  const [cartOpen, setCartOpen] = useState(false);"""
store_new = """function Store() {
  const catalogQuery = useGetCatalog();
  const { products, scents } = useMemo(() => mapApiCatalogToFrontend(catalogQuery.data), [catalogQuery.data]);
  const [cartOpen, setCartOpen] = useState(false);"""
content = content.replace(store_old, store_new)

# Update Store renders
content = content.replace("<SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />", 
                          "<SearchPanel products={products} open={searchOpen} onClose={() => setSearchOpen(false)} />")

content = content.replace("<Collection onOpen={openProduct} />",
                          "<Collection products={products} onOpen={openProduct} />")

store_scent_showcase = """        {products[1] && (
          <ScentShowcase product={products[1]} onOpen={openProduct} />
        )}"""
store_scent_showcase_new = """        {products[1] && scents.length > 0 && (
          <ScentShowcase product={products[1]} scents={scents} onOpen={openProduct} />
        )}"""
content = content.replace(store_scent_showcase, store_scent_showcase_new)

with open("artifacts/objet-decoratif-store/src/App.tsx", "w") as f:
    f.write(content)

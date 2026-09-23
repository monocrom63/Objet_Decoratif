import re

with open("artifacts/objet-decoratif-store/src/App.tsx", "r") as f:
    content = f.read()

# Fix App.tsx missing imports
content = content.replace(
    'import { mapApiCatalogToFrontend, type FrontendProduct as Product, type ScentOption, type ProductCollection } from "@/lib/catalog";',
    'import { useCatalogFrontend, type FrontendProduct as Product, type ScentOption, type ProductCollection } from "@/lib/catalog";'
)

# 1. ScentOption mapping id
content = content.replace(
    """    product.scents.map((name) => ({
      name,""",
    """    product.scents.map((name) => ({
      id: name,
      name,"""
)

# 2. Collection component signature and ScentShowcase fix
collection_old = """function Collection({
  products,
  onOpen,
}: {
  products: Product[];
  onOpen: (p: Product, scent: string) => void;
}) {"""
collection_new = """function Collection({
  products,
  scents,
  onOpen,
}: {
  products: Product[];
  scents: ScentOption[];
  onOpen: (p: Product, scent: string) => void;
}) {"""
content = content.replace(collection_old, collection_new)

content = content.replace(
    "<ScentShowcase product={refillProduct} onOpen={onOpen} />",
    "<ScentShowcase product={refillProduct} scents={scents} onOpen={onOpen} />"
)

# 3. Store component hook
store_old = """  const catalogQuery = useGetCatalog();
  const { products, scents } = useMemo(() => mapApiCatalogToFrontend(catalogQuery.data), [catalogQuery.data]);"""
store_new = """  const { products, scents, isLoading } = useCatalogFrontend();
  if (isLoading) return <div className="store-shell"><div className="flex h-screen items-center justify-center">Loading...</div></div>;"""
content = content.replace(store_old, store_new)

content = content.replace(
    "<Collection products={products} onOpen={openProduct} />",
    "<Collection products={products} scents={scents} onOpen={openProduct} />"
)

# 4. EditorialPageFrame hook
ed_old = """function EditorialPageFrame({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);"""
ed_new = """function EditorialPageFrame({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { products } = useCatalogFrontend();"""
content = content.replace(ed_old, ed_new)

with open("artifacts/objet-decoratif-store/src/App.tsx", "w") as f:
    f.write(content)

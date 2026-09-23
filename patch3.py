import re

with open("artifacts/objet-decoratif-store/src/App.tsx", "r") as f:
    content = f.read()

# Add AdminCatalogPage component
admin_catalog_page = """function AdminCatalogPage() {
  const { isLoaded, isSignedIn } = useUser();
  const me = useGetMe();

  if (!isLoaded || me.isLoading) {
    return (
      <EditorialPageFrame>
        <main className="section">
          <p>Loading administration…</p>
        </main>
      </EditorialPageFrame>
    );
  }

  if (!isSignedIn || me.data?.role !== "admin") {
    return (
      <EditorialPageFrame>
        <section className="editorial-hero">
          <div className="editorial-hero-copy">
            <div className="section-kicker">
              Administration / Objet Décoratif
            </div>
            <h1>
              Admin access
              <br />
              <em>required.</em>
            </h1>
            <div className="account-hero-actions">
              <Link href={!isSignedIn ? "/sign-in" : "/account"} className="outline-button">
                Return <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>
      </EditorialPageFrame>
    );
  }

  return (
    <EditorialPageFrame>
      <CatalogCms />
    </EditorialPageFrame>
  );
}
"""

# Insert AdminCatalogPage before Router
content = content.replace("function Router() {", admin_catalog_page + "\nfunction Router() {")

# Update Route to point to AdminCatalogPage
content = content.replace(
    '<Route path="/admin/catalog" component={CatalogCms} />',
    '<Route path="/admin/catalog" component={AdminCatalogPage} />'
)

with open("artifacts/objet-decoratif-store/src/App.tsx", "w") as f:
    f.write(content)

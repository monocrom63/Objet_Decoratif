import { useState, useEffect } from "react";
import {
  useListAdminProducts,
  useInitializeCatalog,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useListAdminScents,
  useCreateScent,
  useUpdateScent,
  useDeleteScent,
  type Product,
  type Scent,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { MultiImageUploader, SingleImageUploader } from "./image-uploader";
import { useLanguage } from "@/lib/language";

import { useToast } from "@/hooks/use-toast";

const productSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  collection: z.string().min(1, "Collection is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  explanation: z.string().min(1, "Explanation is required"),
  priceEuros: z.coerce.number().min(0),
  tag: z.string().optional(),
  active: z.boolean().default(true),
  published: z.boolean().default(true),
  sortOrder: z.coerce.number().default(0),
  imagePaths: z.array(z.string()).default([]),
  scentIds: z.array(z.string()).default([]),
});

const scentSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  notes: z.string().min(1, "Notes is required"),
  description: z.string().min(1, "Description is required"),
  imagePath: z.string().nullable().optional(),
  showcaseMediaPath: z.string().nullable().optional(),
  active: z.boolean().default(true),
  published: z.boolean().default(true),
  sortOrder: z.coerce.number().default(0),
});

function ProductForm({
  product,
  scents,
  onClose,
  uploading,
  onUploadingChange,
}: {
  product?: Product;
  scents: Scent[];
  onClose: () => void;
  uploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          ...product,
          priceEuros: product.priceCents / 100,
          tag: product.tag || "",
        }
      : {
          id: "",
          name: "",
          collection: "",
          category: "",
          description: "",
          explanation: "",
          priceEuros: 0,
          tag: "",
          active: true,
          published: true,
          sortOrder: 0,
          imagePaths: [],
          scentIds: [],
        },
  });

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    if (uploading) return;
    try {
      const data = {
        ...values,
        priceCents: Math.round(values.priceEuros * 100),
        tag: values.tag || null,
      };

      if (product) {
        await updateProduct.mutateAsync({ id: product.id, data });
        toast({ title: "Product updated successfully" });
      } else {
        await createProduct.mutateAsync({ data });
        toast({ title: "Product created successfully" });
      }
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/catalog/products"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      onClose();
    } catch (err) {
      toast({
        title: "Error saving product",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  const {
    register,
    formState: { errors },
    watch,
    setValue,
    handleSubmit,
    getValues,
  } = form;

  return (
    <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="mt-8">
      <div className="admin-form-row">
        <div className="admin-form-group">
          <label>ID (Slug)</label>
          <input
            className="admin-input"
            {...register("id")}
            disabled={!!product}
          />
          {errors.id && <span className="error">{errors.id.message}</span>}
        </div>
        <div className="admin-form-group">
          <label>Name</label>
          <input className="admin-input" {...register("name")} />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>
      </div>

      <div className="admin-form-row cols-3">
        <div className="admin-form-group">
          <label>Collection</label>
          <input className="admin-input" {...register("collection")} />
          {errors.collection && (
            <span className="error">{errors.collection.message}</span>
          )}
        </div>
        <div className="admin-form-group">
          <label>Category</label>
          <input className="admin-input" {...register("category")} />
          {errors.category && (
            <span className="error">{errors.category.message}</span>
          )}
        </div>
        <div className="admin-form-group">
          <label>Price (€)</label>
          <input
            type="number"
            step="0.01"
            className="admin-input"
            {...register("priceEuros")}
          />
          {errors.priceEuros && (
            <span className="error">{errors.priceEuros.message}</span>
          )}
        </div>
      </div>

      <div className="admin-form-group">
        <label>Short Description</label>
        <textarea
          className="admin-textarea"
          style={{ minHeight: "80px" }}
          {...register("description")}
        />
        {errors.description && (
          <span className="error">{errors.description.message}</span>
        )}
      </div>

      <div className="admin-form-group">
        <label>Explanation (Long)</label>
        <textarea className="admin-textarea" {...register("explanation")} />
        {errors.explanation && (
          <span className="error">{errors.explanation.message}</span>
        )}
      </div>

      <div className="admin-form-row">
        <div className="admin-form-group">
          <label>Tag (Optional)</label>
          <input className="admin-input" {...register("tag")} />
          {errors.tag && <span className="error">{errors.tag.message}</span>}
        </div>
        <div className="admin-form-group">
          <label>Sort Order</label>
          <input
            type="number"
            className="admin-input"
            {...register("sortOrder")}
          />
          {errors.sortOrder && (
            <span className="error">{errors.sortOrder.message}</span>
          )}
        </div>
      </div>

      <div className="admin-form-row" style={{ marginTop: "12px" }}>
        <label className="admin-checkbox-group">
          <input type="checkbox" {...register("active")} />
          <span>Active</span>
        </label>
        <label className="admin-checkbox-group">
          <input type="checkbox" {...register("published")} />
          <span>Published</span>
        </label>
      </div>

      <div className="admin-form-group mt-6">
        <label>Available Scents</label>
        <div
          className="admin-form-row"
          style={{ gap: "12px", marginTop: "8px" }}
        >
          {scents.map((scent) => (
            <label
              key={scent.id}
              className="admin-checkbox-group"
              style={{ marginBottom: "8px" }}
            >
              <input
                type="checkbox"
                checked={watch("scentIds")?.includes(scent.id) || false}
                onChange={(e) => {
                  const current = getValues("scentIds") || [];
                  if (e.target.checked) {
                    setValue("scentIds", [...current, scent.id]);
                  } else {
                    setValue(
                      "scentIds",
                      current.filter((id) => id !== scent.id),
                    );
                  }
                }}
              />
              <span>{scent.name}</span>
            </label>
          ))}
        </div>
        {errors.scentIds && (
          <span className="error">{errors.scentIds.message}</span>
        )}
      </div>

      <div className="admin-form-group mt-6">
        <label>Images / Videos</label>
        <p className="text-xs text-[#777369] mb-3">PNG, JPEG, WebP up to 10 MB · MP4, WebM up to 100 MB</p>
        <MultiImageUploader
          value={watch("imagePaths") || []}
          onChange={(paths) => setValue("imagePaths", paths)}
          onUploadingChange={onUploadingChange}
        />
        {errors.imagePaths && (
          <span className="error">{errors.imagePaths.message}</span>
        )}
      </div>
    </form>
  );
}

function ScentForm({ scent, onClose, uploading, onUploadingChange }: {
  scent?: Scent;
  onClose: () => void;
  uploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const { t } = useLanguage();
  const [productUploading, setProductUploading] = useState(false);
  const [showcaseUploading, setShowcaseUploading] = useState(false);
  useEffect(() => {
    onUploadingChange(productUploading || showcaseUploading);
  }, [productUploading, showcaseUploading, onUploadingChange]);
  const queryClient = useQueryClient();
  const createScent = useCreateScent();
  const updateScent = useUpdateScent();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof scentSchema>>({
    resolver: zodResolver(scentSchema),
    defaultValues: scent || {
      id: "",
      name: "",
      notes: "",
      description: "",
      imagePath: null,
      showcaseMediaPath: null,
      active: true,
      published: true,
      sortOrder: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof scentSchema>) => {
    if (uploading || productUploading || showcaseUploading) return;
    try {
      if (scent) {
        await updateScent.mutateAsync({ id: scent.id, data: values });
        toast({ title: "Scent updated successfully" });
      } else {
        await createScent.mutateAsync({ data: values });
        toast({ title: "Scent created successfully" });
      }
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/catalog/scents"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      onClose();
    } catch (err) {
      toast({
        title: "Error saving scent",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  const {
    register,
    formState: { errors },
    watch,
    setValue,
    getValues,
    handleSubmit,
  } = form;

  const [removingMedia, setRemovingMedia] = useState(false);
  const removeScentMedia = async (
    field: "imagePath" | "showcaseMediaPath",
  ) => {
    const mediaPath = getValues(field);
    if (!mediaPath || removingMedia) return;
    if (!window.confirm(t("Remove this media from the scent? The change is saved immediately."))) {
      return;
    }

    if (!scent) {
      setValue(field, null, { shouldDirty: true, shouldValidate: true });
      return;
    }

    setRemovingMedia(true);
    try {
      const data =
        field === "imagePath"
          ? { imagePath: null }
          : { showcaseMediaPath: null };
      await updateScent.mutateAsync({ id: scent.id, data });
      setValue(field, null, { shouldDirty: true, shouldValidate: true });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["/api/admin/catalog/scents"],
        }),
        queryClient.invalidateQueries({ queryKey: ["/api/catalog"] }),
      ]);
      toast({ title: t("Scent media removed") });
    } catch (error) {
      toast({
        title: t("Failed to remove scent media"),
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setRemovingMedia(false);
    }
  };

  return (
    <form id="scent-form" onSubmit={handleSubmit(onSubmit)} className="mt-8">
      <div className="admin-form-row">
        <div className="admin-form-group">
          <label>ID (Slug)</label>
          <input
            className="admin-input"
            {...register("id")}
            disabled={!!scent}
          />
          {errors.id && <span className="error">{errors.id.message}</span>}
        </div>
        <div className="admin-form-group">
          <label>Name</label>
          <input className="admin-input" {...register("name")} />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>
      </div>

      <div className="admin-form-group">
        <label>Notes</label>
        <input className="admin-input" {...register("notes")} />
        {errors.notes && <span className="error">{errors.notes.message}</span>}
      </div>

      <div className="admin-form-group">
        <label>Description</label>
        <textarea className="admin-textarea" {...register("description")} />
        {errors.description && (
          <span className="error">{errors.description.message}</span>
        )}
      </div>

      <div className="admin-form-group">
        <label>Sort Order</label>
        <input
          type="number"
          className="admin-input"
          {...register("sortOrder")}
        />
        {errors.sortOrder && (
          <span className="error">{errors.sortOrder.message}</span>
        )}
      </div>

      <div className="admin-form-row" style={{ marginTop: "12px" }}>
        <label className="admin-checkbox-group">
          <input type="checkbox" {...register("active")} />
          <span>Active</span>
        </label>
        <label className="admin-checkbox-group">
          <input type="checkbox" {...register("published")} />
          <span>Published</span>
        </label>
      </div>

      <div className="admin-form-group mt-6">
        <label>{t("Product scent media · portrait")}</label>
        <p className="text-xs text-[#777369] mb-3">{t("Shown in the product's scent selector. Separate from the landscape Scents section.")}</p>
        <p className="text-xs text-[#777369] mb-3">PNG, JPEG, WebP up to 10 MB · MP4, WebM up to 100 MB</p>
        <SingleImageUploader
          value={watch("imagePath")}
          onChange={(path) => setValue("imagePath", path, { shouldDirty: true, shouldValidate: true })}
          onRemove={() => removeScentMedia("imagePath")}
          onUploadingChange={setProductUploading}
        />
        {errors.imagePath && (
          <span className="error">{errors.imagePath.message}</span>
        )}
      </div>
      <div className="admin-form-group mt-6" data-testid="scent-showcase-media-upload">
        <label>{t("Scents section media · landscape 16:9")}</label>
        <p className="text-xs text-[#777369] mb-3">{t("Upload a separate landscape video or image for Signature Scents. Videos loop automatically without player controls. Portrait videos are not reused here.")}</p>
        <p className="text-xs text-[#777369] mb-3">PNG, JPEG, WebP ≤ 10 MB · MP4, WebM ≤ 100 MB</p>
        <SingleImageUploader
          value={watch("showcaseMediaPath")}
          onChange={(path) => setValue("showcaseMediaPath", path, { shouldDirty: true })}
          onRemove={() => removeScentMedia("showcaseMediaPath")}
          onUploadingChange={setShowcaseUploading}
        />
        {errors.showcaseMediaPath && (
          <span className="error">{errors.showcaseMediaPath.message}</span>
        )}
      </div>
    </form>
  );
}

export function CatalogCms() {
  const products = useListAdminProducts();
  const scents = useListAdminScents();
  const initializeCatalog = useInitializeCatalog();
  const deleteProduct = useDeleteProduct();
  const deleteScent = useDeleteScent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [productUploading, setProductUploading] = useState(false);
  const [scentUploading, setScentUploading] = useState(false);
  const [productSheet, setProductSheet] = useState<{
    open: boolean;
    product?: Product;
  }>({ open: false });
  const [scentSheet, setScentSheet] = useState<{
    open: boolean;
    scent?: Scent;
  }>({ open: false });

  const handleInitializeCatalog = async () => {
    if (
      !window.confirm(
        "Den Standardkatalog mit 7 Produkten und 4 Düften laden? Dies ist nur bei einem vollständig leeren Katalog möglich.",
      )
    )
      return;
    try {
      await initializeCatalog.mutateAsync();
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["/api/admin/catalog/products"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["/api/admin/catalog/scents"],
        }),
        queryClient.invalidateQueries({ queryKey: ["/api/catalog"] }),
      ]);
      toast({
        title: "Standardkatalog geladen",
        description: "7 Produkte und 4 Düfte sind jetzt veröffentlicht.",
      });
    } catch (error) {
      toast({
        title: "Katalog konnte nicht geladen werden",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      await deleteProduct.mutateAsync({ id });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/catalog/products"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      toast({ title: "Product deleted" });
    } catch (err) {
      toast({
        title: "Failed to delete",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  const handleDeleteScent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this scent?")) return;
    try {
      await deleteScent.mutateAsync({ id });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/catalog/scents"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      toast({ title: "Scent deleted" });
    } catch (err) {
      toast({
        title: "Failed to delete",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="pb-24">
      <div className="editorial-hero-copy" style={{ padding: 0 }}>
        <div className="section-kicker">Administration / Objet Décoratif</div>
        <h1 style={{ marginTop: "16px" }}>
          Catalog
          <br />
          <em>management.</em>
        </h1>
        <p>Curate products and signature scent profiles.</p>
      </div>

      {products.isSuccess &&
        scents.isSuccess &&
        products.data?.length === 0 &&
        scents.data?.length === 0 && (
          <section className="editorial-section mt-12">
            <div className="editorial-section-label">Setup / Catalog</div>
            <div className="editorial-section-content">
              <div className="section-kicker">Katalog ist leer</div>
              <h2>Standardkatalog laden</h2>
              <p>
                Hier fehlen noch die Produktdaten. Lade die sieben
                ursprünglichen Produkte und vier Düfte mit ihren Bildern und
                Preisen. Kunden und Bestellungen bleiben unverändert.
              </p>
              <button
                type="button"
                className="solid-button"
                onClick={handleInitializeCatalog}
                disabled={initializeCatalog.isPending}
                data-testid="button-initialize-catalog"
              >
                {initializeCatalog.isPending
                  ? "Katalog wird geladen…"
                  : "Standardkatalog laden"}{" "}
                <ArrowRight size={13} />
              </button>
            </div>
          </section>
        )}

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
            <button
              className="solid-button"
              onClick={() => setProductSheet({ open: true })}
            >
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
              <div className="py-8 text-center text-sm text-[#777369]">
                Loading products...
              </div>
            ) : products.data?.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#777369]">
                No products found.
              </div>
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
                      <span
                        className={`admin-badge ${p.active ? "active" : "inactive"}`}
                      >
                        {p.active ? "Active" : "Inactive"}
                      </span>
                      <span
                        className={`admin-badge ${p.published ? "active" : "inactive"}`}
                      >
                        {p.published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="admin-row-actions text-right">
                      <button
                        className="admin-action-btn"
                        onClick={() =>
                          setProductSheet({ open: true, product: p })
                        }
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
            <button
              className="solid-button"
              onClick={() => setScentSheet({ open: true })}
            >
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
              <div className="py-8 text-center text-sm text-[#777369]">
                Loading scents...
              </div>
            ) : scents.data?.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#777369]">
                No scents found.
              </div>
            ) : (
              scents.data?.map((s) => (
                <div key={s.id} className="admin-catalog-row admin-scent-row">
                  <div>
                    <strong>{s.name}</strong>
                    <small>{s.id}</small>
                  </div>
                  <div>
                    <span
                      style={{ color: "var(--ink)", maxWidth: "300px" }}
                      className="truncate"
                    >
                      {s.notes}
                    </span>
                  </div>
                  <div>
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`admin-badge ${s.active ? "active" : "inactive"}`}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </span>
                      <span
                        className={`admin-badge ${s.published ? "active" : "inactive"}`}
                      >
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
      </section>

      {/* Product Drawer */}
      <div
        className={`overlay ${productSheet.open ? "open" : ""}`}
        onClick={() => setProductSheet({ open: false })}
        aria-hidden="true"
        style={{ zIndex: 55 }}
      />
      <aside
        className={`admin-drawer ${productSheet.open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!productSheet.open}
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
              uploading={productUploading}
              onUploadingChange={setProductUploading}
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
          <button type="submit" form="product-form" className="solid-button" disabled={productUploading}>
            {productUploading ? "Uploading media…" : "Save Product"} <ArrowRight size={13} />
          </button>
        </div>
      </aside>

      {/* Scent Drawer */}
      <div
        className={`overlay ${scentSheet.open ? "open" : ""}`}
        onClick={() => setScentSheet({ open: false })}
        aria-hidden="true"
        style={{ zIndex: 55 }}
      />
      <aside
        className={`admin-drawer ${scentSheet.open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!scentSheet.open}
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
              uploading={scentUploading}
              onUploadingChange={setScentUploading}
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
          <button type="submit" form="scent-form" className="solid-button" disabled={scentUploading}>
            {scentUploading ? "Uploading media…" : "Save Scent"} <ArrowRight size={13} />
          </button>
        </div>
      </aside>
    </div>
  );
}

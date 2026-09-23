import { useState, useEffect } from "react";
import {
  useListAdminProducts,
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
  active: z.boolean().default(true),
  published: z.boolean().default(true),
  sortOrder: z.coerce.number().default(0),
});

function ProductForm({
  product,
  scents,
  onClose,
}: {
  product?: Product;
  scents: Scent[];
  onClose: () => void;
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


  const { register, formState: { errors }, watch, setValue, handleSubmit, getValues } = form;

  return (
      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="mt-8">
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label>ID (Slug)</label>
            <input className="admin-input" {...register("id")} disabled={!!product} />
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
            {errors.collection && <span className="error">{errors.collection.message}</span>}
          </div>
          <div className="admin-form-group">
            <label>Category</label>
            <input className="admin-input" {...register("category")} />
            {errors.category && <span className="error">{errors.category.message}</span>}
          </div>
          <div className="admin-form-group">
            <label>Price (€)</label>
            <input type="number" step="0.01" className="admin-input" {...register("priceEuros")} />
            {errors.priceEuros && <span className="error">{errors.priceEuros.message}</span>}
          </div>
        </div>

        <div className="admin-form-group">
          <label>Short Description</label>
          <textarea className="admin-textarea" style={{minHeight: "80px"}} {...register("description")} />
          {errors.description && <span className="error">{errors.description.message}</span>}
        </div>

        <div className="admin-form-group">
          <label>Explanation (Long)</label>
          <textarea className="admin-textarea" {...register("explanation")} />
          {errors.explanation && <span className="error">{errors.explanation.message}</span>}
        </div>

        <div className="admin-form-row">
          <div className="admin-form-group">
            <label>Tag (Optional)</label>
            <input className="admin-input" {...register("tag")} />
            {errors.tag && <span className="error">{errors.tag.message}</span>}
          </div>
          <div className="admin-form-group">
            <label>Sort Order</label>
            <input type="number" className="admin-input" {...register("sortOrder")} />
            {errors.sortOrder && <span className="error">{errors.sortOrder.message}</span>}
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
          <div className="admin-form-row" style={{ gap: "12px", marginTop: "8px" }}>
            {scents.map((scent) => (
              <label key={scent.id} className="admin-checkbox-group" style={{ marginBottom: "8px" }}>
                <input
                  type="checkbox"
                  checked={watch("scentIds")?.includes(scent.id) || false}
                  onChange={(e) => {
                    const current = getValues("scentIds") || [];
                    if (e.target.checked) {
                      setValue("scentIds", [...current, scent.id]);
                    } else {
                      setValue("scentIds", current.filter(id => id !== scent.id));
                    }
                  }}
                />
                <span>{scent.name}</span>
              </label>
            ))}
          </div>
          {errors.scentIds && <span className="error">{errors.scentIds.message}</span>}
        </div>

        <div className="admin-form-group mt-6">
          <label>Images</label>
          <MultiImageUploader
            value={watch("imagePaths") || []}
            onChange={(paths) => setValue("imagePaths", paths)}
          />
          {errors.imagePaths && <span className="error">{errors.imagePaths.message}</span>}
        </div>

      </form>
  );
}

function ScentForm({ scent, onClose }: { scent?: Scent; onClose: () => void }) {
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
      active: true,
      published: true,
      sortOrder: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof scentSchema>) => {
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


  const { register, formState: { errors }, watch, setValue, handleSubmit } = form;

  return (
      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="mt-8">
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label>ID (Slug)</label>
            <input className="admin-input" {...register("id")} disabled={!!scent} />
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
          {errors.description && <span className="error">{errors.description.message}</span>}
        </div>

        <div className="admin-form-group">
          <label>Sort Order</label>
          <input type="number" className="admin-input" {...register("sortOrder")} />
          {errors.sortOrder && <span className="error">{errors.sortOrder.message}</span>}
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
          <label>Scent Image</label>
          <SingleImageUploader
            value={watch("imagePath")}
            onChange={(path) => setValue("imagePath", path)}
          />
          {errors.imagePath && <span className="error">{errors.imagePath.message}</span>}
        </div>

      </form>
  );
}

export function CatalogCms() {
  const products = useListAdminProducts();
  const scents = useListAdminScents();
  const deleteProduct = useDeleteProduct();
  const deleteScent = useDeleteScent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [productSheet, setProductSheet] = useState<{
    open: boolean;
    product?: Product;
  }>({ open: false });
  const [scentSheet, setScentSheet] = useState<{
    open: boolean;
    scent?: Scent;
  }>({ open: false });

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
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 mt-12">
      <div>
        <h1 className="text-3xl font-serif text-ink tracking-tight mb-2">
          Catalog CMS
        </h1>
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
          Manage products and scents
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full">
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
                            className={`px-2 py-1 text-xs rounded-full ${p.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                          >
                            {p.active ? "Active" : "Inactive"}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${p.published ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
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
                            className={`px-2 py-1 text-xs rounded-full ${s.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                          >
                            {s.active ? "Active" : "Inactive"}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${s.published ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
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
      </Tabs>

      <Sheet
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
      </Sheet>
    </div>
  );
}

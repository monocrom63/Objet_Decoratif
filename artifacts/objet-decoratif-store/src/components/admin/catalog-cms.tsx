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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MultiImageUploader, SingleImageUploader } from "./image-uploader";
import { Checkbox } from "@/components/ui/checkbox";
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID (Slug)</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!!product} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="collection"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Collection</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priceEuros"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="explanation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explanation (Long)</FormLabel>
              <FormControl>
                <Textarea {...field} className="min-h-[100px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tag (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sort Order</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Active</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="published"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Published</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="scentIds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Available Scents</FormLabel>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {scents.map((scent) => (
                  <FormField
                    key={scent.id}
                    control={form.control}
                    name="scentIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={scent.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(scent.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, scent.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== scent.id,
                                      ),
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {scent.name}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imagePaths"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Images</FormLabel>
              <FormControl>
                <MultiImageUploader
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </form>
    </Form>
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID (Slug)</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!!scent} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sortOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort Order</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Active</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="published"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Published</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="imagePath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scent Image</FormLabel>
              <FormControl>
                <SingleImageUploader
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Scent"}
          </Button>
        </div>
      </form>
    </Form>
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

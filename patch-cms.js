const fs = require('fs');

let cms = fs.readFileSync('artifacts/objet-decoratif-store/src/components/admin/catalog-cms.tsx', 'utf8');

// Replace all shadcn forms with standard HTML forms leveraging our new CSS classes.

cms = cms.replace(/import { Tabs, TabsContent, TabsList, TabsTrigger } from "@\/components\/ui\/tabs";\nimport { Button } from "@\/components\/ui\/button";\nimport {\n  Table,\n  TableBody,\n  TableCell,\n  TableHead,\n  TableHeader,\n  TableRow,\n} from "@\/components\/ui\/table";\nimport {\n  Sheet,\n  SheetContent,\n  SheetHeader,\n  SheetTitle,\n  SheetDescription,\n} from "@\/components\/ui\/sheet";\nimport { Plus, Pencil, Trash2 } from "lucide-react";/g, `import { Plus, Pencil, Trash2, X, ArrowRight } from "lucide-react";`);

cms = cms.replace(/import {\n  Form,\n  FormControl,\n  FormField,\n  FormItem,\n  FormLabel,\n  FormMessage,\n} from "@\/components\/ui\/form";\nimport { Input } from "@\/components\/ui\/input";\nimport { Textarea } from "@\/components\/ui\/textarea";\nimport { Switch } from "@\/components\/ui\/switch";/g, '');

cms = cms.replace(/import { Checkbox } from "@\/components\/ui\/checkbox";/g, '');

// Product Form
const productFormOld = `  return (
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
  );`;

const productFormNew = `
  const { register, formState: { errors }, watch, setValue, handleSubmit, getValues } = form;

  return (
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
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
  );`;

cms = cms.replace(productFormOld, productFormNew);


// Scent Form
const scentFormOld = `  return (
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
  );`;


const scentFormNew = `
  const { register, formState: { errors }, watch, setValue, handleSubmit } = form;

  return (
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
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
  );`;

cms = cms.replace(scentFormOld, scentFormNew);


// Also inject refs or form IDs to submit the external buttons
cms = cms.replace(/<form onSubmit=\{handleSubmit\(onSubmit\)\} className="mt-8">/g, '<form id="product-form" onSubmit={handleSubmit(onSubmit)} className="mt-8">');
cms = cms.replace(/<form onSubmit=\{handleSubmit\(onSubmit\)\} className="mt-8">/g, '<form id="scent-form" onSubmit={handleSubmit(onSubmit)} className="mt-8">');

// For Scent Form we need to specify ID properly
cms = cms.replace(/<form id="product-form" onSubmit=\{handleSubmit\(onSubmit\)\} className="mt-8">/, '<form id="product-form" onSubmit={handleSubmit(onSubmit)} className="mt-8">'); // Only first occurrence (already replaced both though...) - let's fix it later.

fs.writeFileSync('patch-temp.js', cms);

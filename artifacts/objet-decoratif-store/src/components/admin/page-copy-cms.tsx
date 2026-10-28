import { useEffect, useState } from "react";
import {
  getGetAdminPageCopyQueryKey,
  getGetPageCopyQueryKey,
  useGetAdminPageCopy,
  useUpdateAdminPageCopy,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  PAGE_COPY_FIELDS,
  pageCopyDefaults,
  type SitePage,
  type SitePageCopyValues,
} from "@/lib/site-page-copy";

const PAGES: { id: SitePage; label: string }[] = [
  { id: "about", label: "About" },
  { id: "care", label: "Care" },
];

export function PageCopyCms() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pageCopyQuery = useGetAdminPageCopy();
  const updatePageCopy = useUpdateAdminPageCopy();
  const [activePage, setActivePage] = useState<SitePage>("about");
  const [values, setValues] = useState<SitePageCopyValues>({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (pageCopyQuery.data && !initialized) {
      setValues(pageCopyDefaults(pageCopyQuery.data));
      setInitialized(true);
    }
  }, [pageCopyQuery.data, initialized]);

  const fields = PAGE_COPY_FIELDS.filter((field) => field.page === activePage);
  const sections = [...new Set(fields.map((field) => field.section))];

  const updateValue = (
    key: string,
    language: "english" | "german",
    value: string,
  ) => {
    setValues((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? { english: "", german: "" }),
        [language]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!initialized || pageCopyQuery.isError || updatePageCopy.isPending) return;
    try {
      const items = fields.map((field) => ({
        key: field.key,
        english: values[field.key]?.english ?? field.source,
        german: values[field.key]?.german ?? "",
      }));
      await updatePageCopy.mutateAsync({ data: { items } });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getGetAdminPageCopyQueryKey(),
        }),
        queryClient.invalidateQueries({ queryKey: getGetPageCopyQueryKey() }),
      ]);
      toast({ title: `${PAGES.find((page) => page.id === activePage)?.label} page text saved` });
    } catch (error) {
      toast({
        title: "Page text could not be saved",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  return (
    <section className="editorial-section admin-page-copy-section">
      <div className="editorial-section-label">
        03 / Page copy
        <br />
        <span>About / Care</span>
      </div>
      <div className="editorial-section-content">
        <div className="mb-6">
          <div className="section-kicker">Website text</div>
          <h2>About &amp; Care</h2>
          <p>
            Edit the English and German copy separately. Saved text stays as
            entered and is never translated automatically.
          </p>
        </div>

        <div className="mb-6 flex gap-3 border-b border-[#d3cec2]" role="tablist" aria-label="Page copy">
          {PAGES.map((page) => (
            <button
              key={page.id}
              type="button"
              role="tab"
              aria-selected={activePage === page.id}
              className={`border-b-2 px-3 py-2 text-sm ${
                activePage === page.id
                  ? "border-[#20201c] text-[#20201c]"
                  : "border-transparent text-[#777369]"
              }`}
              onClick={() => setActivePage(page.id)}
              data-testid={`tab-page-copy-${page.id}`}
            >
              {page.label}
            </button>
          ))}
        </div>

        {pageCopyQuery.isLoading ? (
          <p className="py-6 text-sm text-[#777369]">Loading page text…</p>
        ) : pageCopyQuery.isError ? (
          <div className="py-6 text-sm text-[#777369]">
            <p>Page text could not be loaded. Existing page content is unchanged.</p>
            <button
              type="button"
              className="outline-button mt-4"
              onClick={() => void pageCopyQuery.refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section, index) => (
              <details
                key={section}
                className="admin-page-copy-group border-t border-[#d3cec2] py-3"
                open={index === 0}
              >
                <summary className="cursor-pointer list-none font-medium">
                  {section}
                </summary>
                <div className="mt-5 space-y-6">
                  {fields
                    .filter((field) => field.section === section)
                    .map((field) => (
                      <fieldset
                        key={field.key}
                        className="min-w-0 border-0 p-0"
                        data-testid={`field-page-copy-${field.key}`}
                      >
                        <legend className="mb-3 text-xs font-medium uppercase tracking-wider text-[#777369]">
                          {field.label}
                        </legend>
                        <div className="grid gap-4 md:grid-cols-2">
                          {(["english", "german"] as const).map((language) => {
                            const fieldId = `page-copy-${field.key}-${language}`;
                            const label = language === "english" ? "English" : "Deutsch";
                            const value = values[field.key]?.[language] ?? "";
                            return (
                              <div className="admin-form-group" key={language}>
                                <label htmlFor={fieldId}>{label}</label>
                                {"multiline" in field && field.multiline ? (
                                  <textarea
                                    id={fieldId}
                                    rows={4}
                                    value={value}
                                    onChange={(event) =>
                                      updateValue(field.key, language, event.target.value)
                                    }
                                    data-testid={`${fieldId}-input`}
                                  />
                                ) : (
                                  <input
                                    id={fieldId}
                                    type="text"
                                    value={value}
                                    onChange={(event) =>
                                      updateValue(field.key, language, event.target.value)
                                    }
                                    data-testid={`${fieldId}-input`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </fieldset>
                    ))}
                </div>
              </details>
            ))}
            <div className="pt-4">
              <button
                type="button"
                className="solid-button"
                onClick={() => void handleSave()}
                disabled={!initialized || updatePageCopy.isPending}
                data-testid={`button-save-page-copy-${activePage}`}
              >
                {updatePageCopy.isPending ? "Saving…" : `Save ${activePage} text`}{" "}
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

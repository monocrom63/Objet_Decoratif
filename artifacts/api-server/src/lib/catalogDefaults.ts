import type { InsertProduct, InsertScent } from "@workspace/db";

export const initialScents: InsertScent[] = [
  {
    id: "the",
    name: "Thé",
    notes: "Bergamot / Mate tea / Green tea / Clove",
    description:
      "Rose, lavandin and tea leaves open into patchouli, cedarwood and woody amber.",
    imagePath: "/images/products/the-scent.webp",
    sortOrder: 0,
  },
  {
    id: "santal-cruz",
    name: "Santal Cruz",
    notes: "Cardamom / Frankincense / Sandalwood",
    description:
      "Myrtle, jasmine and white florals rest on sandalwood, amber and vanilla.",
    imagePath: "/images/products/santal-cruz-scent.webp",
    sortOrder: 1,
  },
  {
    id: "tropicale",
    name: "Tropicale",
    notes: "Passion fruit / Citrus / Pepper / Clove",
    description:
      "Passion fruit and citrus brighten a heart of pepper and clove, grounded by guaiac wood and cedar.",
    imagePath: "/images/products/tropicale-scent.webp",
    sortOrder: 2,
  },
  {
    id: "cedar-salad",
    name: "Cedar Salad",
    notes: "Ginger / Gurjum / Alaskan cedar",
    description:
      "Iris root, violet blossom and vanilla lead into Atlas cedar and Virginia cedar.",
    imagePath: "/images/products/cedar-salad-scent.webp",
    sortOrder: 3,
  },
].map((scent) => ({ ...scent, active: true, published: true }));

type InitialProduct = Pick<
  InsertProduct,
  "id" | "name" | "description" | "explanation" | "priceCents" | "tag"
> & { images: string[] };
const products: InitialProduct[] = [
  {
    id: "barrique",
    name: "Barrique",
    description: "Compact, soft and perfectly balanced",
    explanation:
      "A compact concrete form with a soft silhouette. Barrique is made to stay on the shelf between burns and return to the ritual whenever you need it.",
    priceCents: 6800,
    tag: "The original",
    images: ["barrique-01.webp", "barrique-02.webp", "barrique-03.webp"],
  },
  {
    id: "milano",
    name: "Milano",
    description: "A taller study in quiet proportion",
    explanation:
      "Milano is a taller, architectural vessel with a hand-finished grid texture. Choose the atmosphere, light the form, and refill it when the wax is gone.",
    priceCents: 8200,
    tag: "New form",
    images: ["milano-01.webp", "milano-02.webp", "milano-03.webp"],
  },
  {
    id: "boite",
    name: "Boite",
    description: "A dark, tactile form with a softened grid",
    explanation:
      "Boite turns a compact silhouette into a study of shadow and texture. Its rounded grid catches the light differently from every angle, making the vessel feel quietly alive between burns.",
    priceCents: 8600,
    tag: "New form",
    images: [
      "boite-01.webp",
      "boite-02.webp",
      "boite-03.webp",
      "boite-04.webp",
    ],
  },
  {
    id: "chateu",
    name: "Chateu",
    description: "A pale vessel drawn in fine vertical lines",
    explanation:
      "Chateu is shaped around rhythm: a fluted body, a quiet lid, and a soft architectural profile. A light, composed form for shelves, tables and slow evenings.",
    priceCents: 8800,
    tag: "New form",
    images: ["chateu-01.webp", "chateu-02.webp", "chateu-03.webp"],
  },
  {
    id: "elephant",
    name: "Elephant",
    description: "A grounded sculptural form with a strong presence",
    explanation:
      "Elephant is an object with weight and character. Its generous silhouette is made to hold attention even when the flame is out, then return to the ritual whenever the room needs warmth.",
    priceCents: 9400,
    tag: "New form",
    images: [
      "elephant-01.webp",
      "elephant-02.webp",
      "elephant-03.webp",
      "elephant-04.webp",
      "elephant-05.webp",
    ],
  },
  {
    id: "sakura",
    name: "Sakura",
    description: "A gentle form with a calm, rounded silhouette",
    explanation:
      "Sakura brings a softer line to the collection. Its balanced shape and quiet surface are designed to sit lightly in a room while carrying the atmosphere of the flame.",
    priceCents: 8200,
    tag: "New form",
    images: [
      "sakura-01.webp",
      "sakura-02.webp",
      "sakura-03.webp",
      "sakura-04.webp",
    ],
  },
  {
    id: "refill",
    name: "Refill",
    description: "A new atmosphere for the form you already love",
    explanation:
      "Our sculptural candles are designed to last. With a refill, you extend the life of the form quietly and sustainably, without ever replacing the object itself.",
    priceCents: 3800,
    tag: "Refill",
    images: ["refill-01.webp", "refill-02.webp", "refill-03.webp"],
  },
];

export const initialProducts: InsertProduct[] = products.map(
  ({ images, ...product }, sortOrder) => ({
    ...product,
    collection: product.name,
    category: product.name,
    active: true,
    published: true,
    sortOrder,
    imagePaths: images.map((image) => `/images/products/${image}`),
    scentIds: initialScents.map((scent) => scent.id),
  }),
);

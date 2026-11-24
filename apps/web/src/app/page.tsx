import { CURRENCY } from "@saltmarket/contracts";
import { listProducts } from "@/lib/api";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY });

export default async function HomePage() {
  const { items } = await listProducts();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Saltmarket</h1>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => (
          <li key={product.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-medium">{product.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{product.description}</p>
            <p className="mt-3">{money.format(product.priceCents / 100)}</p>
            <p className="text-sm text-slate-600">
              {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}

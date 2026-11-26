import { ProductCreate, ProductQuery, ProductUpdate, QuoteQuery } from "@saltmarket/contracts";
import { type RequestHandler, Router } from "express";
import type { CatalogService } from "./catalog.service.ts";

export function createCatalogRouter(service: CatalogService, requireAdmin: RequestHandler): Router {
  return Router()
    .get("/", (req, res) => {
      res.json(service.list(ProductQuery.parse(req.query)));
    })
    .get("/:slug", (req, res) => {
      res.json(service.get(req.params.slug));
    })
    .get("/:slug/quote", (req, res) => {
      res.json(service.quote(String(req.params.slug), QuoteQuery.parse(req.query)));
    })
    .post("/", requireAdmin, (req, res) => {
      const product = service.create(ProductCreate.parse(req.body));
      res.status(201).location(`/v1/products/${product.slug}`).json(product);
    })
    .patch("/:slug", requireAdmin, (req, res) => {
      res.json(service.update(String(req.params.slug), ProductUpdate.parse(req.body)));
    })
    .delete("/:slug", requireAdmin, (req, res) => {
      service.archive(String(req.params.slug));
      res.status(204).end();
    });
}

/**
 * The catalogue index.
 *
 * A source-agnostic wrapper, like `MarketDataSource` is for listings. The seed
 * catalogue shipped here is small and hand-built; a licensed European catalogue
 * (Eurotax, JATO, Schwacke) drops in behind the same interface without anything
 * above it changing. What must not change is the shape of the identity, because
 * every stored decision references a `variantId` and those references have to
 * survive a supplier swap.
 */

import type {
  Generation,
  Make,
  Model,
  Variant,
  VariantId,
} from "./types";
import { tokens } from "./normalise";

export interface CatalogueData {
  makes: Make[];
  models: Model[];
  generations: Generation[];
  variants: Variant[];
  /** Source and version, recorded so a valuation can be replayed against it. */
  revision: string;
}

export interface IndexedVariant {
  variant: Variant;
  generation: Generation;
  model: Model;
  make: Make;
  /** Normalised tokens for the full "BMW X3 M40i xDrive" description. */
  tokens: string[];
  /** The same, as a set, for O(1) containment. */
  tokenSet: Set<string>;
}

export class Catalogue {
  readonly revision: string;
  private readonly variantsById = new Map<VariantId, IndexedVariant>();
  private readonly byModel = new Map<string, IndexedVariant[]>();
  private readonly documentFrequency = new Map<string, number>();
  readonly makes: Make[];
  readonly models: Model[];
  readonly generations: Generation[];

  constructor(data: CatalogueData) {
    this.revision = data.revision;
    this.makes = data.makes;
    this.models = data.models;
    this.generations = data.generations;

    const makeById = new Map(data.makes.map((m) => [m.id, m]));
    const modelById = new Map(data.models.map((m) => [m.id, m]));
    const generationById = new Map(data.generations.map((g) => [g.id, g]));

    for (const variant of data.variants) {
      const generation = generationById.get(variant.generationId);
      if (!generation) continue;
      const model = modelById.get(generation.modelId);
      if (!model) continue;
      const make = makeById.get(model.makeId);
      if (!make) continue;

      const description = `${make.name} ${model.name} ${variant.name} ${variant.aliases.join(" ")}`;
      const indexTokens = tokens(description);

      const indexed: IndexedVariant = {
        variant,
        generation,
        model,
        make,
        tokens: indexTokens,
        tokenSet: new Set(indexTokens),
      };

      this.variantsById.set(variant.id, indexed);
      const bucket = this.byModel.get(model.id) ?? [];
      bucket.push(indexed);
      this.byModel.set(model.id, bucket);

      for (const token of new Set(indexTokens)) {
        this.documentFrequency.set(token, (this.documentFrequency.get(token) ?? 0) + 1);
      }
    }
  }

  get size(): number {
    return this.variantsById.size;
  }

  get frequencies(): Map<string, number> {
    return this.documentFrequency;
  }

  get(variantId: VariantId): IndexedVariant | undefined {
    return this.variantsById.get(variantId);
  }

  all(): IndexedVariant[] {
    return [...this.variantsById.values()];
  }

  /** Candidate variants for a make/model pair, or the whole catalogue. */
  candidates(modelId?: string): IndexedVariant[] {
    if (modelId) return this.byModel.get(modelId) ?? [];
    return this.all();
  }

  modelsFor(makeId: string): Model[] {
    return this.models.filter((model) => model.makeId === makeId);
  }

  generationsFor(modelId: string): Generation[] {
    return this.generations
      .filter((generation) => generation.modelId === modelId)
      .sort((a, b) => b.from.localeCompare(a.from));
  }

  variantsFor(generationId: string): Variant[] {
    return this.all()
      .filter((indexed) => indexed.generation.id === generationId)
      .map((indexed) => indexed.variant)
      .sort((a, b) => b.powerKw - a.powerKw);
  }

  /**
   * Find the make whose name or alias matches, so "VW", "Volkswagen" and
   * "volkswagen ag" all land on the same record.
   */
  findMake(text: string): Make | undefined {
    const wanted = tokens(text).join(" ");
    return this.makes.find((make) =>
      [make.name, ...make.aliases].some((name) => tokens(name).join(" ") === wanted),
    );
  }

  findModel(makeId: string, text: string): Model | undefined {
    const wanted = tokens(text).join(" ");
    return this.models
      .filter((model) => model.makeId === makeId)
      .find((model) =>
        [model.name, ...model.aliases].some((name) => tokens(name).join(" ") === wanted),
      );
  }
}

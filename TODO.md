# TODO

Tracked follow-ups for SameDaySnaps. Spans this app (`pvcary-sds/mobileapp`),
the API (`pvcary-sds/api`), and Storyblok content. Check items off as they land;
add new ones here rather than leaving them only in chat/session notes.

## API + CMS

- [ ] **Make PDP badges API-driven.** The PDP shows a hardcoded "Free shipping"
      badge (`src/app/(home)/product/[id].tsx`, `Badge` / `HeaderShareButton`
      area, marked `// TODO`). Add a `badges` array to the product response
      (`GET /v1/products/{id}`), sourced from the Storyblok product story
      (decide shape, e.g. `{ label, variant? }[]`). Update the API contract +
      `src/services/storyblok.ts`, add a Badges field in Storyblok, then render
      `product.badges` in the app and drop the hardcode.
- [ ] **Add a size unit to the variant API.** `variant.size` is just e.g. `4x6`
      with no unit, so the app hardcodes " in" (PDP `SizeChip`, marked
      `// TODO`). Add a `unit` field (e.g. `in` / `cm`) to `ProductVariant`
      from the Storyblok variant blok; default to `in`. Then render
      `{size} {unit}` and remove the hardcoded string.

## Mobile app

- [ ] **Wire the PDP share action.** The PDP header has a share icon
      (`HeaderShareButton`, `// TODO`) that currently does nothing. On press,
      open the native share sheet with the product link/details (deep link to
      `/product/{id}`, name, maybe image).

## Content (Storyblok)

- [ ] **Build the remaining tier2 sub-catalogs.** Only `tier2/wallart` exists.
      Add a story per tier1 product that drills down (`tier2/prints`,
      `tier2/posters`, `tier2/framedprints`, …) in the `Tier2` folder.
- [ ] **Fill in product images** across tier1 / tier2 items (many `imageUrl`
      fields are empty, so cards show the placeholder).

## Cleanup

- [ ] **Retire the config fallback** (`api` `src/config/tiers.ts`) once the
      Storyblok tier content is verified complete and stable.

## Done

- [x] Fix PDP description paragraph spacing (split richtext into per-paragraph
      Text blocks with a gap).

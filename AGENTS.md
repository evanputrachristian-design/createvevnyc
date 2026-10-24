<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Business identity, contacts, policies and about copy live in `src/config/site.ts`; services in `src/data/services.ts`, portfolio/FAQ in `src/data/portfolio.ts` — so the owner edits one place.
- Orders are frontend-only: the form validates (`src/lib/order.ts`) and builds a WhatsApp message; never claim an order is saved without a real backend.
- Testimonials render only when real entries exist in config.

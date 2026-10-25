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
- Orders persist through server functions; prices and payment terms are snapshotted server-side and only confirmed transactions count as receipts.
- Testimonials render only when real entries exist in config.
- Payment mutations use database functions with per-order locking and admin authorization so concurrent submissions cannot overpay or duplicate receipts.
- Published website content overrides config defaults through a shared content provider; drafts remain admin-only until explicitly published.
- Tracking uses a server-generated secret code and a narrow database function with persisted request limiting, never public order SELECT.

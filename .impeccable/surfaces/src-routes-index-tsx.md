---
version: 1
slug: "src-routes-index-tsx"
primary_target: "src/routes/index.tsx"
related_targets: []
---

# Surface Brief: Landing page (src/routes/index.tsx)

Scope and visitor mode: full marketing landing page, Persuade mode. Audience: síndico (single condo) and administradora profissional (multiple condos), equal weight, per PRODUCT.md. Job: decide to sign up / "Começar agora". Constraints: all existing copy, pricing, structure, and section order stay exactly as-is (user's explicit instruction) — this is a surface-treatment extension, not a redesign, not a rewrite of content.

## Direction contract

**THESIS:** The landing page's cards and buttons read as a physical intercom/doorbell panel — the one "painel" object every Brazilian condo resident touches daily — refusing the category-default flat SaaS card-with-shadow treatment that this page currently shares with every other 2024-2026 AI-SaaS landing page.

**OWN-WORLD:** Existing DESIGN.md tokens stay authoritative (Signal Indigo, Paper/Ink neutrals, Inter, 14px-based radius scale) — this is an extension, not a replacement. New vocabulary added on top: a brushed-plate card surface (subtle bevel: light inset top edge, dark inset bottom edge, replacing the flat `shadow-card`), circular "buzzer" icon chips that sit slightly recessed at rest, and an indigo "LED" glow that lights up on hover/focus/group-hover instead of the current flat opacity-shift. Buttons (the primary CTAs) gain the same bevel so pressing them reads as pressing a physical button.

**STORY:** The visitor recognizes the card/button language from their own building's entrance panel within the first scroll, without it ever being named in copy — reinforcing "built specifically for condomínios" purely through material, not through new claims.

**FIRST VIEWPORT:** Hero is otherwise untouched (headline, copy, stats unchanged); the two hero CTA buttons gain the plate-bevel treatment as the first place the visitor feels the new material. The dashboard-mock browser-chrome dots gain a faint idle glow, reinforcing "live panel."

**FORM:** Painel do Interfone (intercom panel), user-selected as IMPECCABLE'S PICK card from a direction round; seed key `89ad2352`, dealt assignment was index 6 ("Central de Monitoramento"), user chose the pick card instead.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. (No raster/image assets are produced by this build — pure CSS/Tailwind treatment — so the provenance clause is satisfied vacuously; the review and DESIGN.md update still apply.)

## Unresolved decisions
- No image generation or browser automation is available this session: this build is code-led by necessity, not by a recorded default. No comp exists; the direction contract's FIRST VIEWPORT block is the ambition record the finish check audits against.
- Scope is intentionally limited to `src/routes/index.tsx` (the landing page only) — the rest of the app (post-login pages) is out of scope and untouched.

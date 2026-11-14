# Audit: FoodLoop (whole app, Flutter adaptive), 2026-11-14

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 3 | Hero flight still plays with reduced motion; two fixed heights clip under large text |
| 2 | Performance | 3 | Listing photos decoded at full size for an 84px thumbnail |
| 3 | Appearance & Theming | 4 | Raw colour only in app_theme.dart (plus an alpha mask in StatusStamp) |
| 4 | Platform Conformance | 3 | Branded controls, but 48px targets, tooltips, SafeArea, system back via go_router |
| 5 | Adaptivity | 3 | Three real layouts; keyboard inset handled in the post form |
| **Total** | | **16/20** | **Good** |

Platform verdict: pass. A branded app (Canteen Token) on Material 3, not a ported website: native back, SafeArea on every edge-touching frame, tooltips on all IconButtons, 48px targets via Pressable/minHeight, reduced-motion guard on every implicit animation except the Hero.

Issues: P0 0, P1 0, P2 3, P3 2.

## P2
- **Hero flies with reduced motion.** widgets/token_card.dart:101. The route fade is skipped when animations are disabled, but the TokenCard -> detail Hero still moves the card for 200ms. Fix: build the Hero only when FlMotion.reduced(context) is false (both ends use TokenCard, so no flight). `$impeccable animate`
- **Fixed heights clip under large text.** widgets/filter_tag.dart:36 (tag height 38), widgets/responsive_shell.dart:502 (badge height 18). At 200% text the label overflows its box. Fix: minHeight instead of height. `$impeccable adapt`
- **Full-size image decode for thumbnails.** widgets/token_card.dart:276. Image.network without cacheWidth decodes the original photo for an 84px block. Fix: cacheWidth = size x devicePixelRatio. `$impeccable optimize`

## P3
- Lists (feed, listings, requests, pickups) are Columns inside a scroll view, not lazy builders. Fine at campus scale (tens of items); revisit only if data grows.
- The printed "TOKEN" caption in the empty-photo block is 8px. Decorative (the card's semantic label carries the token), so left as is.

## Patterns
- Motion guards are consistent (FlMotion.of / FlMotion.reduced) with one gap (Hero).
- Fixed pixel heights are used for visual size in a few places where minHeight would scale.

## Positive findings
- No hard-coded colours, durations or text styles in widgets; tokens via context.fl.
- Status is always a word (StatusStamp); unread alerts have dot + NEW + weight.
- Every IconButton has a tooltip; custom tappables share Pressable (focus ring, Enter/Space, semantics).
- One poller that pauses in the background; the chart and badge do not animate.

## Recommended actions
1. [P2] `$impeccable animate`: gate the TokenCard Hero on reduced motion.
2. [P2] `$impeccable adapt`: minHeight for the filter tag and nav badge.
3. [P2] `$impeccable optimize`: cacheWidth on listing photos.
4. `$impeccable polish`: final pass.

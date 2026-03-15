# Ad Template Library
### SequenceFlow Static Ad Generator — Template Reference

5 core templates. Each template is a complete Nano Banana 2 prompt with [BRACKETED PLACEHOLDERS]
for brand-specific details. Claude fills these in Phase 2 using the Brand DNA document.

To add more templates: follow the same structure. Assign the next template number. Specify
aspect_ratio and needs_product_images clearly at the top of each template block.

---

## Template 01 — Headline Ad

```
aspect_ratio: 4:5
needs_product_images: true
```

**Template prompt:**

Clean product hero shot static ad. [PRODUCT_NAME] centered in frame against a solid
[PRIMARY_BACKGROUND_COLOR] background. Bold [PRIMARY_FONT] headline at top reads:
"[HEADLINE_COPY_7_WORDS_MAX]". Subheadline below in [SECONDARY_FONT] reads:
"[SUBHEADLINE_COPY_12_WORDS_MAX]". Product packaging photographed at a [CAMERA_ANGLE: straight-on
or slight 15-degree angle], [LIGHTING_STYLE: soft studio lighting or natural window light],
[PRODUCT_SHADOW: soft drop shadow or no shadow]. Brand logo in bottom-right corner.
Small CTA pill badge in [ACCENT_COLOR] reads "[CTA_TEXT: Shop Now / Try it / Get Yours]".
Photography style: [PHOTOGRAPHY_MOOD]. Ultra-sharp product detail. No distracting props.
Professional commercial photography aesthetic. 2K resolution.

---

## Template 02 — Offer / Promotion

```
aspect_ratio: 4:5
needs_product_images: true
```

**Template prompt:**

Bold promotional static ad for [BRAND_NAME]. Split layout: left 60% shows [PRODUCT_NAME]
photographed at [CAMERA_ANGLE] with [LIGHTING_STYLE]. Right 40% is solid [ACCENT_COLOR]
panel. Large [PRIMARY_FONT] text on the right panel reads "[OFFER_HEADLINE: e.g. Buy 2 Get 1
Free / 20% Off / Free Shipping Today]" in [TEXT_COLOR]. Below the offer headline, smaller
[SECONDARY_FONT] text reads "[OFFER_SUBTEXT: urgency or benefit statement, 10 words max]".
Small "[LEGAL_LINE: *Terms apply / Limited time offer]" in tiny text at bottom.
Background color: [PRIMARY_BACKGROUND_COLOR]. Lighting matches brand photography direction:
[PHOTOGRAPHY_MOOD]. High contrast. Immediately legible at thumb size. 2K resolution.

---

## Template 03 — Social Proof / Testimonial Card

```
aspect_ratio: 1:1
needs_product_images: false
```

**Template prompt:**

Clean testimonial ad card for [BRAND_NAME]. Solid [PRIMARY_BACKGROUND_COLOR] background.
Large opening quote mark in [ACCENT_COLOR] at top-left. Review text in [PRIMARY_FONT]
reads: "[CUSTOMER_QUOTE: 15–25 words, first-person, specific benefit or result]".
Five gold star rating icons below the quote. Customer name and handle in smaller
[SECONDARY_FONT]: "[CUSTOMER_NAME], [CUSTOMER_DESCRIPTOR: e.g. Verified Buyer / 
@username / Location]". [BRAND_NAME] logo centered at bottom in [LOGO_COLOR].
Thin [ACCENT_COLOR] border line at bottom edge of card. Typography is the hero —
no product image, no busy background. Clean, editorial, trustworthy aesthetic.
[PHOTOGRAPHY_MOOD] color palette applied to background tint if any. 2K resolution.

---

## Template 04 — Us vs Them Comparison

```
aspect_ratio: 4:5
needs_product_images: true
```

**Template prompt:**

Us-vs-them comparison static ad. Two-column layout divided by a thin vertical line.
Left column header: "[COMPETITOR_LABEL: e.g. Other Brands / The Old Way / Before]" in
muted [SECONDARY_FONT] gray text. Right column header: "[BRAND_NAME]" in bold [PRIMARY_FONT]
[ACCENT_COLOR] text. List of 4–5 comparison points in rows. Left column shows red X icons
next to: "[NEGATIVE_POINT_1]", "[NEGATIVE_POINT_2]", "[NEGATIVE_POINT_3]",
"[NEGATIVE_POINT_4]". Right column shows green checkmark icons next to:
"[POSITIVE_POINT_1]", "[POSITIVE_POINT_2]", "[POSITIVE_POINT_3]", "[POSITIVE_POINT_4]".
[PRODUCT_NAME] product photo floats in bottom-right corner, slightly overlapping the grid.
Background: [PRIMARY_BACKGROUND_COLOR]. Overall typography: [PRIMARY_FONT].
Clean, confident, easy to scan at a glance. 2K resolution.

---

## Template 05 — UGC-Style Lifestyle

```
aspect_ratio: 9:16
needs_product_images: false
```

**Template prompt:**

UGC-style lifestyle static ad that looks like an authentic social media post. Slightly
imperfect framing — not polished studio photography. Scene: [LIFESTYLE_SCENE: e.g.
morning kitchen counter with coffee, gym bag on bench, desk with laptop and coffee].
[PRODUCT_NAME] appears naturally in the scene — not posed, as if casually placed.
Soft natural light, [COLOR_GRADING: warm and golden or cool and clean] color grade.
Slight grain texture overlay to increase authenticity. No text overlay except a small
[BRAND_NAME] watermark in bottom-left corner in [SECONDARY_FONT], small and unobtrusive.
Props and surfaces match: [PROPS_AND_SURFACES from Brand DNA]. Mood: [PHOTOGRAPHY_MOOD].
Aspect ratio: 9:16 for Stories/Reels placement. Looks like it was shot on a good iPhone,
not a commercial shoot. 2K resolution.

---

## How to Add More Templates

Copy the block structure above. Key rules:

1. Increment the template number sequentially (06, 07, 08...)
2. Always specify `aspect_ratio` and `needs_product_images` at the top
3. Use ALL CAPS for [PLACEHOLDER_NAMES] so Claude can find them easily
4. Add a comment after each placeholder explaining what goes there if it's not obvious
5. End with resolution, aspect ratio, and any special notes for the generation script

### Recommended next templates to add (when ready):

- **06 — Before/After** — split screen transformation, needs_product_images: true
- **07 — Stat Callout** — bold number/stat hero, e.g. "10,000+ sold", needs_product_images: false
- **08 — Press / Editorial** — "As seen in [Publication]" layout, needs_product_images: true
- **09 — Faux Review Screenshot** — looks like an App Store or Google review, needs_product_images: false
- **10 — Manifesto / Brand Story** — text-heavy emotional ad, no product shown, needs_product_images: false

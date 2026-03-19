"use strict";(()=>{var e={};e.id=83,e.ids=[83],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},8791:e=>{e.exports=require("https")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},341:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>y,patchFetch:()=>A,requestAsyncStorage:()=>_,routeModule:()=>g,serverHooks:()=>b,staticGenerationAsyncStorage:()=>f});var o={};r.r(o),r.d(o,{PATCH:()=>h,POST:()=>m});var a=r(9303),n=r(8716),i=r(3131),s=r(7070),l=r(5662),p=r(4214);let d=[{template_number:1,template_name:"headline",aspect_ratio:"3:4",needs_product_images:!0,prompt_template:`Clean product hero shot static ad. [PRODUCT_NAME] centered in frame against a solid
[PRIMARY_BACKGROUND_COLOR] background. Bold [PRIMARY_FONT] headline at top reads:
"[HEADLINE_COPY_7_WORDS_MAX]". Subheadline below in [SECONDARY_FONT] reads:
"[SUBHEADLINE_COPY_12_WORDS_MAX]". Product packaging photographed at a [CAMERA_ANGLE: straight-on
or slight 15-degree angle], [LIGHTING_STYLE: soft studio lighting or natural window light],
[PRODUCT_SHADOW: soft drop shadow or no shadow]. Brand logo in bottom-right corner.
Small CTA pill badge in [ACCENT_COLOR] reads "[CTA_TEXT: Shop Now / Try it / Get Yours]".
Photography style: [PHOTOGRAPHY_MOOD]. Ultra-sharp product detail. No distracting props.
Professional commercial photography aesthetic. 2K resolution.`},{template_number:2,template_name:"offer-promotion",aspect_ratio:"3:4",needs_product_images:!0,prompt_template:`Bold promotional static ad for [BRAND_NAME]. Split layout: left 60% shows [PRODUCT_NAME]
photographed at [CAMERA_ANGLE] with [LIGHTING_STYLE]. Right 40% is solid [ACCENT_COLOR]
panel. Large [PRIMARY_FONT] text on the right panel reads "[OFFER_HEADLINE: e.g. Buy 2 Get 1
Free / 20% Off / Free Shipping Today]" in [TEXT_COLOR]. Below the offer headline, smaller
[SECONDARY_FONT] text reads "[OFFER_SUBTEXT: urgency or benefit statement, 10 words max]".
Small "[LEGAL_LINE: *Terms apply / Limited time offer]" in tiny text at bottom.
Background color: [PRIMARY_BACKGROUND_COLOR]. Lighting matches brand photography direction:
[PHOTOGRAPHY_MOOD]. High contrast. Immediately legible at thumb size. 2K resolution.`},{template_number:3,template_name:"testimonial",aspect_ratio:"1:1",needs_product_images:!1,prompt_template:`Clean testimonial ad card for [BRAND_NAME]. Solid [PRIMARY_BACKGROUND_COLOR] background.
Large opening quote mark in [ACCENT_COLOR] at top-left. Review text in [PRIMARY_FONT]
reads: "[CUSTOMER_QUOTE: 15–25 words, first-person, specific benefit or result]".
Five gold star rating icons below the quote. Customer name and handle in smaller
[SECONDARY_FONT]: "[CUSTOMER_NAME], [CUSTOMER_DESCRIPTOR: e.g. Verified Buyer /
@username / Location]". [BRAND_NAME] logo centered at bottom in [LOGO_COLOR].
Thin [ACCENT_COLOR] border line at bottom edge of card. Typography is the hero —
no product image, no busy background. Clean, editorial, trustworthy aesthetic.
[PHOTOGRAPHY_MOOD] color palette applied to background tint if any. 2K resolution.`},{template_number:4,template_name:"vs-them",aspect_ratio:"3:4",needs_product_images:!0,prompt_template:`Us-vs-them comparison static ad. Two-column layout divided by a thin vertical line.
Left column header: "[COMPETITOR_LABEL: e.g. Other Brands / The Old Way / Before]" in
muted [SECONDARY_FONT] gray text. Right column header: "[BRAND_NAME]" in bold [PRIMARY_FONT]
[ACCENT_COLOR] text. List of 4–5 comparison points in rows. Left column shows red X icons
next to: "[NEGATIVE_POINT_1]", "[NEGATIVE_POINT_2]", "[NEGATIVE_POINT_3]",
"[NEGATIVE_POINT_4]". Right column shows green checkmark icons next to:
"[POSITIVE_POINT_1]", "[POSITIVE_POINT_2]", "[POSITIVE_POINT_3]", "[POSITIVE_POINT_4]".
[PRODUCT_NAME] product photo floats in bottom-right corner, slightly overlapping the grid.
Background: [PRIMARY_BACKGROUND_COLOR]. Overall typography: [PRIMARY_FONT].
Clean, confident, easy to scan at a glance. 2K resolution.`},{template_number:5,template_name:"ugc-lifestyle",aspect_ratio:"9:16",needs_product_images:!0,prompt_template:`UGC-style lifestyle photo ad. Scene: [LIFESTYLE_SCENE]. [PRODUCT_NAME] sits naturally in the scene, casually placed — not posed. Soft natural light, [COLOR_GRADING] color grade, slight film grain.
At the very top of the image: large bold [PRIMARY_FONT] hook text "[HOOK_TEXT]" floats directly over the photo — NO background box, NO overlay panel, NO text container, text sits on top of the image.
Directly below the hook text: smaller [SECONDARY_FONT] CTA text "[CTA_TEXT]".
No logo. No watermark. No brand badge. No extra UI elements. Just the photo and the two lines of text at the top.
9:16 vertical. Shot-on-iPhone aesthetic, not a commercial shoot. 2K resolution.`}],c=`
You are a prompt engineer specializing in AI image generation for DTC brands.

Your job: For each ad template, generate TWO things:
1. background_prompt — the full visual/scene/product-placement prompt for the image generator. Describes the background, scene, product placement, lighting, colors, and brand aesthetic. Does NOT include any text overlay copy.
2. hook_variants — an array of N short text overlay copy strings. Each hook variant contains the headline, optional subtitle, and CTA text that will appear as overlay text in the ad. Each must be meaningfully different in angle, tone, or message.

LANGUAGE RULE:
- ALL hook_variants MUST be written in the language specified in the brand data. This is non-negotiable.
- The background_prompt MUST always be written in English regardless of language — it is a technical prompt for an image generator, not customer-facing copy.

CRITICAL RULES — VISUAL:
- The background_prompt MUST include the brand's font name(s) explicitly — e.g. "typography in Neue Haas Grotesk"
- The background_prompt MUST describe brand colors by their VISUAL APPEARANCE — e.g. "warm off-white background", "deep charcoal text", "bright lime green accent". NEVER write hex codes (#xxxxxx) in the background_prompt — image generators render hex strings as literal text on the image.
- Use the provided hex codes only to determine the color's visual description (e.g. #C7F56F → "bright lime green", #1a1a1a → "near-black charcoal", #FFFFFF → "clean white").
- The background_prompt MUST STRICTLY follow reference images — do NOT invent props, objects, or surfaces not present in the reference images
- background_prompt must reflect the backgroundIntent — use their described scene/props as the visual foundation
- Replace every [BRACKETED PLACEHOLDER] with brand-specific details
- Keep template_number and template_name exactly as provided
- Output ONLY valid JSON — no markdown, no code blocks

CRITICAL RULES — COPY (hook_variants):
Every hook_variant MUST satisfy all three elements:
1. AVATAR MATCH — name the specific situation, frustration, or identity the customer desire describes. The reader must feel "that's me."
2. OPEN LOOP — use a question, "how to", a surprising fact, or a statement that is incomplete without reading further. No closed statements.
3. CLEAR BENEFIT — what's in it for them must be obvious before they finish reading the hook. Do not bury the payoff.

DESIRE RULE: When a customer desire is provided, every hook_variant MUST be built around that desire and nothing else. The desire is the emotional core — the hook should make the reader feel that desire more acutely, then position the product as the answer. Do not blend in other desires or generic brand messaging.

Bad hook: "Improve your kitchen with Noctis cookware" (no curiosity, no avatar, generic)
Good hook (desire = "look like a pro at home"): "Why home cooks are quietly ditching their old knives for this one set" (avatar = home cook wanting pro results, loop = "quietly" + why, benefit = implied upgrade)

Calibrate hook intensity to the awareness level:
- unaware: pattern interrupt, no product mention, pure curiosity — the reader doesn't know they have a problem yet
- problem-aware: lead with pain or frustration the ICP knows well — they know the problem, not the solution
- solution-aware: focus on why this solution beats alternatives — they know solutions exist
- product-aware: proof, specific results, social validation — they know the product, need convincing
- most-aware: direct offer, urgency, concrete deal — they're ready to buy

Each hook_variant must be a meaningfully different angle — different sentence structure, different emotional trigger, different way into the same desire. Never rephrase the same idea twice.

JSON Schema:
{
  "prompts": [
    {
      "template_number": 1,
      "template_name": "headline",
      "aspect_ratio": "3:4",
      "needs_product_images": true,
      "notes": "Any notes",
      "background_prompt": "Full visual prompt with explicit font names and color hex values...",
      "hook_variants": [
        "Headline: [text] | Subtitle: [text] | CTA: [text]",
        "Headline: [different text] | Subtitle: [different text] | CTA: [text]"
      ]
    }
  ]
}
`;async function u(e,t,r,o,a=2,n=null,i=null,s=[],l="problem-aware",u=null){let m=process.env.OPENAI_API_KEY;if(!m)throw Error("OPENAI_API_KEY is not set.");let h=new p.ZP({apiKey:m}),g=s.length>0?d.filter(e=>s.includes(e.template_number)):d,_=g.map(e=>`Template ${e.template_number} — ${e.template_name}
aspect_ratio: ${e.aspect_ratio}
needs_product_images: ${e.needs_product_images}

${e.prompt_template}`).join("\n\n---\n\n"),f=`Brand Data:
${function(e,t){let r=e.hook_examples??[];return`
BRAND: ${e.name}
Ad Copy Language: ${e.language??"English"} ← write ALL hook_variants in this language
Tagline: ${e.tagline??"N/A"}
Brand Story: ${e.brand_story??"N/A"}
Target Audience: ${e.target_audience??"N/A"}
Brand Personality: ${e.brand_personality??"N/A"}
Voice: ${e.voice_adjectives.join(", ")}
Positioning: ${e.positioning??"N/A"}

COPY STRATEGY:
Customer Desire for this generation: ${t??"None selected — use brand positioning and product benefits to infer the strongest desire"}
${r.length>0?`Hook Examples — create VARIANTS of these (same angle, new phrasing):
${r.map((e,t)=>`${t+1}. "${e}"`).join("\n")}`:"Hook Examples: none provided — generate original hooks from the framework"}

VISUAL SYSTEM (font names MUST appear in background_prompt; colors must be described visually — NO hex codes in background_prompt):
Primary Font: ${e.primary_font??"N/A"} ← use this font name explicitly
Secondary Font: ${e.secondary_font??"N/A"}
Accent Color: ${e.accent_color??"N/A"} ← describe visually (e.g. "bright lime green"), never write the hex
Lettertype Color: ${e.lettertype_color??"N/A"} ← describe visually
Background Color: ${e.background_color??"N/A"} ← describe visually
`.trim()}(e,u)}

---

Product Name: ${t}
Product Description: ${r??"No description provided"}

---

User Intent:
Hook/Copy intent (what the headline & CTA should communicate): ${n??"Not specified — use brand positioning and product benefits"}
Background/Scene intent (what the visual scene should look like): ${i??"Not specified — follow brand colors and typography exactly"}

---

Awareness Level: ${l}
Calibrate hook intensity accordingly:
- unaware: pattern interrupt, no product mention, pure curiosity
- problem-aware: lead with pain/frustration the ICP knows well
- solution-aware: focus on why this solution beats alternatives
- product-aware: proof, specific results, social validation
- most-aware: direct offer, urgency, concrete deal

---

Number of hook variants to generate per template: ${a}

---

Templates to fill:
${_}

---

Generate the prompts JSON for all ${g.length} templates. Each template needs exactly ${a} hook_variants. Remember: background_prompt MUST include font names explicitly AND describe brand colors visually — do NOT write any hex codes (#xxxxxx) in background_prompt. Output ONLY the JSON object with a "prompts" array.`,b=await h.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:c},{role:"user",content:f}],temperature:.7,response_format:{type:"json_object"}}),y=b.choices[0]?.message?.content;if(!y)throw Error("No content returned from OpenAI.");let A=JSON.parse(y);if(!A.prompts||!Array.isArray(A.prompts))throw Error("Invalid prompts JSON structure returned by OpenAI.");return{brand:o,product:t,generated_at:new Date().toISOString(),num_variants:a,hook_intent:n,background_intent:i,prompts:A.prompts}}async function m(e,{params:t}){let{id:r}=await t,{product_id:o,num_variants:a=2,hook_intent:n=null,background_intent:i=null,template_numbers:p=[],awareness_level:d="problem-aware",selected_desire:c=null}=await e.json();if(!o)return s.NextResponse.json({error:"product_id is required"},{status:400});let m=(0,l.bQ)(),[h,g,_]=await Promise.all([m.from("brands").select("*").eq("id",r).single(),m.from("brand_dna").select("*").eq("brand_id",r).order("generated_at",{ascending:!1}).limit(1).maybeSingle(),m.from("products").select("*").eq("id",o).single()]);if(h.error||!h.data)return s.NextResponse.json({error:"Brand not found"},{status:404});if(!g.data)return s.NextResponse.json({error:"Brand DNA not found. Complete Phase 1 first."},{status:400});if(_.error||!_.data)return s.NextResponse.json({error:"Product not found"},{status:404});let f=_.data;try{let e=await u(g.data.data,f.name,f.description,h.data.name,a,n,i,p,d,c),t={...e,prompts_original:e.prompts},{data:l,error:_}=await m.from("prompt_sets").insert({brand_id:r,product_id:o,product_name:f.name,prompts_json:t}).select().single();if(_)throw Error(_.message);return s.NextResponse.json({prompt_set:l})}catch(t){let e=t instanceof Error?t.message:String(t);return s.NextResponse.json({error:e},{status:500})}}async function h(e,{params:t}){await t;let{prompt_set_id:r,prompts:o}=await e.json();if(!r||!Array.isArray(o))return s.NextResponse.json({error:"prompt_set_id and prompts array required"},{status:400});let a=(0,l.bQ)(),{data:n}=await a.from("prompt_sets").select("*").eq("id",r).single();if(!n)return s.NextResponse.json({error:"Prompt set not found"},{status:404});let i={...n.prompts_json,prompts:o},{data:p,error:d}=await a.from("prompt_sets").update({prompts_json:i}).eq("id",r).select().single();return d?s.NextResponse.json({error:d.message},{status:500}):s.NextResponse.json({prompt_set:p})}let g=new a.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/brands/[id]/prompts/route",pathname:"/api/brands/[id]/prompts",filename:"route",bundlePath:"app/api/brands/[id]/prompts/route"},resolvedPagePath:"/home/runner/work/static-ad-generator/static-ad-generator/app/api/brands/[id]/prompts/route.ts",nextConfigOutput:"standalone",userland:o}),{requestAsyncStorage:_,staticGenerationAsyncStorage:f,serverHooks:b}=g,y="/api/brands/[id]/prompts/route";function A(){return(0,i.patchFetch)({serverHooks:b,staticGenerationAsyncStorage:f})}},5662:(e,t,r)=>{r.d(t,{Lb:()=>s,bQ:()=>n,sX:()=>i});var o=r(7857);function a(e){let t=process.env[e];if(!t)throw Error(`Missing required env var: ${e}`);return t}function n(){return(0,o.eI)(a("NEXT_PUBLIC_SUPABASE_URL"),a("SUPABASE_SERVICE_ROLE_KEY"),{auth:{persistSession:!1}})}async function i(e,t,r,o){let a=n(),{error:i}=await a.storage.from(e).upload(t,r,{contentType:o,upsert:!0});if(i)throw Error(`Storage upload failed: ${i.message}`);let{data:s}=a.storage.from(e).getPublicUrl(t);return s.publicUrl}async function s(e,t){let r=n(),{data:o,error:a}=await r.storage.from(e).list(t);return a||!o?[]:o.filter(e=>e.name&&!e.name.startsWith(".")).map(o=>{let{data:a}=r.storage.from(e).getPublicUrl(`${t}/${o.name}`);return a.publicUrl})}r(7721)}};var t=require("../../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[948,972,721,214],()=>r(341));module.exports=o})();
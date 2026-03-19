"use strict";(()=>{var e={};e.id=96,e.ids=[96],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},8791:e=>{e.exports=require("https")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},4386:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>h,patchFetch:()=>y,requestAsyncStorage:()=>d,routeModule:()=>c,serverHooks:()=>m,staticGenerationAsyncStorage:()=>l});var o={};t.r(o),t.d(o,{POST:()=>u});var n=t(9303),a=t(8716),s=t(3131),i=t(7070),p=t(9678);async function u(e,{params:r}){await r;let{url:t}=await e.json();if(!t)return i.NextResponse.json({error:"url is required"},{status:400});try{let e=(0,p.$)(),r=(await e.responses.create({model:"gpt-4o",instructions:`You are extracting product information from a product page URL.
Visit the URL and extract the product name and a 1-2 sentence product description.
Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{"name": "Product name", "description": "1-2 sentence description"}`,input:`Extract product info from this URL: ${t}`,tools:[{type:"web_search_preview"}]})).output.filter(e=>"message"===e.type).flatMap(e=>"message"===e.type?e.content.filter(e=>"output_text"===e.type).map(e=>"output_text"===e.type?e.text:""):[]).join("");if(!r)throw Error("No response from OpenAI");let o=r.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim(),n=JSON.parse(o);return i.NextResponse.json(n)}catch(r){let e=r instanceof Error?r.message:String(r);return i.NextResponse.json({error:e},{status:500})}}let c=new n.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/brands/[id]/products/scrape/route",pathname:"/api/brands/[id]/products/scrape",filename:"route",bundlePath:"app/api/brands/[id]/products/scrape/route"},resolvedPagePath:"/home/runner/work/static-ad-generator/static-ad-generator/app/api/brands/[id]/products/scrape/route.ts",nextConfigOutput:"standalone",userland:o}),{requestAsyncStorage:d,staticGenerationAsyncStorage:l,serverHooks:m}=c,h="/api/brands/[id]/products/scrape/route";function y(){return(0,s.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:l})}},9678:(e,r,t)=>{t.d(r,{$:()=>n,B:()=>s});var o=t(4214);function n(){if(!process.env.OPENAI_API_KEY)throw Error("OPENAI_API_KEY environment variable is not set.");return new o.ZP({apiKey:process.env.OPENAI_API_KEY})}let a=`
You are a Senior Brand Strategist. Reverse-engineer a brand's visual and verbal identity by searching the web and analyzing their website.

Focus on what you can actually observe: brand story, target audience, positioning, color palette (from visual inspection), and typography if publicly documented.

OUTPUT: Return ONLY valid JSON. No markdown, no code blocks.

RESEARCH STEPS:
1. Search: "[Brand] brand story", "[Brand] brand colors palette", "[Brand] font typeface", "[Brand] brand guidelines", "[Brand] target audience", "[Brand] about us"
2. Fetch and analyze the brand URL — note the visual style, copy tone, colors visible on screen, who they seem to be speaking to
3. Search 2–3 competitors to understand positioning

Return this exact JSON (use null for fields you genuinely cannot find — do not guess):

{
  "name": "Brand name",
  "tagline": "Brand tagline or null",
  "brand_story": "1-2 sentence brand origin or mission story, or null",
  "target_audience": "Who the brand is for — demographics, lifestyle, needs. e.g. 'Health-conscious women 25-40 who value clean ingredients' or null",
  "brand_personality": "Brand personality in 1-2 sentences — how it acts, speaks, feels. e.g. 'Premium but approachable, speaks to aspirational simplicity' or null",
  "voice_adjectives": ["adj1", "adj2", "adj3", "adj4", "adj5"],
  "positioning": "1-2 sentence positioning or null",
  "competitive_differentiation": "How this brand differs from competitors or null",
  "customer_desires": ["3-5 short phrases describing what the ICP deeply wants — emotional/functional desires, not product features. e.g. 'effortless kitchen', 'look like a pro at home', 'save time on weeknights'"],
  "primary_font": "Font name if publicly documented or null",
  "secondary_font": "Secondary font name or null",
  "accent_color": "#hexcode for brand accent/CTA color or null",
  "lettertype_color": "#hexcode for primary text/font color or null",
  "background_color": "#hexcode for primary background color or null"
}
`;async function s(e,r,t){let o=n(),s=(await o.responses.create({model:"gpt-4o",instructions:a,input:`Research this brand:

Brand Name: ${e}
Brand URL: ${r}

Search extensively. Return the JSON only.`,tools:[{type:"web_search_preview"}]})).output.filter(e=>"message"===e.type).flatMap(e=>"message"===e.type?e.content.filter(e=>"output_text"===e.type).map(e=>"output_text"===e.type?e.text:""):[]).join("");if(!s)throw Error("No response from OpenAI.");let i=JSON.parse(s.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim());if(Array.isArray(i.voice_adjectives)||(i.voice_adjectives=[]),Array.isArray(i.customer_desires)||(i.customer_desires=[]),Array.isArray(i.hook_examples)||(i.hook_examples=[]),i.language||(i.language="English"),t)for(let[e,r]of Object.entries(t))null==r||""===r||Array.isArray(r)&&0===r.length||(i[e]=r);return i}}};var r=require("../../../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),o=r.X(0,[948,972,214],()=>t(4386));module.exports=o})();
"use strict";(()=>{var e={};e.id=264,e.ids=[264],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},8791:e=>{e.exports=require("https")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},1721:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>h,patchFetch:()=>b,requestAsyncStorage:()=>m,routeModule:()=>p,serverHooks:()=>g,staticGenerationAsyncStorage:()=>f});var a={};t.r(a),t.d(a,{PATCH:()=>c,POST:()=>u});var n=t(9303),o=t(8716),s=t(3131),i=t(7070),d=t(5662),l=t(9678);async function u(e,{params:r}){let{id:t}=await r,a=(await e.json().catch(()=>({}))).manual??{},n=(0,d.bQ)(),{data:o,error:s}=await n.from("brands").select("*").eq("id",t).single();if(s||!o)return i.NextResponse.json({error:"Brand not found"},{status:404});if(!o.url)return i.NextResponse.json({error:"Brand URL is required for research"},{status:400});try{let e=await (0,l.B)(o.name,o.url,a);await n.from("brand_dna").delete().eq("brand_id",t);let{data:r,error:s}=await n.from("brand_dna").insert({brand_id:t,data:e}).select().single();if(s)throw Error(s.message);return i.NextResponse.json({brand_dna:r})}catch(r){let e=r instanceof Error?r.message:String(r);return i.NextResponse.json({error:e},{status:500})}}async function c(e,{params:r}){let t;let{id:a}=await r,n=await e.json(),o=(0,d.bQ)(),{data:s}=await o.from("brand_dna").select("*").eq("brand_id",a).order("generated_at",{ascending:!1}).limit(1).maybeSingle(),l={...s?.data??{},...n};if(s){let{data:e,error:r}=await o.from("brand_dna").update({data:l,generated_at:new Date().toISOString()}).eq("id",s.id).select().single();if(r)return i.NextResponse.json({error:r.message},{status:500});t=e}else{let{data:e,error:r}=await o.from("brand_dna").insert({brand_id:a,data:l}).select().single();if(r)return i.NextResponse.json({error:r.message},{status:500});t=e}return i.NextResponse.json({brand_dna:t})}let p=new n.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/brands/[id]/research/route",pathname:"/api/brands/[id]/research",filename:"route",bundlePath:"app/api/brands/[id]/research/route"},resolvedPagePath:"/home/runner/work/static-ad-generator/static-ad-generator/app/api/brands/[id]/research/route.ts",nextConfigOutput:"standalone",userland:a}),{requestAsyncStorage:m,staticGenerationAsyncStorage:f,serverHooks:g}=p,h="/api/brands/[id]/research/route";function b(){return(0,s.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:f})}},9678:(e,r,t)=>{t.d(r,{$:()=>n,B:()=>s});var a=t(4214);function n(){if(!process.env.OPENAI_API_KEY)throw Error("OPENAI_API_KEY environment variable is not set.");return new a.ZP({apiKey:process.env.OPENAI_API_KEY})}let o=`
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
`;async function s(e,r,t){let a=n(),s=(await a.responses.create({model:"gpt-4o",instructions:o,input:`Research this brand:

Brand Name: ${e}
Brand URL: ${r}

Search extensively. Return the JSON only.`,tools:[{type:"web_search_preview"}]})).output.filter(e=>"message"===e.type).flatMap(e=>"message"===e.type?e.content.filter(e=>"output_text"===e.type).map(e=>"output_text"===e.type?e.text:""):[]).join("");if(!s)throw Error("No response from OpenAI.");let i=JSON.parse(s.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim());if(Array.isArray(i.voice_adjectives)||(i.voice_adjectives=[]),Array.isArray(i.customer_desires)||(i.customer_desires=[]),Array.isArray(i.hook_examples)||(i.hook_examples=[]),i.language||(i.language="English"),t)for(let[e,r]of Object.entries(t))null==r||""===r||Array.isArray(r)&&0===r.length||(i[e]=r);return i}},5662:(e,r,t)=>{t.d(r,{Lb:()=>i,bQ:()=>o,sX:()=>s});var a=t(7857);function n(e){let r=process.env[e];if(!r)throw Error(`Missing required env var: ${e}`);return r}function o(){return(0,a.eI)(n("NEXT_PUBLIC_SUPABASE_URL"),n("SUPABASE_SERVICE_ROLE_KEY"),{auth:{persistSession:!1}})}async function s(e,r,t,a){let n=o(),{error:s}=await n.storage.from(e).upload(r,t,{contentType:a,upsert:!0});if(s)throw Error(`Storage upload failed: ${s.message}`);let{data:i}=n.storage.from(e).getPublicUrl(r);return i.publicUrl}async function i(e,r){let t=o(),{data:a,error:n}=await t.storage.from(e).list(r);return n||!a?[]:a.filter(e=>e.name&&!e.name.startsWith(".")).map(a=>{let{data:n}=t.storage.from(e).getPublicUrl(`${r}/${a.name}`);return n.publicUrl})}t(7721)}};var r=require("../../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),a=r.X(0,[948,972,721,214],()=>t(1721));module.exports=a})();
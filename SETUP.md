# SequenceFlow — Static Ad Generator Setup

## 1. Supabase Setup

### Database
1. Go to your Supabase project → SQL Editor
2. Paste and run the contents of `supabase/schema.sql`

### Storage Buckets
In Supabase → Storage → New Bucket, create two **public** buckets:
- `product-images`
- `generated-ads`

### API Keys
Go to Supabase → Project Settings → API. Copy:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

Required keys:
| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `OPENAI_API_KEY` | platform.openai.com |
| `KIE_API_KEY` | kie.ai/api-key |

---

## 3. Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## 4. Hostinger Deployment

1. Push code to GitHub (all env files are gitignored)
2. In Hostinger control panel, set all 5 environment variables
3. Connect GitHub repo — Hostinger will auto-deploy on push
4. Build command: `npm run build`
5. Start command: `npm run start`

---

## How the Pipeline Works

### Phase 1 — Brand Research
- Enter brand name + URL
- Click **Research Brand** — OpenAI web search reverse-engineers the brand's visual identity
- Generates a Brand DNA document (editable before Phase 2)
- Takes ~60 seconds

### Phase 2 — Prompt Generation
- Enter the specific product name
- Click **Generate Prompts** — GPT-4o fills all 5 ad template placeholders using the Brand DNA
- Review prompts before running Phase 3
- Takes ~30 seconds

### Phase 3 — Image Generation
- Upload 1–3 product reference photos (optional but recommended)
- Select which templates to run
- Choose resolution: 1K (test/cheap) · 2K (production) · 4K (premium)
- Click **Generate Ads** — kie.ai generates 4 images per template
- Live progress streamed to browser
- All images saved to Supabase Storage
- Takes 1–5 minutes depending on template count

### Cost Reference
| Resolution | Per image | 5 templates × 4 images |
|---|---|---|
| 1K | ~$0.08 | ~$1.60 |
| 2K | ~$0.12 | ~$2.40 |
| 4K | ~$0.16 | ~$3.20 |

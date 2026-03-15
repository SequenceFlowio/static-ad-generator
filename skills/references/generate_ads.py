#!/usr/bin/env python3
"""
SequenceFlow Static Ad Generator — Phase 3 Image Generation Script
Reads prompts.json from the brand folder, fires each prompt to Nano Banana 2
via the FAL API, and downloads results into organized output folders.

Usage:
    python generate_ads.py
    python generate_ads.py --templates 1,3,5
    python generate_ads.py --resolution 1K
    python generate_ads.py --templates 1,2 --resolution 2K
"""

import argparse
import json
import os
import sys
import time
import requests
from pathlib import Path
from datetime import datetime


# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────

FAL_KEY = os.environ.get("FAL_KEY", "")
FAL_BASE = "https://fal.run"
TEXT_TO_IMAGE_MODEL = "fal-ai/nano-banana-2"
EDIT_MODEL = "fal-ai/nano-banana-2/edit"
IMAGES_PER_PROMPT = 4
DEFAULT_RESOLUTION = "2K"

COST_PER_IMAGE = {
    "0.5K": 0.04,
    "1K": 0.08,
    "2K": 0.12,
    "4K": 0.16,
}


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def check_env():
    if not FAL_KEY:
        print("\n[ERROR] FAL_KEY environment variable is not set.")
        print("  Run: export FAL_KEY=\"your-key-here\"")
        sys.exit(1)

def get_headers():
    return {
        "Authorization": f"Key {FAL_KEY}",
        "Content-Type": "application/json",
    }

def load_prompts(brand_folder: Path) -> dict:
    prompts_path = brand_folder / "prompts.json"
    if not prompts_path.exists():
        print(f"\n[ERROR] prompts.json not found at {prompts_path}")
        print("  Run Phase 2 first to generate prompts.")
        sys.exit(1)
    with open(prompts_path) as f:
        return json.load(f)

def get_product_image_paths(brand_folder: Path) -> list:
    images_dir = brand_folder / "product-images"
    if not images_dir.exists():
        return []
    extensions = {".png", ".jpg", ".jpeg", ".webp"}
    return [p for p in images_dir.iterdir() if p.suffix.lower() in extensions]

def upload_image_to_fal(image_path: Path) -> str:
    """Upload a local image to FAL storage and return a public URL."""
    print(f"  Uploading {image_path.name} to FAL storage...")
    with open(image_path, "rb") as f:
        files = {"file": (image_path.name, f, "image/png")}
        response = requests.post(
            "https://fal.run/fal-ai/storage/upload/image",
            headers={"Authorization": f"Key {FAL_KEY}"},
            files=files,
        )
    if response.status_code != 200:
        print(f"  [WARN] Failed to upload {image_path.name}: {response.text}")
        return None
    data = response.json()
    url = data.get("url") or data.get("image_url")
    print(f"  Uploaded → {url}")
    return url

def upload_all_product_images(brand_folder: Path) -> list:
    """Upload all product images and return list of public URLs."""
    local_paths = get_product_image_paths(brand_folder)
    if not local_paths:
        return []
    print(f"\nUploading {len(local_paths)} product image(s) to FAL storage...")
    urls = []
    for path in local_paths[:14]:  # FAL edit endpoint max 14 images
        url = upload_image_to_fal(path)
        if url:
            urls.append(url)
    return urls

def call_fal_text_to_image(prompt: str, aspect_ratio: str, resolution: str) -> list:
    """Call the standard text-to-image endpoint. Returns list of image URLs."""
    payload = {
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "num_images": IMAGES_PER_PROMPT,
        "output_format": "png",
        "resolution": resolution,
    }
    response = requests.post(
        f"{FAL_BASE}/{TEXT_TO_IMAGE_MODEL}",
        headers=get_headers(),
        json=payload,
        timeout=120,
    )
    if response.status_code != 200:
        raise Exception(f"FAL API error {response.status_code}: {response.text}")
    data = response.json()
    return [img["url"] for img in data.get("images", [])]

def call_fal_edit(prompt: str, aspect_ratio: str, resolution: str, image_urls: list) -> list:
    """Call the image-reference (edit) endpoint. Returns list of image URLs."""
    payload = {
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "num_images": IMAGES_PER_PROMPT,
        "output_format": "png",
        "resolution": resolution,
        "image_urls": image_urls,
    }
    response = requests.post(
        f"{FAL_BASE}/{EDIT_MODEL}",
        headers=get_headers(),
        json=payload,
        timeout=180,
    )
    if response.status_code != 200:
        raise Exception(f"FAL API error {response.status_code}: {response.text}")
    data = response.json()
    return [img["url"] for img in data.get("images", [])]

def download_image(url: str, dest_path: Path):
    """Download an image from a URL to a local path."""
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(dest_path, "wb") as f:
        f.write(response.content)

def save_prompt_txt(prompt_text: str, folder: Path):
    with open(folder / "prompt.txt", "w") as f:
        f.write(prompt_text)

def estimate_cost(num_prompts: int, resolution: str) -> float:
    cost_per = COST_PER_IMAGE.get(resolution, 0.12)
    return num_prompts * IMAGES_PER_PROMPT * cost_per

def print_banner(brand: str, product: str, num_prompts: int, resolution: str):
    cost = estimate_cost(num_prompts, resolution)
    print("\n" + "─" * 52)
    print(f"  SequenceFlow Static Ad Generator")
    print(f"  Brand:      {brand}")
    print(f"  Product:    {product}")
    print(f"  Templates:  {num_prompts}")
    print(f"  Resolution: {resolution}")
    print(f"  Images:     {num_prompts * IMAGES_PER_PROMPT} total")
    print(f"  Est. cost:  ~${cost:.2f}")
    print("─" * 52)

def generate_html_gallery(brand_folder: Path, brand_name: str, results: list):
    """Generate an index.html gallery of all generated ads."""
    outputs_dir = brand_folder / "outputs"
    html_lines = [
        "<!DOCTYPE html><html><head>",
        f"<title>{brand_name} — Ad Gallery</title>",
        "<style>",
        "body { font-family: Arial, sans-serif; background: #f9f9f7; color: #1a1a1a; padding: 32px; }",
        "h1 { font-size: 24px; margin-bottom: 4px; }",
        ".meta { color: #888; font-size: 13px; margin-bottom: 32px; }",
        ".template { margin-bottom: 48px; }",
        ".template h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; border-bottom: 2px solid #C7F56F; padding-bottom: 6px; }",
        ".grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }",
        ".grid img { width: 100%; border-radius: 8px; border: 1px solid #e0e0dc; }",
        ".prompt-text { font-size: 11px; color: #aaa; margin-top: 8px; font-family: monospace; white-space: pre-wrap; word-break: break-word; max-height: 80px; overflow: hidden; }",
        "</style></head><body>",
        f"<h1>{brand_name} — Static Ad Gallery</h1>",
        f"<p class='meta'>Generated {datetime.now().strftime('%Y-%m-%d %H:%M')} · {len(results)} templates</p>",
    ]

    for result in results:
        folder_name = f"{result['template_number']:02d}-{result['template_name']}"
        prompt_text = result.get("prompt", "")[:300]
        image_files = sorted((outputs_dir / folder_name).glob("*.png"))

        html_lines.append(f"<div class='template'>")
        html_lines.append(f"<h2>Template {result['template_number']} — {result['template_name'].replace('-', ' ').title()}</h2>")
        html_lines.append("<div class='grid'>")
        for img in image_files:
            rel_path = img.relative_to(brand_folder)
            html_lines.append(f"<img src='{rel_path}' loading='lazy' />")
        html_lines.append("</div>")
        html_lines.append(f"<div class='prompt-text'>{prompt_text}...</div>")
        html_lines.append("</div>")

    html_lines.append("</body></html>")

    gallery_path = brand_folder / "index.html"
    with open(gallery_path, "w") as f:
        f.write("\n".join(html_lines))
    return gallery_path


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="SequenceFlow Ad Generator — Phase 3")
    parser.add_argument("--templates", type=str, default=None,
                        help="Comma-separated template numbers to run (e.g. 1,3,5). Default: all.")
    parser.add_argument("--resolution", type=str, default=DEFAULT_RESOLUTION,
                        choices=["0.5K", "1K", "2K", "4K"],
                        help="Image resolution. Default: 2K")
    args = parser.parse_args()

    check_env()

    # Detect brand folder (script runs from inside the brand folder)
    brand_folder = Path.cwd()
    prompts_data = load_prompts(brand_folder)

    brand_name = prompts_data.get("brand", "Unknown Brand")
    product_name = prompts_data.get("product", "Unknown Product")
    all_prompts = prompts_data.get("prompts", [])

    # Filter by --templates if specified
    if args.templates:
        selected_nums = {int(n.strip()) for n in args.templates.split(",")}
        prompts_to_run = [p for p in all_prompts if p["template_number"] in selected_nums]
        if not prompts_to_run:
            print(f"\n[ERROR] No templates found matching: {args.templates}")
            sys.exit(1)
    else:
        prompts_to_run = all_prompts

    print_banner(brand_name, product_name, len(prompts_to_run), args.resolution)
    print("\nProceed? (y/n): ", end="")
    if input().strip().lower() != "y":
        print("Aborted.")
        sys.exit(0)

    # Upload product images once (reuse URLs for all product-reference templates)
    product_image_urls = []
    needs_product_refs = any(p.get("needs_product_images", False) for p in prompts_to_run)
    if needs_product_refs:
        product_image_urls = upload_all_product_images(brand_folder)
        if not product_image_urls:
            print("\n[WARN] No product images found in product-images/ folder.")
            print("       Templates with needs_product_images: true will use text-to-image instead.")

    # Run generation
    outputs_dir = brand_folder / "outputs"
    outputs_dir.mkdir(exist_ok=True)
    results = []
    total = len(prompts_to_run)

    for i, prompt_item in enumerate(prompts_to_run, 1):
        num = prompt_item["template_number"]
        name = prompt_item["template_name"]
        prompt_text = prompt_item["prompt"]
        aspect_ratio = prompt_item.get("aspect_ratio", "4:5")
        needs_product = prompt_item.get("needs_product_images", False)

        folder_name = f"{num:02d}-{name}"
        output_folder = outputs_dir / folder_name
        output_folder.mkdir(parents=True, exist_ok=True)

        print(f"\n[{i}/{total}] Template {num} — {name}")
        print(f"  Aspect ratio: {aspect_ratio} | Product images: {needs_product} | Resolution: {args.resolution}")

        try:
            start = time.time()

            if needs_product and product_image_urls:
                print(f"  Calling /edit with {len(product_image_urls)} reference image(s)...")
                image_urls = call_fal_edit(prompt_text, aspect_ratio, args.resolution, product_image_urls)
            else:
                print(f"  Calling text-to-image...")
                image_urls = call_fal_text_to_image(prompt_text, aspect_ratio, args.resolution)

            elapsed = time.time() - start
            print(f"  Generated {len(image_urls)} images in {elapsed:.1f}s")

            # Download images
            for j, url in enumerate(image_urls, 1):
                dest = output_folder / f"v{j}.png"
                download_image(url, dest)
                print(f"  Saved: {dest.relative_to(brand_folder)}")

            # Save prompt text alongside images
            save_prompt_txt(prompt_text, output_folder)

            results.append({
                "template_number": num,
                "template_name": name,
                "prompt": prompt_text,
                "images": len(image_urls),
                "folder": str(output_folder.relative_to(brand_folder)),
            })

        except Exception as e:
            print(f"  [ERROR] Template {num} failed: {e}")
            results.append({
                "template_number": num,
                "template_name": name,
                "error": str(e),
            })

    # Generate gallery
    print("\nGenerating HTML gallery...")
    gallery_path = generate_html_gallery(brand_folder, brand_name, results)

    # Summary
    successful = [r for r in results if "error" not in r]
    failed = [r for r in results if "error" in r]
    total_images = sum(r.get("images", 0) for r in successful)
    actual_cost = estimate_cost(len(successful), args.resolution)

    print("\n" + "─" * 52)
    print(f"  Done!")
    print(f"  Completed: {len(successful)}/{total} templates")
    print(f"  Images:    {total_images} total")
    print(f"  Cost:      ~${actual_cost:.2f}")
    print(f"  Gallery:   {gallery_path}")
    if failed:
        print(f"\n  Failed templates: {[r['template_number'] for r in failed]}")
    print("─" * 52 + "\n")

    if gallery_path.exists():
        print(f"Open gallery: open {gallery_path}\n")


if __name__ == "__main__":
    main()

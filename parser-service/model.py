import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

# ── Configure Gemini ───────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("❌ GEMINI_API_KEY not found. Check your .env file.")

genai.configure(api_key=GEMINI_API_KEY)

# ── Model setup ────────────────────────────────────────────
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash-lite",   # free tier, highest RPD (1000/day)
    generation_config=genai.GenerationConfig(
        temperature=0,                     # deterministic — critical for JSON
        max_output_tokens=4096,            # enough for full resume
        response_mime_type="application/json",  # guarantees valid JSON output
    )
)


# ── Main function called from main.py ──────────────────────
def call_gemini(prompt: str) -> str:
    try:
        print("🤖 Calling Gemini API (gemini-2.5-flash-lite)...")

        response = model.generate_content(prompt)

        result = response.text
        print(f"✅ Gemini responded. Length: {len(result)} chars")
        print(f"📄 Preview: {result[:200]}")

        return result

    except Exception as e:
        error_msg = str(e)
        print(f"❌ Gemini API error: {error_msg}")

        # Return structured error so main.py handles it gracefully
        return json.dumps({"error": f"Gemini API error: {error_msg}"})
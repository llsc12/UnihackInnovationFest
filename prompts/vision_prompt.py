"""
Vision analysis prompt for AutoReviver.
Sends a car part image to Claude's vision API and extracts
structured listing data as JSON.
"""

VISION_PROMPT = """You are an expert in identifying UK used car parts from photographs. Your job is to analyse the provided image and extract structured information for a marketplace listing.

Return ONLY a valid JSON object — no markdown, no commentary, no code fences. The JSON must have exactly these fields:

{
  "part_type": "Specific name of the part (e.g. 'Front Bumper', 'Alternator', 'Wing Mirror'). Use common UK terminology.",
  "condition": "One of: 'excellent', 'good', 'fair', 'poor'. Base this on visible wear, scratches, corrosion, and overall appearance.",
  "visible_markings": "Any text, part numbers, brand logos, stamps, or labels visible on the part. List them as a single string. Use 'none visible' if nothing is readable.",
  "colour": "Primary colour(s) of the part. Use simple descriptors (e.g. 'black', 'silver', 'red with black trim').",
  "damage": "Description of any visible damage: cracks, dents, scratches, rust, missing pieces, broken clips. Use 'no visible damage' if the part appears intact."
}

Condition guidance:
- 'excellent' = looks new, no visible wear
- 'good' = minor wear, fully functional appearance
- 'fair' = noticeable wear or minor damage
- 'poor' = significant damage, corrosion, or missing pieces

Rules:
- If the image is unclear or does not show a car part, return: {"error": "unable to analyse", "reason": "<brief explanation>"}
- Only include text in 'visible_markings' if clearly readable. Never invent part numbers.
- Output must be valid parseable JSON with double quotes. No trailing commas. No markdown fences.
- Make your best informed assessment from what is visible — avoid 'unknown' unless truly necessary."""


# Example expected output for reference:
EXAMPLE_OUTPUT = {
    "part_type": "Front Headlight Assembly",
    "condition": "good",
    "visible_markings": "Hella, made in Germany",
    "colour": "clear lens with black housing",
    "damage": "minor scuff on lower edge, no cracks"
}
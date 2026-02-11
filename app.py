"""
Optional Flask app to serve all teaching demos from a single landing page.
Run with: python app.py
"""

import os
from flask import Flask, send_from_directory, render_template_string

app = Flask(__name__)

DEMOS_DIR = os.path.join(os.path.dirname(__file__), "demos")

LANDING_PAGE = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Teaching Demos</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #0d1117; color: #e6edf3; min-height: 100vh; padding: 2rem; }
  .container { max-width: 800px; margin: 0 auto; }
  h1 { font-size: 2rem; margin-bottom: 0.3rem; }
  .subtitle { color: #7d8590; margin-bottom: 2rem; font-size: 1.05rem; }
  .demo-grid { display: grid; gap: 1rem; }
  .demo-card {
    background: #161b22; border: 1px solid #30363d; border-radius: 10px;
    padding: 1.5rem; text-decoration: none; color: inherit;
    transition: border-color 0.2s, transform 0.15s;
  }
  .demo-card:hover { border-color: #58a6ff; transform: translateY(-2px); }
  .demo-card h2 { font-size: 1.2rem; color: #58a6ff; margin-bottom: 0.4rem; }
  .demo-card p { color: #7d8590; font-size: 0.95rem; line-height: 1.5; }
  .tag { display: inline-block; font-size: 0.75rem; padding: 2px 8px; border-radius: 12px;
         background: #1a3050; color: #58a6ff; margin-right: 6px; margin-bottom: 8px; }
  .footer { margin-top: 3rem; color: #484f58; font-size: 0.85rem; text-align: center; }
  .footer a { color: #58a6ff; text-decoration: none; }
</style>
</head>
<body>
<div class="container">
  <h1>Teaching Demos</h1>
  <p class="subtitle">Interactive visualizations for engineering and science education</p>
  <div class="demo-grid">
    {% for demo in demos %}
    <a class="demo-card" href="/demos/{{ demo.slug }}/">
      <div>
        {% for tag in demo.tags %}<span class="tag">{{ tag }}</span>{% endfor %}
      </div>
      <h2>{{ demo.title }}</h2>
      <p>{{ demo.description }}</p>
    </a>
    {% endfor %}
  </div>
  <p class="footer">
    Built for workshops with <a href="https://claude.ai/claude-code">Claude Code</a>.
    Each demo is a single HTML file &mdash; view source to see the code.
  </p>
</div>
</body>
</html>
"""

# Demo metadata — add new demos here
DEMOS = [
    {
        "slug": "feedback-control",
        "title": "Feedback Control: Depth Tracking",
        "description": "Proportional control of an underwater robot. Adjust gain, mass, and drag to explore overshoot, damping, and rise time. Based on HMC E79.",
        "tags": ["Controls", "2nd Order Systems", "Interactive"],
    },
]


@app.get("/")
def index():
    return render_template_string(LANDING_PAGE, demos=DEMOS)


@app.get("/demos/<path:filepath>")
def serve_demo(filepath):
    # If path is a directory (ends with / or no extension), serve index.html
    full_path = os.path.join(DEMOS_DIR, filepath)
    if os.path.isdir(full_path):
        return send_from_directory(full_path, "index.html")
    # Otherwise serve the file directly
    directory = os.path.join(DEMOS_DIR, os.path.dirname(filepath))
    filename = os.path.basename(filepath)
    return send_from_directory(directory, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)

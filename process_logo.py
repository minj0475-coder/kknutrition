import os
import io
import glob
from rembg import remove
from PIL import Image

input_path = r"C:\Users\jryoo\Desktop\ChatGPT Image 2026-06-14 at 18_06_54.png"
# wait, the filename has korean characters maybe?
# I'll just glob the newest png on Desktop
input_files = glob.glob(r"C:\Users\jryoo\Desktop\ChatGPT Image*.png")
input_path = max(input_files, key=os.path.getmtime)

output_path = r"C:\Users\jryoo\.gemini\antigravity\scratch\kknutrition\assets\images\new_brand_logo.png"

print(f"Processing {input_path}...")
try:
    with open(input_path, 'rb') as f:
        input_bytes = f.read()
    output_bytes = remove(input_bytes)
    with open(output_path, 'wb') as f:
        f.write(output_bytes)
    print("Logo processed successfully!")
except Exception as e:
    print(f"Error: {e}")

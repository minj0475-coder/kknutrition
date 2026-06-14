import os
import io
import glob
from rembg import remove
from PIL import Image

input_dir = r"C:\Users\jryoo\Desktop\kkul_images"
output_dir = r"C:\Users\jryoo\.gemini\antigravity\scratch\kknutrition\assets\images\kkul"

os.makedirs(output_dir, exist_ok=True)
images = glob.glob(os.path.join(input_dir, "*.png"))

print(f"Found {len(images)} images to process.")

for idx, img_path in enumerate(images, start=1):
    out_name = f"kkul_{idx}.png"
    out_path = os.path.join(output_dir, out_name)
    
    print(f"Processing {idx}/{len(images)}: {os.path.basename(img_path)} -> {out_name}")
    try:
        # Load image
        with open(img_path, 'rb') as f:
            input_bytes = f.read()
            
        # Remove background
        output_bytes = remove(input_bytes)
        
        # Save output
        with open(out_path, 'wb') as f:
            f.write(output_bytes)
    except Exception as e:
        print(f"Failed to process {img_path}: {e}")

print("All images processed successfully!")

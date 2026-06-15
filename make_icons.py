from PIL import Image, ImageDraw

def make_rounded_icon(size, border_width, radius):
    # Open original
    try:
        orig = Image.open(f"assets/app-icon-{size}.png").convert("RGBA")
    except:
        orig = Image.open(f"assets/app-icon-512.png").convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)
        
    # Create mask
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size-1, size-1), radius=radius, fill=255)
    
    # Apply mask
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(orig, (0, 0), mask)
    
    # Draw border
    border_color = (240, 222, 212, 255) # #f0ded4
    border_overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    border_draw = ImageDraw.Draw(border_overlay)
    
    # Draw a thick rounded rectangle outline
    border_draw.rounded_rectangle((border_width//2, border_width//2, size-1-border_width//2, size-1-border_width//2), radius=radius - border_width//2, outline=border_color, width=border_width)
    
    # Combine
    final = Image.alpha_composite(out, border_overlay)
    final.save(f"assets/app-icon-{size}.png")

make_rounded_icon(512, 12, 158)
make_rounded_icon(192, 5, 59)
make_rounded_icon(180, 4, 56)

print("Icons generated!")

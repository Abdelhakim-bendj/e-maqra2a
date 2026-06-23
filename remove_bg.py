from PIL import Image

def remove_background(input_path, output_path, tolerance=50):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    # Get the background color from the top-left pixel (0,0)
    bg_color = img.getpixel((0, 0))
    
    new_data = []
    for item in data:
        # Check if pixel is close to background color
        if (abs(item[0] - bg_color[0]) < tolerance and
            abs(item[1] - bg_color[1]) < tolerance and
            abs(item[2] - bg_color[2]) < tolerance):
            # Make transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    # The source file is "ChatGPT Image Jun 22, 2026, 07_12_37 AM.png"
    src = "ChatGPT Image Jun 22, 2026, 07_12_37 AM.png"
    # Overwrite the generated logo in frontend and mobile
    remove_background(src, "Frontend/src/assets/logo.png")
    remove_background(src, "Mobile_frontend/assets/images/logo.png")
    print("Background removed successfully!")

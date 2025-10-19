# Button Customization Guide

This guide shows you how to customize the undo and delete button icons.

## Method 1: Using Your Own Image Files

1. **Create an `images` folder** in your project
2. **Add your button icons** (e.g., `undo.png`, `delete.png`)
3. **Edit `custom-buttons.css`** and uncomment/modify:

```css
#undoBtn {
    background-image: url('images/undo.png');
    background-size: 60%;
    background-position: center;
    background-repeat: no-repeat;
}

#undoBtn .btn-icon {
    display: none;
}

#clearCanvas {
    background-image: url('images/delete.png');
    background-size: 60%;
    background-position: center;
    background-repeat: no-repeat;
}

#clearCanvas .btn-icon {
    display: none;
}
```

## Method 2: Using Custom SVG/Icon Fonts

Edit the `<img>` tags in `index.html`:

```html
<button id="undoBtn" class="icon-btn">
    <img src="images/your-undo-icon.svg" alt="undo" class="btn-icon" />
</button>
<button id="clearCanvas" class="icon-btn">
    <img src="images/your-delete-icon.svg" alt="delete" class="btn-icon" />
</button>
```

## Method 3: Using Icon Fonts (Font Awesome, Material Icons, etc.)

1. **Add the icon library** to `index.html`:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

2. **Replace the button content** in `index.html`:
```html
<button id="undoBtn" class="icon-btn">
    <i class="fas fa-undo"></i>
</button>
<button id="clearCanvas" class="icon-btn">
    <i class="fas fa-trash"></i>
</button>
```

## Customizing Button Appearance

Edit `custom-buttons.css` to change colors, sizes, shadows, etc.:

```css
.icon-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%; /* Make buttons circular */
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.icon-btn:hover {
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    transform: scale(1.1);
}
```

## Current Button Images

The app currently uses inline SVG icons. You can find them in `index.html` as data URLs in the `<img src="data:image/svg+xml...">` attributes.

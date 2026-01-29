# Mangia App Icons

## Final Design

The app icon features a **terracotta cooking pot with a tilted recipe card peeking out** - visually representing "recipes + cooking" in a simple, memorable way.

### Design Elements
- **Pot**: Warm terracotta gradient (#E8855A to #C65F2E)
- **Recipe card**: White/cream with sage green header bar
- **Ingredient bullets**: Sage green (#A8BCA0)
- **Steam wisps**: Dark editorial color (#3A322C)
- **Background**: Cream gradient (#FBF9F5 to #F5E3C1)

## Source Files

| File | Purpose |
|------|---------|
| `icon-final.svg` | Master icon design (1024x1024 viewBox) |
| `adaptive-foreground.svg` | Android adaptive icon foreground layer |
| `adaptive-background.svg` | Android adaptive icon background layer |

## Exported PNGs

All exports are in the `exports/` folder:

### iOS App Store & Device Icons
| Size | File | Usage |
|------|------|-------|
| 1024x1024 | `icon-1024.png` | App Store Connect |
| 180x180 | `icon-180.png` | iPhone @3x |
| 167x167 | `icon-167.png` | iPad Pro @2x |
| 152x152 | `icon-152.png` | iPad @2x |
| 120x120 | `icon-120.png` | iPhone @2x, Spotlight @3x |
| 87x87 | `icon-87.png` | Settings @3x |
| 80x80 | `icon-80.png` | Spotlight @2x |
| 76x76 | `icon-76.png` | iPad @1x |
| 60x60 | `icon-60.png` | Notifications @2x |
| 58x58 | `icon-58.png` | Settings @2x |
| 40x40 | `icon-40.png` | Spotlight @1x |
| 29x29 | `icon-29.png` | Settings @1x |
| 20x20 | `icon-20.png` | Notifications @1x |

### Android Play Store & Device Icons
| Size | File | Usage |
|------|------|-------|
| 512x512 | `icon-512.png` | Play Store listing |
| 192x192 | `icon-192.png` | xxxhdpi |
| 144x144 | `icon-144.png` | xxhdpi |
| 96x96 | `icon-96.png` | xhdpi |
| 72x72 | `icon-72.png` | hdpi |
| 48x48 | `icon-48.png` | mdpi |

### Android Adaptive Icon
| File | Usage |
|------|-------|
| `adaptive-foreground.png` | Foreground layer (432x432) |
| `adaptive-background.png` | Background layer (432x432) |

## Expo Assets (Updated)

The following files have been copied to `/assets/`:
- `icon.png` - Main app icon (1024x1024)
- `adaptive-icon.png` - Android adaptive foreground
- `splash-icon.png` - Splash screen icon (200x200)
- `favicon.png` - Web favicon (48x48)

## Regenerating Icons

If you need to regenerate the PNGs from the SVG source:

```bash
cd marketing/icons

# Main icon at all sizes
magick icon-final.svg -resize 1024x1024 exports/icon-1024.png

# Adaptive icons
magick adaptive-foreground.svg -resize 432x432 exports/adaptive-foreground.png
magick adaptive-background.svg -resize 432x432 exports/adaptive-background.png
```

## Brand Colors Reference

```css
--terracotta: #D97742;
--terracotta-light: #E8855A;
--terracotta-dark: #C65F2E;
--sage: #A8BCA0;
--sage-light: #B5CAAC;
--cream: #FBF9F5;
--cream-dark: #F5E3C1;
--editorial-dark: #3A322C;
```

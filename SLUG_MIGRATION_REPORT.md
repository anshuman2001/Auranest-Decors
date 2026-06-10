# Catalog → Product Page Deep-Link Migration Report

**Generated:** 2026-06-10

## Summary

- Total catalog products: **115**
- Products with valid slug: **115** (100%)
- All matched to CSV/Firestore by image URL: **✅ 111/111**
- Slug-collision variants (disambiguated by image): **41**

## Deep-Link URL Format

```
https://www.auranestdecors.com/store/?product=<slug>&v=<image-basename>
```

- `product` = human-readable slug (pretty URL)
- `v` = image basename — guarantees the *exact* product even when several variants share a slug

**Resolution order in store/index.html → openDeepLinkProduct():**
1. Match products by slug/id
2. If multiple share the slug, pick the one whose primary image === `v`
3. If slug matches nothing, fall back to matching purely by image

## QA Checklist — Every Catalog Product Opens Correct Page

- [ ] Catalog loads all 115 cards with no console errors
- [ ] Every "Shop Now" button has a `?product=...&v=...` href (no bare `/store/`)
- [ ] Clicking Shop Now opens the store with that exact product overlay
- [ ] No Shop Now redirects to homepage or collection page
- [ ] The 41 variant products (wind chimes / jharokha / bird planters) each open their OWN image, not a sibling's
- [ ] Product overlay shows correct name, image, price, Add to Cart
- [ ] Back button closes the product overlay (does not leave the site)
- [ ] Works on mobile browser (URL opens product overlay)
- [ ] Firestore products all have a `slug` field (set during CSV import)
- [ ] Prices fully removed from catalog cards (no ₹ / MRP / discount)

## Full Slug Map

| # | Product | Slug | Image | Variant |
|---|---|---|---|---|
| 1 | Handcrafted Terracotta Handi Set of 3 wi | `handcrafted-terracotta-handi-set-of-3-with-lid-2000ml-1500ml` | 61LIUAt9o6L.jpg |  |
| 2 | Handcrafted Terracotta Pot (Cooking Pot) | `product` | 616bjjrt1TL.jpg |  |
| 3 | Acacia Wood Chopping Board 14x12 Inch \| | `acacia-wood-chopping-board-14x12-inch-handmade-reversible-wo` | 61VG0SBi2cL.jpg |  |
| 4 | Wooden Chopping Board with Steel Handle, | `wooden-chopping-board-with-steel-handle-multipurpose-cutting` | 61dGkPA9HRL.jpg |  |
| 5 | Large Non-Slip Pine Wood Cutting Board w | `large-non-slip-pine-wood-cutting-board-with-antibacterial-su` | 71aeM-lWn8L.jpg |  |
| 6 | Wooden Chopping Board for Kitchen, Premi | `wooden-chopping-board-for-kitchen-premium-wooden-cutting-boa` | 71s7ykV70dL.jpg |  |
| 7 | Wooden Pizza Platter & Chopping Board 14 | `wooden-pizza-platter-chopping-board-14-17-inch-round-serving` | 616yJ9Od3NL.jpg |  |
| 8 | Wooden Serving & Cutting Board with Hand | `wooden-serving-cutting-board-with-handle-food-grade-eco-frie` | 711C1Fnzp5L.jpg |  |
| 9 | Wooden Bowl for Kitchen & Dining Use \|  | `wooden-bowl-for-kitchen-dining-use-multipurpose-serving-bowl` | 51f6OAvYwOL.jpg |  |
| 10 | Hand Painted Wooden Folk Art Pizza Platt | `hand-painted-wooden-folk-art-pizza-platter-decorative-choppi` | 61RBcJ69KqL.jpg |  |
| 11 | Wooden Pizza Serving Board for Kitchen U | `wooden-pizza-serving-board-for-kitchen-use-round-platter-for` | 61TL+GYJtEL.jpg |  |
| 12 | Terracotta Kullad Cups Set Couple mug (S | `terracotta-kulhad-set-for-tea-coffee-traditional-clay-cups-f` | 61MTTlrpObL.jpg | ⚠️ shared-slug |
| 13 | Terracotta Kulhad Set for Tea & Coffee,  | `terracotta-kulhad-set-for-tea-coffee-traditional-clay-cups-f-2` | 61MTTlrpObL.jpg | ⚠️ shared-slug |
| 14 | Wooden Coaster with Tree Bark Edge 3.9 I | `wooden-coaster-with-tree-bark-edge-3-9-inch-rustic-natural-e` | 71UBCDBZEjL.jpg |  |
| 15 | Handcrafted African Art Hand Painted Woo | `handcrafted-african-art-hand-painted-wooden-coaster-set-for-` | 71SIJZXBY1L.jpg |  |
| 16 | Ceramic Couple with Heart Showpiece for  | `ceramic-couple-with-heart-showpiece-for-home-decor-romantic-` | 51fhxWz-pZL.jpg |  |
| 17 | Ceramic Couple Showpiece for Home Decor, | `ceramic-couple-showpiece-for-home-decor-romantic-figurine-fo` | 41+NAyK9b2L.jpg |  |
| 18 | Ceramic Dinosaur Decorative Showpiece fo | `ceramic-dinosaur-decorative-showpiece-for-kids-room-unique-a` | 51lJe+z6TTL.jpg |  |
| 19 | Ceramic Elephant Showpiece for Home Deco | `ceramic-elephant-showpiece-for-home-decor-decorative-animal-` | 61sIpbgI+UL.jpg |  |
| 20 | Ceramic Yoga Pose Statue for Home Decor, | `ceramic-yoga-pose-statue-for-home-decor-meditation-showpiece` | 51mCyL6PFqL.jpg |  |
| 21 | Two Love Birds Decorative Showpiece for  | `auranest-d-cors-hand-painted-ceramic-planter-with-colorful-b` | 71k6pPEjZjL.jpg | ⚠️ shared-slug |
| 22 | Auranest Decprs Wooden Spatula Set of 7  | `natural-wooden-spoon-set-for-cooking-includes-frying-serving` | 71HDkfhid7L.jpg | ⚠️ shared-slug |
| 23 | Wooden Cooking Spatula for Kitchen Use,  | `wooden-cooking-spatula-for-kitchen-use-heat-resistant-ladle-` | 61ueId1OhUL.jpg |  |
| 24 | Sheesham Wood Spice Box with 2 Spoons –  | `sheesham-wood-spice-box-with-2-spoons-9-compartments-masala-` | 71Fag4z76EL.jpg |  |
| 25 | Sheesham Wooden Spice Box for Kitchen wi | `sheesham-wooden-spice-box-for-kitchen-with-spoon-12-partitio` | 715sWLE60XL.jpg |  |
| 26 | Wooden Spice Box with Glass Lid 12 Compa | `wooden-spice-box-with-glass-lid-12-compartment-masala-dabba-` | 618mVYoV37L.jpg | ⚠️ shared-slug |
| 27 | Wooden Spice Box with Glass Lid 12 Compa | `wooden-spice-box-with-glass-lid-12-compartment-masala-dabba--2` | 61MlAHlVYJL.jpg | ⚠️ shared-slug |
| 28 | Wooden Spice Box for Kitchen \| Sheesham | `wooden-spice-box-for-kitchen-sheesham-wood-masala-dabba-with` |  |  |
| 29 | Multipurpose Wooden Storage Container fo | `multipurpose-wooden-storage-container-for-kitchen-use-dry-fr` | 61O0ioatHJL.jpg |  |
| 30 | Wooden Spice Box with Detachable Contain | `wooden-spice-box-with-detachable-containers-and-spoon-transp` | 71hnnhOHHJL.jpg |  |
| 31 | 3 Tier Wooden Plant Stand for Indoor & O | `3-tier-wooden-plant-stand-for-indoor-outdoor-plants-multi-le` | 71vGglLfO3L.jpg |  |
| 32 | 3 Step Wooden Planter Stool 22 Inch \| M | `3-step-wooden-planter-stool-22-inch-multi-level-plant-stand-` | 61OJKJTLSML.jpg |  |
| 33 | Auranest Décors Hand-Painted Ceramic Pla | `auranest-d-cors-hand-painted-ceramic-planter-with-colorful-b-2` | 71k6pPEjZjL.jpg | ⚠️ shared-slug |
| 34 | Hand-Painted Ceramic Flower Planter, Dec | `ceramic-bird-shape-planter-for-indoor-plants-decorative-flow` | 61czTt+nYuL.jpg | ⚠️ shared-slug |
| 35 | Hand-Painted Ceramic Bowl Planter, Medit | `hand-painted-ceramic-bowl-planter-mediterranean-style-floral` | 51fZFiC7hmL.jpg |  |
| 36 | Hand-Painted Daily Tribal Life Ceramic P | `hand-painted-daily-tribal-life-ceramic-planter-traditional-f` | 618RHWodwrL.jpg |  |
| 37 | Bird on Tree Design Planter for Indoor P | `ceramic-bird-shape-planter-for-indoor-plants-decorative-flow-2` | 61czTt+nYuL.jpg | ⚠️ shared-slug |
| 38 | Black Artistic Planter for Indoor Plants | `black-artistic-planter-for-indoor-plants-modern-decorative-f` | 714tazm03LL.jpg |  |
| 39 | Black Buddha Statue for Home Decor, Medi | `black-buddha-statue-for-home-decor-meditation-showpiece-for-` | 51pkPPjDKRL.jpg |  |
| 40 | Blue Leaf Design Planter for Indoor Plan | `blue-leaf-design-planter-for-indoor-plants-decorative-cerami` | 61+NQ2H4jPL.jpg |  |
| 41 | Hand-Painted Ceramic Portrait Planter, T | `hand-painted-ceramic-portrait-planter-traditional-indian-fol` | 61mi80Ssc9L.jpg |  |
| 42 | Ceramic Bird Shape Planter for Indoor Pl | `ceramic-bird-shape-planter-for-indoor-plants-decorative-flow-3` | 61czTt+nYuL.jpg | ⚠️ shared-slug |
| 43 | AURANEST DECOR Handcrafted hand panted D | `auranest-decor-handcrafted-hand-panted-dice-shape-ceramic-pl` | 519M9wRCBrL.jpg |  |
| 44 | Girl with Peacock Design Planter for Ind | `hand-painted-ceramic-conical-planter-folk-art-peacock-and-fl` | 61WctEtPYaL.jpg | ⚠️ shared-slug |
| 45 | AAURANEST DECORS Hand-Painted Ceramic El | `aauranest-decors-hand-painted-ceramic-elephant-planter-pot-d` | 61Ljo+MqTDL.jpg |  |
| 46 | Decorative Lady Face Planter for Indoor  | `radiant-heritage-hand-painted-ceramic-planter` | 51Sj8v2GRIL.jpg | ⚠️ shared-slug |
| 47 | Lotus Shape Decorative Planter for Indoo | `lotus-shape-decorative-planter-for-indoor-plants-elegant-flo` | 71sEx+N8KLL.jpg |  |
| 48 | Hand-Painted Ceramic Planter Pot – Decor | `hand-painted-ceramic-planter-pot-decorative-indoor-plant-hol` | 611UVChWFZL.jpg |  |
| 49 | Nature-Inspired Handcrafted Deer painted | `nature-inspired-handcrafted-deer-painted-ceramic-planter` | 61oeksYNQVL.jpg |  |
| 50 | Hand-Painted Ceramic Planter with Twin B | `hand-painted-ceramic-planter-with-twin-bird-motif-decorative` | 617BkLCm+EL.jpg |  |
| 51 | Village Vows Hand-Painted Ceramic Plante | `village-vows-hand-painted-ceramic-planter` | 61ucDdrycML.jpg |  |
| 52 | Hand-Painted Ceramic Conical Planter, Fo | `hand-painted-ceramic-conical-planter-folk-art-peacock-and-fl-2` | 61WctEtPYaL.jpg | ⚠️ shared-slug |
| 53 | Hand-Painted Ceramic Planter, Traditiona | `hand-painted-ceramic-planter-traditional-warli-tribal-art-de` | 71pse45WpVL.jpg |  |
| 54 | Hanging Shelves - Adjustable Rope Hangin | `hanging-shelves-adjustable-rope-hanging-shelf-wall-hanging-d-3` |  | ⚠️ shared-slug |
| 55 | Pine Wood Setup Box Stand \| Set Top Box | `pine-wood-setup-box-stand-set-top-box-stand-wall-mount-for-h-3` |  | ⚠️ shared-slug |
| 56 | Pine Wood Setup Box Stand \| Set Top Box | `pine-wood-setup-box-stand-set-top-box-stand-wall-mount-for-h` | 51Ukk3QvbXL.jpg | ⚠️ shared-slug |
| 57 | Set of 4 Pine Wood Setup Box Stand \| Wa | `set-of-4-pine-wood-setup-box-stand-wall-mount-set-top-box-st` | 61B0Y2cHf1L.jpg |  |
| 58 | Pine Wood Setup Box Stand \| Set Top Box | `pine-wood-setup-box-stand-set-top-box-stand-wall-mount-for-h-2` | 51Ukk3QvbXL.jpg | ⚠️ shared-slug |
| 59 | Hanging Shelves - Adjustable Rope Hangin | `hanging-shelves-adjustable-rope-hanging-shelf-wall-hanging-d` | 515WQp4nJUL.jpg | ⚠️ shared-slug |
| 60 | Set of 4 Hanging Shelves – Adjustable Ro | `set-of-4-hanging-shelves-adjustable-rope-hanging-shelf-for-w` | 61lS2dIpvSL.jpg |  |
| 61 | Hanging Shelves - Adjustable Rope Hangin | `hanging-shelves-adjustable-rope-hanging-shelf-wall-hanging-d-2` | 61GWKODk8VL.jpg | ⚠️ shared-slug |
| 62 | Wooden Spatula set for Cooking,Kitchen U | `wooden-spatula-set-for-cooking-kitchen-utensils-set-natural-` | 7126SvLdS9L.jpg |  |
| 63 | Natural Wooden Spoon Set for Cooking Inc | `natural-wooden-spoon-set-for-cooking-includes-frying-serving-2` | 71HDkfhid7L.jpg | ⚠️ shared-slug |
| 64 | 2 Step Wooden Coffee Stool 12.5 Inch \|  | `round-foldable-wooden-stool-table-solid-acacia-wood-12-inch-` | 71ABHXt8UtL.jpg | ⚠️ shared-slug |
| 65 | Small Wooden Stool \| Multipurpose Sitti | `small-wooden-stool-multipurpose-sitting-stool-for-kids-footr` | 71mA7-sHCEL.jpg |  |
| 66 | Wood Stand Indoor Outdoor, Small Round W | `wood-stand-indoor-outdoor-small-round-wooden-stool-with-jute` | 71bzhFct9GL.jpg |  |
| 67 | hand-crafted hand panted Elephant Design | `hand-crafted-hand-panted-elephant-design-wooden-key-holder-w` | 61qOgtuO8TL.jpg |  |
| 68 | Striped Wooden Key Holder for Wall with  | `striped-wooden-key-holder-for-wall-with-hooks-decorative-key` | 61ZWowVCo1L.jpg | ⚠️ shared-slug |
| 69 | Striped Wooden Key Holder for Wall with  | `striped-wooden-key-holder-for-wall-with-hooks-decorative-key-2` | 61g87qUBj4L.jpg | ⚠️ shared-slug |
| 70 | Round Foldable Wooden Stool/Table – Soli | `round-foldable-wooden-stool-table-solid-acacia-wood-12-inch--2` | 71ABHXt8UtL.jpg | ⚠️ shared-slug |
| 71 | Wooden Serving Tray with Slats, Rectangu | `wooden-serving-tray-with-slats-rectangular-decorative-organi` | 61uePh2fT4L.jpg |  |
| 72 | Farming Theme Wooden Serving Tray for Te | `handcrafted-warli-art-wooden-tray-farming-scene-hand-painted` | 617Vv0B06YL.jpg | ⚠️ shared-slug |
| 73 | Set of 3 Wooden Serving Trays (38, 33, 2 | `set-of-3-wooden-serving-trays-38-33-28-cm-nesting-tea-snack-` | 71pvhIfcXvL.jpg |  |
| 74 | Oval Shape Curved Wooden Serving Tray 11 | `oval-shape-curved-wooden-serving-tray-11-inch-stylish-snack-` | 61HNq9kI9dL.jpg |  |
| 75 | Oval Wooden Serving Tray 10.4 Inch \| Co | `oval-wooden-serving-tray-10-4-inch-compact-tea-snack-tray-fo` | 612w-ROSmqL.jpg |  |
| 76 | Large Oval Wooden Serving Tray with Tree | `large-oval-wooden-serving-tray-with-tree-bark-edge-15-74-inc` | 51q2X2GR9kL.jpg |  |
| 77 | Round Wooden Serving Tray with Tree Bark | `round-wooden-serving-tray-with-tree-bark-edge-10-inch-rustic` | 71kHsB4LeKL.jpg |  |
| 78 | Wooden Rectangular Serving Tray 13 Inch  | `wooden-rectangular-serving-tray-13-inch-multipurpose-tea-sna` | 61OK8cZ7UWL.jpg |  |
| 79 | Wooden Heart Shape Serving Tray 10 Inch  | `wooden-heart-shape-serving-tray-10-inch-large-decorative-sna` | 61Kz7PUKpTL.jpg |  |
| 80 | Wooden Moon Shape Serving Tray 7 Inch \| | `wooden-moon-shape-serving-tray-7-inch-decorative-mini-snack-` | 61fSJ5uM-KL.jpg |  |
| 81 | Large Wooden anty-Bactirial BPA Free Rou | `large-wooden-anty-bactirial-bpa-free-round-serving-tray-for-` | 71LaZ0peYPL.jpg |  |
| 82 | Striped Wooden Rectangular Serving Tray  | `striped-wooden-rectangular-serving-tray-for-tea-snacks-decor` | 61uqhjmA+TL.jpg |  |
| 83 | Traditional Mithila art Wooden Serving T | `traditional-mithila-art-wooden-serving-tray-for-tea-snacks-h` | 61igRoQOlWL.jpg |  |
| 84 | Crafted Charm wooden Serving Trio Tray f | `crafted-charm-wooden-serving-trio-tray-for-tea-snacks-modern` | 71Icta9sG7L.jpg |  |
| 85 | Peacock Design Wooden Serving Tray for T | `peacock-design-wooden-serving-tray-for-tea-coffee-decorative` | 71S-1Kz7TXL.jpg |  |
| 86 | Wooden Serving Tray with Handles – Round | `wooden-serving-tray-with-handles-round-acacia-wood-tray-for-` | 712wqBrvsAL.jpg |  |
| 87 | Handcrafted Warli Art Wooden Tray – Farm | `handcrafted-warli-art-wooden-tray-farming-scene-hand-painted-2` | 617Vv0B06YL.jpg | ⚠️ shared-slug |
| 88 | Hand-Painted Wooden Bark Tray, Ethnic Tr | `hand-painted-wooden-bark-tray-ethnic-tribal-lady-portrait-ar` | 61MjIXmzdfL.jpg |  |
| 89 | Handcrafted Moon Shape Wooden Serving Tr | `handcrafted-moon-shape-wooden-serving-tray-for-tea-snacks-de` | 61IS0+rZaNL.jpg |  |
| 90 | Large Wooden Round Serving Tray with Han | `large-wooden-round-serving-tray-with-handles-multipurpose-te` | 71lKJOzEojL.jpg |  |
| 91 | Wooden Round Serving Tray with Handles \ | `wooden-round-serving-tray-with-handles-compact-tea-snack-tra` | 71nf7kH9dYL.jpg |  |
| 92 | Fish Design Wooden Serving Tray for Tea  | `fish-design-wooden-serving-tray-for-tea-snacks-decorative-ki` | 71OTAgmIJsL.jpg |  |
| 93 | Wooden Serving Tray with Lady Deer Desig | `wooden-serving-tray-with-lady-deer-design-decorative-tea-sna` | 615ZCYjvphL.jpg |  |
| 94 | Striped Wooden Serving Tray for Tea & Sn | `striped-wooden-serving-tray-for-tea-snacks-modern-kitchen-tr` | 719ZM79mapL.jpg |  |
| 95 | Wooden Serving Tray for Tea & Snacks, De | `wooden-serving-tray-for-tea-snacks-decorative-kitchen-tray-f` | 61lhI9Vsg4L.jpg |  |
| 96 | Hand-Painted African Art Woman black Cer | `hand-painted-african-art-woman-black-ceramic-planter-hand-cr` | 51m6lfvAqIL.jpg |  |
| 97 | Radiant Heritage Hand-Painted Ceramic Pl | `radiant-heritage-hand-painted-ceramic-planter-2` | 51Sj8v2GRIL.jpg | ⚠️ shared-slug |
| 98 | Royal Jhumka Hand-Painted Ceramic Plante | `royal-jhumka-hand-painted-ceramic-planter-mughal-inspired-ta` | 61RFOvNK6dL.jpg |  |
| 99 | Ceramic Wall Decor Plate with Cow Design | `ceramic-wall-decor-plate-with-cow-design-artistic-hanging-pl` | 613lk1qjMPL.jpg | ⚠️ shared-slug |
| 100 | Ceramic Wall Decor Plate with Cow Design | `ceramic-wall-decor-plate-with-cow-design-artistic-hanging-pl-2` | 614W-k15GBL.jpg | ⚠️ shared-slug |
| 101 | Ceramic Decorative Wall Plate with Yello | `ceramic-decorative-wall-plate-with-yellow-cow-design-artisti` | 61aY98yPAkL.jpg |  |
| 102 | Ceramic Wall Decor Plate with Cow Design | `ceramic-wall-decor-plate-with-cow-design-artistic-hanging-pl-3` |  | ⚠️ shared-slug |
| 103 | Wooden Handpainted Copper Finish Jharokh | `wooden-handpainted-copper-finish-jharokha-traditional-jaipur` | 61UcYDMRfpL.jpg |  |
| 104 | Wooden Jharokha Wall Decor Frame \| Trad | `wooden-jharokha-wall-decor-frame-traditional-indian-window-s` | 611sf5IJc5L.jpg | ⚠️ shared-slug |
| 105 | Wooden Jharokha Wall Decor Frame \| Trad | `wooden-jharokha-wall-decor-frame-traditional-indian-window-s-2` | 51taAym5QsL.jpg | ⚠️ shared-slug |
| 106 | Wooden Jharokha Wall Decor Frame \| Trad | `wooden-jharokha-wall-decor-frame-traditional-indian-window-s-3` | 61EsiHY0ASL.jpg | ⚠️ shared-slug |
| 107 | Wooden Jharokha Wall Decor Frame, Tradit | `wooden-jharokha-wall-decor-frame-traditional-indian-window-s-4` | 615qZ4QA-AL.jpg | ⚠️ shared-slug |
| 108 | Wooden Slipper Shape Decorative Showpiec | `wooden-slipper-shape-decorative-showpiece-for-home-entrance-` | 61F8M76V1vL.jpg |  |
| 109 | Handcrafted Hanging Bell Wind Chime for  | `handcrafted-hanging-bell-wind-chime-for-home-entrance-evil-e` | 514ESEInzsL.jpg | ⚠️ shared-slug |
| 110 | Handcrafted Hanging Bell Wind Chime for  | `handcrafted-hanging-bell-wind-chime-for-home-entrance-evil-e-2` | 517EVSfyeEL.jpg | ⚠️ shared-slug |
| 111 | Handcrafted Hanging Bell Wind Chime for  | `handcrafted-hanging-bell-wind-chime-for-home-entrance-evil-e-3` | 51FMIy4Tl+L.jpg | ⚠️ shared-slug |
| 112 | Handcrafted Hanging Bell Wind Chime for  | `handcrafted-hanging-bell-wind-chime-for-home-entrance-floral` | 51QLgVqmflL.jpg | ⚠️ shared-slug |
| 113 | Handcrafted Hanging Bell Wind Chime for  | `handcrafted-hanging-bell-wind-chime-for-home-entrance-floral-2` | 51IZDqtIeML.jpg | ⚠️ shared-slug |
| 114 | Handcrafted Hanging Bell Wind Chime for  | `handcrafted-hanging-bell-wind-chime-for-home-entrance-cerami` | 51LdrNKX4fL.jpg | ⚠️ shared-slug |
| 115 | Handcrafted Hanging Bell Wind Chime for  | `handcrafted-hanging-bell-wind-chime-for-home-entrance-cerami-2` | 51zdN8gjAoL.jpg | ⚠️ shared-slug |

## ⚠️ Shared-Slug Variants (resolved via image `v` param)

These products' names are identical within the first 60 chars, so they share a base slug. The image disambiguator ensures each opens correctly:

- `terracotta-kulhad-set-for-tea-coffee-traditional-clay-cups-f` + v=`61MTTlrpObL.jpg` — Terracotta Kullad Cups Set Couple mug (Set of 2, 220 ml, ...
- `terracotta-kulhad-set-for-tea-coffee-traditional-clay-cups-f-2` + v=`61MTTlrpObL.jpg` — Terracotta Kulhad Set for Tea & Coffee, Traditional Clay ...
- `auranest-d-cors-hand-painted-ceramic-planter-with-colorful-b` + v=`71k6pPEjZjL.jpg` — Two Love Birds Decorative Showpiece for Living Room, Roma...
- `natural-wooden-spoon-set-for-cooking-includes-frying-serving` + v=`71HDkfhid7L.jpg` — Auranest Decprs Wooden Spatula Set of 7 for Kitchen Cooki...
- `wooden-spice-box-with-glass-lid-12-compartment-masala-dabba-` + v=`618mVYoV37L.jpg` — Wooden Spice Box with Glass Lid 12 Compartment Masala Dab...
- `wooden-spice-box-with-glass-lid-12-compartment-masala-dabba--2` + v=`61MlAHlVYJL.jpg` — Wooden Spice Box with Glass Lid 12 Compartment Masala Dab...
- `auranest-d-cors-hand-painted-ceramic-planter-with-colorful-b-2` + v=`71k6pPEjZjL.jpg` — Auranest Décors Hand-Painted Ceramic Planter with Colorfu...
- `ceramic-bird-shape-planter-for-indoor-plants-decorative-flow` + v=`61czTt+nYuL.jpg` — Hand-Painted Ceramic Flower Planter, Decorative Bird and ...
- `ceramic-bird-shape-planter-for-indoor-plants-decorative-flow-2` + v=`61czTt+nYuL.jpg` — Bird on Tree Design Planter for Indoor Plants, Decorative...
- `ceramic-bird-shape-planter-for-indoor-plants-decorative-flow-3` + v=`61czTt+nYuL.jpg` — Ceramic Bird Shape Planter for Indoor Plants, Decorative ...
- `hand-painted-ceramic-conical-planter-folk-art-peacock-and-fl` + v=`61WctEtPYaL.jpg` — Girl with Peacock Design Planter for Indoor Plants, Artis...
- `radiant-heritage-hand-painted-ceramic-planter` + v=`51Sj8v2GRIL.jpg` — Decorative Lady Face Planter for Indoor Plants, Artistic ...
- `hand-painted-ceramic-conical-planter-folk-art-peacock-and-fl-2` + v=`61WctEtPYaL.jpg` — Hand-Painted Ceramic Conical Planter, Folk Art Peacock an...
- `hanging-shelves-adjustable-rope-hanging-shelf-wall-hanging-d-3` + v=`` — Hanging Shelves - Adjustable Rope Hanging Shelf, Wall Han...
- `pine-wood-setup-box-stand-set-top-box-stand-wall-mount-for-h-3` + v=`` — Pine Wood Setup Box Stand | Set Top Box Stand Wall Mount ...
- `pine-wood-setup-box-stand-set-top-box-stand-wall-mount-for-h` + v=`51Ukk3QvbXL.jpg` — Pine Wood Setup Box Stand | Set Top Box Stand Wall Mount ...
- `pine-wood-setup-box-stand-set-top-box-stand-wall-mount-for-h-2` + v=`51Ukk3QvbXL.jpg` — Pine Wood Setup Box Stand | Set Top Box Stand Wall Mount ...
- `hanging-shelves-adjustable-rope-hanging-shelf-wall-hanging-d` + v=`515WQp4nJUL.jpg` — Hanging Shelves - Adjustable Rope Hanging Shelf, Wall Han...
- `hanging-shelves-adjustable-rope-hanging-shelf-wall-hanging-d-2` + v=`61GWKODk8VL.jpg` — Hanging Shelves - Adjustable Rope Hanging Shelf, Wall Han...
- `natural-wooden-spoon-set-for-cooking-includes-frying-serving-2` + v=`71HDkfhid7L.jpg` — Natural Wooden Spoon Set for Cooking Includes Frying Serv...
- `round-foldable-wooden-stool-table-solid-acacia-wood-12-inch-` + v=`71ABHXt8UtL.jpg` — 2 Step Wooden Coffee Stool 12.5 Inch | Wooden Small Side ...
- `striped-wooden-key-holder-for-wall-with-hooks-decorative-key` + v=`61ZWowVCo1L.jpg` — Striped Wooden Key Holder for Wall with Hooks | Decorativ...
- `striped-wooden-key-holder-for-wall-with-hooks-decorative-key-2` + v=`61g87qUBj4L.jpg` — Striped Wooden Key Holder for Wall with Hooks, Decorative...
- `round-foldable-wooden-stool-table-solid-acacia-wood-12-inch--2` + v=`71ABHXt8UtL.jpg` — Round Foldable Wooden Stool/Table – Solid Acacia Wood | 1...
- `handcrafted-warli-art-wooden-tray-farming-scene-hand-painted` + v=`617Vv0B06YL.jpg` — Farming Theme Wooden Serving Tray for Tea & Snacks, Handc...
- `handcrafted-warli-art-wooden-tray-farming-scene-hand-painted-2` + v=`617Vv0B06YL.jpg` — Handcrafted Warli Art Wooden Tray – Farming Scene Hand-Pa...
- `radiant-heritage-hand-painted-ceramic-planter-2` + v=`51Sj8v2GRIL.jpg` — Radiant Heritage Hand-Painted Ceramic Planter
- `ceramic-wall-decor-plate-with-cow-design-artistic-hanging-pl` + v=`613lk1qjMPL.jpg` — Ceramic Wall Decor Plate with Cow Design, Artistic Hangin...
- `ceramic-wall-decor-plate-with-cow-design-artistic-hanging-pl-2` + v=`614W-k15GBL.jpg` — Ceramic Wall Decor Plate with Cow Design, Artistic Hangin...
- `ceramic-wall-decor-plate-with-cow-design-artistic-hanging-pl-3` + v=`` — Ceramic Wall Decor Plate with Cow Design, Artistic Hangin...
- `wooden-jharokha-wall-decor-frame-traditional-indian-window-s` + v=`611sf5IJc5L.jpg` — Wooden Jharokha Wall Decor Frame | Traditional Indian Win...
- `wooden-jharokha-wall-decor-frame-traditional-indian-window-s-2` + v=`51taAym5QsL.jpg` — Wooden Jharokha Wall Decor Frame | Traditional Indian Win...
- `wooden-jharokha-wall-decor-frame-traditional-indian-window-s-3` + v=`61EsiHY0ASL.jpg` — Wooden Jharokha Wall Decor Frame | Traditional Indian Win...
- `wooden-jharokha-wall-decor-frame-traditional-indian-window-s-4` + v=`615qZ4QA-AL.jpg` — Wooden Jharokha Wall Decor Frame, Traditional Indian Wind...
- `handcrafted-hanging-bell-wind-chime-for-home-entrance-evil-e` + v=`514ESEInzsL.jpg` — Handcrafted Hanging Bell Wind Chime for Home Entrance – E...
- `handcrafted-hanging-bell-wind-chime-for-home-entrance-evil-e-2` + v=`517EVSfyeEL.jpg` — Handcrafted Hanging Bell Wind Chime for Home Entrance – E...
- `handcrafted-hanging-bell-wind-chime-for-home-entrance-evil-e-3` + v=`51FMIy4Tl+L.jpg` — Handcrafted Hanging Bell Wind Chime for Home Entrance – E...
- `handcrafted-hanging-bell-wind-chime-for-home-entrance-floral` + v=`51QLgVqmflL.jpg` — Handcrafted Hanging Bell Wind Chime for Home Entrance – F...
- `handcrafted-hanging-bell-wind-chime-for-home-entrance-floral-2` + v=`51IZDqtIeML.jpg` — Handcrafted Hanging Bell Wind Chime for Home Entrance – F...
- `handcrafted-hanging-bell-wind-chime-for-home-entrance-cerami` + v=`51LdrNKX4fL.jpg` — Handcrafted Hanging Bell Wind Chime for Home Entrance – C...
- `handcrafted-hanging-bell-wind-chime-for-home-entrance-cerami-2` + v=`51zdN8gjAoL.jpg` — Handcrafted Hanging Bell Wind Chime for Home Entrance - C...

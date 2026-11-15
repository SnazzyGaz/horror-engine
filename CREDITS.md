# Credits

HorrorEngine by **Garyck Arntzen** ([x.com/_mintydoge](https://x.com/_mintydoge)), released under the MIT License (see `LICENSE`).

## Photo-scanned textures (CC0 1.0, public domain)

All surface textures are CC0 scans, resized and repacked to WebP (colour, OpenGL normal, roughness) in `assets/textures/` (workshop) or `assets/crypt_assets.js` (altar) and embedded in `index.html`. CC0 needs no attribution; it is given here as thanks.

| Used for | Source | Asset | Author |
|---|---|---|---|
| bench top (oak veneer) | Poly Haven | [oak_veneer_01](https://polyhaven.com/a/oak_veneer_01) | Jenelle van Heerden |
| cabinet sides, wheel, frames, drawer | Poly Haven | [walnut_veneer](https://polyhaven.com/a/walnut_veneer) | Jenelle van Heerden |
| ebonised plates and slots (darkened in the material) | Poly Haven | [black_walnut_veneer_01](https://polyhaven.com/a/black_walnut_veneer_01) | Jenelle van Heerden |
| floorboards | Poly Haven | [old_wood_floor](https://polyhaven.com/a/old_wood_floor) | Guillaume Monsergent |
| back wall | Poly Haven | [brick_wall_001](https://polyhaven.com/a/brick_wall_001) | Rob Tuytel (processing), Dimitrios Savva (photography) |
| side wall and ceiling | Poly Haven | [clay_plaster](https://polyhaven.com/a/clay_plaster) | Amal Kumar |
| brass and bronze (tinted) | ambientCG | [Metal048A](https://ambientcg.com/view?id=Metal048A) + [Metal053B](https://ambientcg.com/view?id=Metal053B) (wear blend) | ambientCG (Lennart Demes) |
| brushed steel | ambientCG | [Metal009](https://ambientcg.com/view?id=Metal009) | ambientCG (Lennart Demes) |
| aluminium knobs | ambientCG | [Metal011](https://ambientcg.com/view?id=Metal011) | ambientCG (Lennart Demes) |
| dark iron: stand, tank, gauge case, sheet | ambientCG | [Metal046A](https://ambientcg.com/view?id=Metal046A) | ambientCG (Lennart Demes) |
| drum skin | ambientCG | [Paper005](https://ambientcg.com/view?id=Paper005) | ambientCG (Lennart Demes) |
| grille cloth | ambientCG | [Fabric030](https://ambientcg.com/view?id=Fabric030) | ambientCG (Lennart Demes) |
| slate board (darkened) | ambientCG | [Concrete012](https://ambientcg.com/view?id=Concrete012) | ambientCG (Lennart Demes) |
| crinkle-enamel faceplate | ambientCG | [Leather026](https://ambientcg.com/view?id=Leather026) | ambientCG (Lennart Demes) |

Licences: Poly Haven assets are CC0 (https://polyhaven.com/license); ambientCG assets are CC0 (https://docs.ambientcg.com/license/).

## Altar skin (`?skin=altar`)

Crypt textures and the scanned human skull are CC0 1.0 (public domain), packed into `assets/crypt_assets.js`. On the hosted site they are fetched only when the Altar skin is chosen (the Workshop skin never downloads them). The double-click / `file://` build still inlines them in `index.html`, but they are only decoded and uploaded to the GPU for the Altar skin. The beam-mounted goat skull is CC BY 4.0.

| Used for | Source | Asset | Author(s) |
|---|---|---|---|
| crypt walls, niches, pillars (`aWall`) | Poly Haven | [stone_brick_wall_001](https://polyhaven.com/a/stone_brick_wall_001) | Dimitrios Savva, Rico Cilliers |
| crypt floor (`aFloor`) | Poly Haven | [monastery_stone_floor](https://polyhaven.com/a/monastery_stone_floor) | Amal Kumar |
| thunder sheet (`aSheet`) | Poly Haven | [rusty_metal_04](https://polyhaven.com/a/rusty_metal_04) | Amal Kumar |
| skulls (crank spike, niches, floor; decimated to 10k / 3.2k triangles) | Grab3D | [human-skull](https://grab3d.com/models/anatomy/human-skull/) (`human-skull-light.glb`) | Grab3D (CC0, https://grab3d.com/license/) |
| beam-mounted goat skull (`goatSkull`) | Sketchfab | [Goat Skull](https://sketchfab.com/3d-models/goat-skull-99b738abd7d34b27a38b363900856043) | Bohnen (CC BY 4.0) |

The beam-mounted goat skull is "Goat Skull" by Bohnen, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source: [sketchfab.com/3d-models/goat-skull-99b738abd7d34b27a38b363900856043](https://sketchfab.com/3d-models/goat-skull-99b738abd7d34b27a38b363900856043). It was reoriented as a European mount (upright, facing forward) and packed into `assets/crypt_assets.js`.

Other altar surfaces reuse the workshop textures above (oak veneer for the timber, the old wood floor for beams and hoops, iron and steel for rusted metal, the slate texture for the ledge), or are made for the project with no outside source: the ribcage, vertebrae, long and flat bones, skull bowl, horns, candles, entrails, carved panel, chalk sigils, eyeballs, rusted railroad spikes, blood stain masks and rust paint are procedural (`src/sculpt.js`, `src/altar.js`).


## Séance planchette

The celestial planchette on the spirit board (the black teardrop with the lattice symbol in the astrolabe ring) is original artwork by **Garyck Arntzen** ([x.com/_mintydoge](https://x.com/_mintydoge)).
## Libraries

- three.js r160, MIT License, Copyright © 2010-2023 three.js authors (`vendor/three.LICENSE`).

## Models and papers

- The bowed-string friction curve follows the bow-table idea published in STK by Perry R. Cook and Gary P. Scavone.
- The spring tank's dispersion follows the model by Välimäki, Parker and Abel (2010).
- Inspired by the Apprehension Engine by Mark Korven and Tony Duggan-Smith; not affiliated.

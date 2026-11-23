[![gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/c/gta6-01)
[![rank](https://make.fun/badge/gta6-01/gumatara11/tropical-coast/rank.svg)](https://make.fun/c/gta6-01)
[![reward](https://make.fun/badge/gta6-01/gumatara11/tropical-coast/reward.svg)](https://make.fun/c/gta6-01)

# Tropical Coast

An open-world crime game in the spirit of GTA 6, built for the [gta6-01 competition on make.fun](https://make.fun/c/gta6-01). You are Gito, back home in Tropical Coast — a sun-soaked beach city of 8 districts — with your yellow COAST GT, your childhood friend Luna, and the whole coast to explore on foot, by car, by bike, by boat and by jetski.

## The city

Eight districts across a 410 m coastline: the Promenade and its beach, the Harbor (Pelabuhan), Residential, City Center, Industrial, the Night Club, and Sunset Hill. Shops, towers, a plaza, a pier, a beach bar, a ferris wheel, palms, traffic lights, billboards and a bus stop fill the streets; the ocean, beach umbrellas, volleyball, a lifeguard tower and tour helicopters fill the shore. Day, sunset and golden-hour lighting variants change the whole mood — the golden hour puts a low sun ahead of the chase, with long shadows stretching toward the camera.

## What you can do

- **Explore on foot** — walk the promenade, the beach and all 8 districts, past 38 pedestrians, beachgoers, sunbathers, swimmers and chatters.
- **Drive anything** — the yellow COAST GT sport coupe (with real steering, front wheels that turn, reverse and a ~8 m turn radius), 6 police cars, a taxi, 12 traffic cars + 4 cross-street cars (walk up to any of them and press E to take it), 16 parked bikes (PCJ-style sport bikes and Faggio-style Vespas, all enterable), 9 traffic bikes, 3 motorboats, 3 jetskis and a tour helicopter circling the beach.
- **Missions and story** — three missions with dialogue: Welcome Back (talk to Luna, take the car, +$200), Harbor Delivery (Ray at the harbor, deliver to the Night Club, +$500), Night Out (Max the bouncer, drive to the pier, +$800), then free roam. A gold beacon marks your current objective — the mission giver while a talk is due, the destination once you're on the job. Progress saves to localStorage (Continue on the menu, or Save in the pause menu — Esc/P or ☰).
- **Wanted level** — collisions and speeding over 130 km/h raise your stars (0–5). Police cars pursue, flank and ram, the police helicopter hunts you with a spotlight, and the dispatch panel tracks all 13 responding units live (6 police cars, 6 foot officers, the helicopter).
- **Combat and HUD** — 7 weapon slots (pistol with real ammo 12/60, SMG, shotgun, rifle, sniper, bat, fists), health and armour bars that regenerate out of trouble, a speedometer, a live minimap, a mission panel with a stage timer, a district readout, car condition, and Radio Tropical 98.6. Synthesized WebAudio: engine hum that follows speed, a two-tone police siren while wanted, and a thud on impact (M or the speaker button mutes).

## Controls

| Key | Action |
| --- | --- |
| W / ↑ | Accelerate / walk forward |
| S / ↓ | Brake / reverse / walk back |
| A / D or ← / → | Steer / turn |
| E | Enter a vehicle, talk to a mission giver, advance dialogue |
| Esc / P or ☰ | Pause menu (Resume / Save / Quit to Menu) |
| M | Mute / unmute |
| Touch | On-screen buttons on mobile |

## Play it

Serve `game/` with any static HTTP server and open `index.html` — the game loads fully offline (three.js is vendored under `game/vendor/`, textures under `game/textures/`). Try `?cover=1&screen=game&spot=chase&v=golden` for the golden-hour chase, `?cover=1&screen=game&spot=promenade&v=day` for the promenade on foot, or `?cover=1&screen=game&spot=talk&v=day` for Luna's dialogue.

## Structure

The game's own source is split into one clear job per file under `game/src/`: `random.js` (seeded RNG), `config.js` (URL params, lighting variants, ground rules), `textures.js` (texture loading), `scene.js` (renderer, sky, sun, clouds), `world.js` (city, beach, districts), `character.js` (Gito, Luna and NPCs), `vehicles.js` (cars, bikes, boats, helicopters), `missions.js` (state, entering vehicles, missions, dialogue, saving), `hud.js` (enter arrow, beacon, gauge, minimap, panels, rider poses), `input.js` (keyboard and touch), `sound.js` (WebAudio engine, siren, thud), `render.js` (the frame loop, traffic, police, player, camera director), `shots.js` (the four screenshots), `main.js` (bootstrap).

## License

MIT — see [LICENSE](LICENSE).

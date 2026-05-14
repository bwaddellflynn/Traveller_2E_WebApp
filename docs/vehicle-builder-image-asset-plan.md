# Vehicle Builder Image Asset Plan

> Superseded by `docs/vehicle-builder-image-asset-plan.xlsx`, which uses the current feature qualification gates. This Markdown draft is retained only as a rough early note.

Reference checklist for Vehicle Builder silhouette/image needs. The intent is to organize future image assets by **vehicle type**, then **locomotion or form variant**, then **size class**.

These are planning references only. They are not currently wired into the app.

## Size Classes

| Size | Spaces |
|---|---:|
| Small | 1-3 |
| Light | 4-19 |
| Heavy | 20-199 |
| Huge | 200-1,999 |
| Massive | 2,000+ |

## Ground Vehicle

| Locomotion / Form | Small | Light | Heavy | Huge | Massive |
|---|---|---|---|---|---|
| Wheeled default | motorcycle / quad | car / light truck | freight hauler / APC | land train / crawler hauler | mobile fortress / city crawler |
| ATV / Off-Roader / Smart Wheels | off-road buggy | 4x4 / rover | expedition truck | heavy terrain carrier | mobile terrain base |
| Tracks | tracked bike / mini tractor | tracked utility carrier | tracked APC / tank | super-heavy tank | land battleship |
| Monowheel | monowheel cycle | monowheel pod | large monowheel carrier | industrial mono-ring | massive mono-ring platform |
| Rail Rider | rail speeder | rail car | armoured rail car | locomotive train section | rail fortress |
| Tunneller | drilling pod | boring vehicle | tunnelling machine | giant mole machine | subterranean city-borer |

## Walker

| Locomotion / Form | Small | Light | Heavy | Huge | Massive |
|---|---|---|---|---|---|
| Two-legged walker | loader frame | combat walker | siege walker | titan walker | mega-walker |
| Multi-Legged | spider loader | multi-leg combat walker | artillery crawler walker | fortress walker | continent-scale walker |
| Tunneller walker | mining walker | drill walker | heavy boring walker | siege tunneller walker | world-engine tunneller |

## Aeroplane

| Locomotion / Form | Small | Light | Heavy | Huge | Massive |
|---|---|---|---|---|---|
| Propeller / baseline powered | ultralight | bush plane | regional aircraft | strategic transport | flying carrier |
| Jet Engines | trainer jet | light strike jet | transport jet / bomber | strategic jet lifter | airborne fortress |
| Supersonic | small interceptor | fighter | supersonic bomber | high-speed command aircraft | massive supersonic carrier |
| Hypersonic | hypersonic dart | recon plane | hypersonic bomber | orbital-skimming aircraft | hypersonic sky platform |
| STOL | bush plane | utility STOL | short-field transport | rugged heavy lifter | expedition sky carrier |
| Tilt Engines / VTOL | tilt-wing scout | VTOL transport | assault VTOL | heavy tilt-engine carrier | VTOL flying base |
| Floats | floatplane | amphibious aircraft | seaplane transport | maritime aircraft | floating sky carrier |

## Rotorcraft

| Locomotion / Form | Small | Light | Heavy | Huge | Massive |
|---|---|---|---|---|---|
| Rotorcraft default | gyrocopter | light helicopter | troop helicopter | flying crane | heli-carrier |
| Aerodyne | ducted-fan scout | aerodyne car | aerodyne gunship | heavy aerodyne carrier | aerodyne sky fortress |
| Ornithopter | wing-flapper scout | ornithopter courier | ornithopter transport | heavy ornithopter | giant winged carrier |
| Folding Wings / rotors | compact scout rotor | foldable utility rotor | naval folding rotorcraft | carrier-stowable heavy rotor | collapsible heli-carrier |

## Airship

| Locomotion / Form | Small | Light | Heavy | Huge | Massive |
|---|---|---|---|---|---|
| Non-rigid airship | observation balloon | light blimp | cargo blimp | sky freighter | floating city |
| Rigid airship | framed blimp | command airship | military transport | aerial carrier | sky dreadnought |
| Streamlined airship | racing blimp | patrol airship | fast cargo airship | streamlined sky freighter | high-speed aerial fortress |

## Grav Vehicle

| Locomotion / Form | Small | Light | Heavy | Huge | Massive |
|---|---|---|---|---|---|
| Grav default | grav bike | air/raft | grav transport | bulk grav hauler | flying city-lifter |
| Streamlined | grav speeder | fast grav car | streamlined grav APC | grav assault platform | sleek flying fortress |
| Agile | manoeuvre grav bike | patrol grav car | agile grav carrier | mobile command grav | massive responsive grav platform |
| Open Frame | grav sled | open air/raft | exposed utility grav | open grav platform | exposed grav barge |

## Hovercraft

| Locomotion / Form | Small | Light | Heavy | Huge | Massive |
|---|---|---|---|---|---|
| Hovercraft default | personal skimmer | hovercar | troop hovercraft | heavy landing platform | amphibious carrier |
| Streamlined | racing skimmer | patrol hovercar | fast hover transport | streamlined hover barge | high-speed assault dock |
| Open Frame / Open-Topped | rescue sled | open hovercar | exposed hover APC | open landing platform | open hover base |

## Watercraft

| Locomotion / Form | Small | Light | Heavy | Huge | Massive |
|---|---|---|---|---|---|
| Surface craft default | jet ski / skiff | motorboat | ferry / corvette | destroyer / carrier | floating fortress |
| Hydrofoil | hydrofoil bike | hydrofoil patrol boat | fast hydrofoil ferry | heavy hydrofoil warship | massive foil-supported carrier |
| Floats / buoyant form | small boat | cabin cruiser | cargo boat | freighter | sea base |
| Open-Topped | speedboat | open patrol boat | landing craft | open-deck carrier | exposed sea platform |

## Submersible

| Locomotion / Form | Small | Light | Heavy | Huge | Massive |
|---|---|---|---|---|---|
| Submersible default | diver scooter | mini-sub | attack submarine | undersea carrier | mobile undersea fortress |
| Tunneller | drill pod | seabed boring sub | tunnelling submarine | abyssal boring carrier | undersea world-borer |
| Open Frame | diver frame | exposed maintenance sub | industrial work sub | open salvage platform | abyssal work platform |

## Structure

| Form | Small | Light | Heavy | Huge | Massive |
|---|---|---|---|---|---|
| Static structure | kiosk / shelter | workshop / cabin | hangar / barracks | major facility | arcology / fortress complex |
| Streamlined structure | aerodynamic pod | streamlined module | launch tower / vehicle shell | hardened aero facility | megastructure shell |
| Open Frame | gantry | scaffold platform | industrial frame | shipyard frame | megastructure skeleton |
| AFV / fortified | bunker pod | fortified checkpoint | command bunker | fortress facility | hardened city-fortress |

## Implementation Notes

- Prefer silhouette families over detailed illustrations for the builder flow.
- Use one reusable silhouette per row family where possible.
- Size-class variants only need separate images when the readable form changes meaningfully.
- Features that affect locomotion or body form should choose the visual before generic size variants.
- The first image lookup key should be vehicle type, the second should be locomotion/form, and the third should be size class.

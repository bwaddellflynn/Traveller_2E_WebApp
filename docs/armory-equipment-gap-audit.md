# Armory Equipment Gap Audit

Working audit for equipment records that are not weapons or armour. Current equipment seed count is 66 records across Core, Central Supply Catalogue, and Field Catalogue.

## Scope

- Include: equipment, support gear, electronics, computers, software, medical supplies, drugs, sensors, survival gear, tools, augments, weapon accessories if represented as purchased equipment.
- Exclude: weapons, ammunition as weapon rows, armour rows, vehicles, spacecraft, robots.

## Current Coverage

- Core Rulebook: partial equipment seed.
- Central Supply Catalogue: very small medical seed only.
- Field Catalogue: small personal/support seed only.

## Core Rulebook Gaps

The Core equipment chapter is mostly structured and should be straightforward to finish. Missing rows found during scrape:

- Augments: Cognitive Augmentation +1/+2/+3, Dexterity Augmentation +1/+2/+3, Endurance Augmentation +1/+2/+3, Enhanced Vision, Neural Comm variants, Skill Augmentation, Strength Augmentation +1/+2/+3, Subdermal Armour variants, Wafer Jack variants.
- Communications: TL5 radio transceivers at 5km/50km/500m/5000km, TL9 radio transceiver, TL9 Computer/0 radio transceiver, TL10 Computer/0 radio transceiver, TL13 Computer/1 radio transceiver, TL14 Computer/1 radio transceiver, TL9 laser transceiver, TL13 laser transceiver, Bug TL5/TL7/TL11/TL13/TL15 variants.
- Computers/software: Interface, Intelligent Interface, Security 0/1/2/3, Intrusion 1/2/3/4, Expert 1/2/3, Translator 0/1, Database, Agent 0/1/2/3, Intellect 1/2/3, portable computers TL7/TL9/TL11/TL13, specialised computer option.
- Medical/drugs: Cryoberth, Medicinal Drugs, Metabolic Accelerator, Panaceas, Slow Drug.
- Sensors: Binoculars TL3/TL12, Geiger Counter TL5, Light Intensifier Goggles TL7/TL9.
- Survival gear: Breather Mask TL10, Climbing Kit TL4, Filter Mask, Habitat Module TL8, Radiation Suit, Respirator TL6/TL10, Tent TL3/TL7.
- Survival structure options: Climate Controlled, Self-Assembling, Self-Sealing.
- Toolkits: Forensics, Scientific, Surveying.

## Central Supply Catalogue Gaps

CSC is the largest remaining extraction task. Current seed only includes a few Medical Care and Supplies rows. Item-level extraction still needed for:

- Augments.
- Communications.
- Computers and Software.
- Electronics.
- Home Comforts.
- Medical Care and Supplies beyond the first seed.
- Survival Gear.
- Tools.
- Weapon Accessories that should be equipment records.

CSC also includes armour, weapons, and ammunition sections, but those belong in the armour/weapons datasets rather than Equipment unless an item is clearly a non-weapon accessory.

## Field Catalogue Gaps

Field Catalogue equipment is split across personal, support, and heavy equipment sections. Current seed only covers a small subset.

Missing non-weapon/non-armour rows found during scrape:

- Personal devices: External Thermal Regulation Unit, Faraday Weave, Faraday Weave Control Device, Match Tarp, Thermal Regulation Covering.
- Electronics: Autohack, Comm Scrambler, Interface Box, Military Portacomp variants, Multifunction Electronic Device, Tactical Relay Network.
- Sensors and targeting aids: Ballistic Location Sensor, Return Fire Unit, Battlefield Coordination Unit variants, Biomass Sighting Aid variants, Integrated Weapon Scanner, Laser Designator variants, NBC Analysis/Alert Unit, Personal HUD variants.
- Support equipment: Military Automedic, Support Cooling Unit variants, Support Cooling Unit receptacle/fluid/radiators.
- Explosives and demolition equipment: Breaching Charge, Demolition Block, Demolition Charge, Nuclear Demolition Charge.
- Defensive equipment: Fackles, Sensorfence.
- Drones: SkySpotter Drone/Control Station, Aerodagger Drone/Cluster, Battle Mule Drone, DesiGnator Drone/Control Station, Grav Mule Drone, Grav Pioneer Drone.
- Heavy equipment: Field deployables and vehicle-portable systems beginning in the Heavy Equipment section still need full pass.

## Next Pass

- Finish Core equipment first because it is compact and directly useful for character purchases.
- Then extract Field Catalogue equipment because sections are focused and many rows are mercenary-support oriented.
- Then perform CSC by section, starting with Communications, Computers/Software, Electronics, Survival Gear, and Tools before the broader Home Comforts and full Medical catalogue.

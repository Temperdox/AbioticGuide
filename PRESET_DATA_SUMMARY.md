# Abiotic Factor Preset Data - Summary

## Overview

**Source Repository**: https://github.com/ComradeAleks/Abiotic-Factor-Interactive-maps/tree/main/data/presets/

## Data Structure Sample

### Example: Base Defense Item

```json
{
  "item": "Disc Turret",
  "image": "https://abioticfactor.wiki.gg/images/f/fa/Itemicon_discturret.png?562142&format=original",
  "link": "https://abioticfactor.wiki.gg/wiki/Disc_Turret",
  "category": "Base defense",
  "Appears in": false,
  "Trade": false,
  "Drops": false,
  "Harvestable Drops": false,
  "Butchering": false,
  "Scrap Result": ["Tech Scrap", "Metal Scrap"],
  "Recipe": [[
    ["Grinder", "Carbon Plating", "Reinforced Hose", "Box of Screws"],
    ["Disc Turret"]
  ]],
  "Farming": false
}
```

### Example: Fish Item

```json
{
  "item": "Entropic Portal Fish",
  "image": "https://abioticfactor.wiki.gg/images/5/5b/Itemicon_portalfish_rare_2.png?1a2175&format=original",
  "link": "https://abioticfactor.wiki.gg/wiki/Entropic_Portal_Fish",
  "category": "Fish",
  "Appears in": false,
  "Trade": false,
  "Drops": false,
  "Harvestable Drops": false,
  "Butchering": [
    ["4", "Raw Portal Fish Filet", "100%"],
    ["2", "Fish Oil", "100%"],
    ["2", "Fish Bones", "100%"],
    ["2-4", "Exor Quill", "100% of 2\n50% of 3-4"],
    ["0-2", "Raw Exor Heart", "25%"]
  ],
  "Scrap Result": false,
  "Recipe": false,
  "Farming": false
}
```

### Example: Enemy Item

```json
{
  "item": "Archivist",
  "image": "https://abioticfactor.wiki.gg/images/5/56/Archivist.png?4c68dc&format=original",
  "link": "https://abioticfactor.wiki.gg/wiki/Archivist",
  "category": "Enemies",
  "Appears in": false,
  "Trade": false,
  "Drops": [
    ["1", "Purported Grimoire", "100%"],
    ["1", "Tactical Scrap", "100%"],
    ["0-1", "Lodestone Fragment", "10%"],
    ["0-1", "Ornate Key", "5%"]
  ],
  "Harvestable Drops": [
    ["1", "Human Skull", "100%"]
  ],
  "Butchering": false,
  "Scrap Result": false,
  "Recipe": false,
  "Farming": false
}
```

### Example: Trader Item

```json
{
  "item": "Carson",
  "image": "https://abioticfactor.wiki.gg/images/d/dc/Dr_Carson_trader.png?59526a&format=original",
  "link": "https://abioticfactor.wiki.gg/wiki/Carson",
  "category": "Traders",
  "Appears in": ["Security Sector"],
  "Trade": [
    ["Carson Family Cookbook", "Heater"],
    ["Frying Pan", "Pens"],
    ["Cooking Pot", "Rubber Band Ball"],
    ["Space Lettuce Seed", "Glowstick"],
    ["Vanilla Latte", "Slushie"]
  ],
  "Drops": false,
  "Harvestable Drops": false,
  "Butchering": false,
  "Scrap Result": false,
  "Recipe": false,
  "Farming": false
}
```

### Example: Food Item with Recipe

```json
{
  "item": "Vanilla Latte",
  "image": "https://abioticfactor.wiki.gg/images/...",
  "link": "https://abioticfactor.wiki.gg/wiki/Vanilla_Latte",
  "category": "Food and Cooking",
  "Appears in": false,
  "Trade": false,
  "Drops": false,
  "Harvestable Drops": false,
  "Butchering": false,
  "Scrap Result": false,
  "Recipe": [[
    ["Coffee Beans", "Milk", "Sugar", "Vanilla Extract"],
    ["Vanilla Latte"]
  ]],
  "Farming": false
}
```

## Usage Examples

### Import and Use in JavaScript

```javascript
import {
  abioticPresetData,
  getItemsByCategory,
  searchItems,
  getItemsWithRecipes,
  getItemsByLocation
} from './src/data/abiotic-preset-data.js';

// Get all food items
const allFood = getItemsByCategory('Food');

// Get only farming items
const farmingItems = getItemsByCategory('Food', 'Farming');

// Search for batteries
const batteries = searchItems('battery');

// Get all craftable items
const craftable = getItemsWithRecipes();

// Find items in Security Sector
const securityItems = getItemsByLocation('Security Sector');
```

### Use in Node.js

```javascript
const presetData = require('./src/data/abiotic-preset-data.json');

// Access all enemies
const enemies = presetData['People and Enemies']['Enemies'];

// Get all items with recipes
const craftable = Object.values(presetData)
  .flatMap(category => Object.values(category))
  .flat()
  .filter(item => item.Recipe && item.Recipe !== false);
```

## Demo Page

Open `examples\preset-data-demo.html` in a web browser to see an interactive demo with:
- Search functionality
- Category filtering
- Visual item cards
- Recipe display
- Links to wiki pages
- Live statistics

## Updating the Data

To refresh the data from the source repository in the future:

```bash
node scripts/compile-preset-data.js
```

This will:
1. Read all .txt files from `data/presets/`
2. Parse each line as a JSON object
3. Organize by category and subcategory
4. Generate both .js and .json output files
5. Include helper functions in the .js module

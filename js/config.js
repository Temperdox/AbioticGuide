// ==================== INGREDIENT SUB-RECIPES ====================
const ingredientRecipes = {
  "Raw Dough": {
    name: "Raw Dough",
    ingredients: ["Anteverse Wheat", "Anteverse Wheat", "Milk Sac"]
  },
  "Raw Peccary Sausages": {
    name: "Raw Peccary Sausages",
    ingredients: ["Raw Peccary Chop", "Raw Peccary Chop", "Bio Scrap", "Salt"]
  },
  "Anteverse Cheese": {
    name: "Anteverse Cheese",
    ingredients: [], // Complex process - not shown
    note: "Created via complex cheese-making process"
  },
  "Fish Oil": {
    name: "Fish Oil",
    ingredients: [], // Not craftable
    note: "Obtained by butchering fish"
  },
  "Bowl of Xanterium Rice": {
    name: "Bowl of Xanterium Rice",
    ingredients: ["Xanterium Rice"]
  },
  "Cooked Gutfish Eel Filet": {
    name: "Cooked Gutfish Eel Filet",
    ingredients: ["Raw Gutfish Eel Filet"]
  },
  "Ice Cream": {
    name: "Ice Cream",
    ingredients: ["Egg", "Milk Sac", "Gem Sugar"]
  }
};

// ==================== BUFF DESCRIPTIONS ====================
const buffDescriptions = {
  "Souper Satisfied": "Basic soup buff. Provides standard hunger and thirst restoration.",
  "Bodacious": "Provides all benefits of Souper Satisfied PLUS makes your inventory 25% lighter (like having Carbuncle Balloon equipped).",
  "Heightened Senses": "Hones your reflexes and increases blunt and sharp melee XP gain. Great for quick leveling!",
  "Mega-Ante": "Temporarily increases movement speed and strength. One of the best buffs!",
  "Quick Reflexes": "Provides more XP for accuracy and reloading skills.",
  "Big Brain": "Increases crafting and construction XP. Perfect for long building sessions!",
  "Brain Freeze": "Keeps you cool in warm areas. Useful in hot sectors and portal worlds.",
  "Desire of the Flesh": "Reduces damage taken BUT attracts the Leyak. Use with caution!",
  "Lightfooted": "Increases XP for sprinting and sneaking.",
  "Living Off the Land": "Makes gardening actions give more agricultural XP. Great before planting!",
  "Rad Resistant": "Reduces incoming radiation by 50% PLUS Souper Satisfied benefits. Essential for late-game portal worlds.",
  "Sweet Tooth": "Gives extra boost to hunger and thirst bars when eating vending machine snacks.",
  "Sugar High": "Increases stamina temporarily but makes you tire easily and need bathroom more often.",
  "Well Fed": "Provides sustained energy and health regeneration.",
  "Energized": "Increases stamina regeneration rate.",
  "King of Carbuncles": "Special buff from Carbuncle Casserole. Effects unknown - may relate to Carbuncle interactions.",
  "Fish Out of Water": "Special buff from Crumbed Darkwater Fish. Effects unknown - may provide water-related benefits.",
  "Slice of Home": "Special buff from Apple Pie. Provides comfort and nostalgic benefits."
};

// ==================== IMAGE CONFIGURATION ====================
const imageUrls = {
  ingredients: {
    "Tomato": "https://abioticfactor.wiki.gg/images/Item_Icon_-_Tomato.png?ec852d",
    "Super Tomato": "https://abioticfactor.wiki.gg/images/Item_Icon_-_Super_Tomato.png?8523e3",
    "Salt": "https://abioticfactor.wiki.gg/images/Item_Icon_-_Salt.png?67b806",
    "Raw Peccary Chop": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Raw_Peccary_Chop.png/64px-Item_Icon_-_Raw_Peccary_Chop.png?f9644c",
    "Raw Alien Drumstick": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Raw_Alien_Drumstick.png/64px-Item_Icon_-_Raw_Alien_Drumstick.png?91de67",
    "Raw Pest": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Raw_Pest.png/64px-Item_Icon_-_Raw_Pest.png?7a876c",
    "Canned Peas": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Canned_Peas.png/64px-Item_Icon_-_Canned_Peas.png?2aceaf",
    "Raw Dough": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_food_raw_dough.png/64px-Itemicon_food_raw_dough.png?e81d1e",
    "Raw Carbuncle": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Raw_Carbuncle.png/64px-Item_Icon_-_Raw_Carbuncle.png?354396",
    "Purified Corn": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_food_corn.png/64px-Itemicon_food_corn.png?2f2a2f",
    "Milk Sac": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Milk_Sac.png/64px-Item_Icon_-_Milk_Sac.png?7e3309",
    "Raw Larva Meat": "https://abioticfactor.wiki.gg/images/Raw_Larva_Meat.png?9597a3",
    "Carbuncle Mushroom": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Carbuncle_Mushroom.png/64px-Item_Icon_-_Carbuncle_Mushroom.png?d93f23",
    "Antepasta": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Antepasta.png/64px-Item_Icon_-_Antepasta.png?553234",
    "Raw Peccary Sausages": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Raw_Peccary_Sausages.png/64px-Item_Icon_-_Raw_Peccary_Sausages.png?4c1f08",
    "Potato": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_potato.png/64px-Itemicon_potato.png?a1fe00",
    "Raw Pest Rump": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Raw_Pest_Rump.png/64px-Item_Icon_-_Raw_Pest_Rump.png?d59055",
    "Pumpkin": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_pumpkin.png/64px-Itemicon_pumpkin.png?9e1ab0",
    "Raw Antefish Filet": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_filet_antefish_raw.png/64px-Itemicon_filet_antefish_raw.png?1f319e",
    "Raw Chordfish Filet": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_filet_fogfish_raw.png/64px-Itemicon_filet_fogfish_raw.png?699555",
    "Xanterium Rice": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_ricebag.png/64px-Itemicon_ricebag.png?10249b",
    "Raw Inkfish Filet": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_filet_reaperfish_raw.png/64px-Itemicon_filet_reaperfish_raw.png?798710",
    "Egg": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Egg.png/64px-Item_Icon_-_Egg.png?ae40a7",
    "Raw Moon Fish Filet": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_filet_moonfish_raw.png/64px-Itemicon_filet_moonfish_raw.png?23a9fb",
    "Raw Exor Heart": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Raw_Exor_Heart.png/64px-Item_Icon_-_Raw_Exor_Heart.png?16ef4c",
    "Raw Portal Fish Fillet": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_filet_portalfish_raw.png/64px-Itemicon_filet_portalfish_raw.png?5badbd",
    "Raw Darkwater Fish Filet": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_fish_filet_dw_raw.png/64px-Itemicon_fish_filet_dw_raw.png?72a096",
    "Greyeb": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Greyeb.png/64px-Item_Icon_-_Greyeb.png?4fd550",
    "Murkweed": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_seaweed.png/64px-Itemicon_seaweed.png?e3ca1e",
    "Raw Silken Betta Filet": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Raw_Silken_Betta_Filet.png/64px-Item_Icon_-_Raw_Silken_Betta_Filet.png?401c56",
    "Raw Penumbra Filet": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Raw_Penumbra_Filet.png/64px-Item_Icon_-_Raw_Penumbra_Filet.png?426f03",
    "Glow Eye": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_GlowEye1.png/64px-Itemicon_GlowEye1.png?9f88e7",
    "Exor Arm": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Exor_Arm.png/64px-Item_Icon_-_Exor_Arm.png?f3c4df",
    "Military MRE": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Military_M.R.E..png/64px-Item_Icon_-_Military_M.R.E..png?dc074b",
    "Raw Frigid Queenfish Filet": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_filet_icefish_raw.png/64px-Itemicon_filet_icefish_raw.png?62a4c7",
    "Antiverse Wheat": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Anteverse_Wheat.png/64px-Item_Icon_-_Anteverse_Wheat.png?88dfd6",
    "Raw Radfish Filet": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_filet_radfish_raw.png/64px-Itemicon_filet_radfish_raw.png?3a67d4",
    "Melted Ice Cream": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Melted_Ice_Cream.png/64px-Item_Icon_-_Melted_Ice_Cream.png?e00ceb",
    "Doznuts": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Doznuts.png/64px-Item_Icon_-_Doznuts.png?5a23fc",
    "Jowlers": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Jowlers.png/64px-Item_Icon_-_Jowlers.png?acf8b9",
    "Skip": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Skip.png/64px-Item_Icon_-_Skip.png?b854be",
    "Anteverse Wheat": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Anteverse_Wheat.png/64px-Item_Icon_-_Anteverse_Wheat.png?88dfd6",
    "Bio Scrap": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Bio_Scrap.png/64px-Item_Icon_-_Bio_Scrap.png?a1b2c3",
    "Bowl of Xanterium Rice": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_ricebowl.png/64px-Itemicon_ricebowl.png?1234ab",
    "Roasted Nori Sheet": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_norisheet.png/64px-Itemicon_norisheet.png?5678cd",
    "Gem Crab": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Gem_Crab.png/64px-Item_Icon_-_Gem_Crab.png?abcdef",
    "Opal Crab": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Opal_Crab.png/64px-Item_Icon_-_Opal_Crab.png?fedcba",
    "Cooked Gutfish Eel Filet": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_filet_gutfish_cooked.png/64px-Itemicon_filet_gutfish_cooked.png?123456",
    "Raw Gutfish Eel Filet": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_filet_gutfish_raw.png/64px-Itemicon_filet_gutfish_raw.png?654321",
    "Gem Sugar": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Gem_Sugar.png/64px-Item_Icon_-_Gem_Sugar.png?aabbcc",
    "Ice Cream": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Ice_Cream.png/64px-Item_Icon_-_Ice_Cream.png?ccbbaa",
    "Honey": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Honey.png/64px-Item_Icon_-_Honey.png?112233",
    "Apple": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Apple.png/64px-Item_Icon_-_Apple.png?332211",
    "Shadowberries": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Shadowberries.png/64px-Item_Icon_-_Shadowberries.png?445566",
    "Rootbear": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Rootbear.png/64px-Item_Icon_-_Rootbear.png?665544",
    "Glow Tulip": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Glow_Tulip.png/64px-Item_Icon_-_Glow_Tulip.png?778899",
    "Gooey Tulip": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Gooey_Tulip.png/64px-Item_Icon_-_Gooey_Tulip.png?998877",
    "Space Lettuce": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Space_Lettuce.png/64px-Item_Icon_-_Space_Lettuce.png?aabbdd",
    "Super Tomato": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Super_Tomato.png/64px-Item_Icon_-_Super_Tomato.png?ddbbaa",
    "Crunchy Crystal": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Crunchy_Crystal.png/64px-Item_Icon_-_Crunchy_Crystal.png?eeffgg",
    "Gem Crab": "https://abioticfactor.wiki.gg/images/thumb/Item_Icon_-_Gem_Crab.png/64px-Item_Icon_-_Gem_Crab.png?ggffee",
    "Any Raw Fish Filet": "https://abioticfactor.wiki.gg/images/thumb/Itemicon_filet_antefish_raw.png/64px-Itemicon_filet_antefish_raw.png?1f319e"
  },
  recipes: {}
};

// ==================== RECIPES DATA ====================
const recipes = [
  // SOUPS - Cooking Pot
  {name: "Peccary Goulash", ingredients: ["Raw Peccary Chop", "Raw Alien Drumstick", "Salt"], hunger: 23, thirst: 16, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Simple Tomato Soup", ingredients: ["Tomato", "Salt"], hunger: 12, thirst: 22, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Super Tomato Soup", ingredients: ["Super Tomato", "Salt"], hunger: 15, thirst: 22, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Split Pea Soup", ingredients: ["Canned Peas", "Salt", "Raw Pest"], hunger: 17, thirst: 21, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Carbuncle N' Dumplings", ingredients: ["Raw Dough", "Raw Carbuncle", "Canned Peas"], hunger: 23, thirst: 21, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Creamy Corn Soup", ingredients: ["Purified Corn", "Milk Sac", "Salt"], hunger: 32, thirst: 27, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Creamy Tomato Bisque", ingredients: ["Super Tomato", "Milk Sac", "Salt"], hunger: 12, thirst: 37, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Gooey Mushroom Soup", ingredients: ["Raw Larva Meat", "Carbuncle Mushroom", "Salt"], hunger: 31, thirst: 17, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Homey Pasta", ingredients: ["Antepasta", "Raw Peccary Sausages", "Tomato"], hunger: 33, thirst: 22, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Mashed Potatoes", ingredients: ["Potato", "Milk Sac", "Salt"], hunger: 8, thirst: 33, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Meatrio Medley", ingredients: ["Raw Carbuncle", "Raw Pest Rump", "Raw Alien Drumstick"], hunger: 23, thirst: 16, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Pest Goulash", ingredients: ["Raw Pest", "Raw Pest Rump", "Salt"], hunger: 14, thirst: 16, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Peccary Stew", ingredients: ["Raw Peccary Chop", "Carbuncle Mushroom", "Super Tomato"], hunger: 21, thirst: 23, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Potato and Sausage Stew", ingredients: ["Raw Peccary Sausages", "Potato"], hunger: 20, thirst: 17, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Pumpkin Soup", ingredients: ["Pumpkin", "Milk Sac", "Salt"], hunger: 21, thirst: 25, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Hearty Stew", ingredients: ["Raw Exor Heart", "Carbuncle Mushroom", "Super Tomato"], hunger: 23, thirst: 23, cookingMethod: "soup", buff: "Bodacious"},
  {name: "Meaty Stew", ingredients: ["Raw Peccary Chop", "Raw Alien Drumstick", "Raw Pest Rump"], hunger: 26, thirst: 16, cookingMethod: "soup", buff: "Heightened Senses"},
  {name: "A&L Mega-Stew", ingredients: ["Exor Arm", "Raw Alien Drumstick", "Raw Exor Heart"], hunger: 37, thirst: 16, cookingMethod: "soup", buff: "Mega-Ante"},
  {name: "Sustenance Soup", ingredients: ["Military MRE"], hunger: 18, thirst: 16, cookingMethod: "soup", buff: "Quick Reflexes"},
  {name: "Balanced Stew", ingredients: ["Raw Carbuncle", "Carbuncle Mushroom", "Salt"], hunger: 13, thirst: 17, cookingMethod: "soup", buff: "Big Brain"},
  {name: "Greyeb Chowder", ingredients: ["Greyeb", "Milk Sac", "Potato"], hunger: 12, thirst: 42, cookingMethod: "soup", buff: "Desire of the Flesh"},
  {name: "Bland Pea Soup", ingredients: ["Canned Peas", "Salt"], hunger: 12, thirst: 21, cookingMethod: "soup", buff: "Lightfooted"},
  {name: "Veggie Stew", ingredients: ["Potato", "Antiverse Wheat", "Super Tomato"], hunger: 17, thirst: 24, cookingMethod: "soup", buff: "Living Off the Land"},
  {name: "Sweet Porridge", ingredients: ["Melted Ice Cream", "Antiverse Wheat"], hunger: 10, thirst: 24, cookingMethod: "soup", buff: "Sweet Tooth"},
  {name: "Sugary Slop", ingredients: ["Doznuts", "Jowlers", "Skip"], hunger: 18, thirst: 17, cookingMethod: "soup", buff: "Sugar High"},
  {name: "Anteverse Gumbo", ingredients: ["Raw Antefish Filet", "Raw Peccary Sausages", "Potato"], hunger: 25, thirst: 17, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Harmonious Rice", ingredients: ["Raw Chordfish Filet", "Milk Sac", "Xanterium Rice"], hunger: 25, thirst: 31, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Inky Egg Drop Soup", ingredients: ["Raw Inkfish Filet", "Egg", "Carbuncle Mushroom"], hunger: 23, thirst: 22, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Lunar Bisque", ingredients: ["Raw Moon Fish Filet", "Raw Exor Heart", "Carbuncle Mushroom"], hunger: 23, thirst: 17, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Portal Fish Stew", ingredients: ["Raw Portal Fish Fillet", "Tomato", "Potato"], hunger: 21, thirst: 24, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Reservoir Reserve", ingredients: ["Raw Darkwater Fish Filet", "Greyeb", "Murkweed"], hunger: 21, thirst: 25, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Silky Consommé", ingredients: ["Raw Silken Betta Filet", "Egg", "Salt"], hunger: 38, thirst: 21, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Witching Hour Brew", ingredients: ["Raw Penumbra Filet", "Glow Eye", "Carbuncle Mushroom"], hunger: 42, thirst: 17, cookingMethod: "soup", buff: "Souper Satisfied"},
  {name: "Glacial Gazpacho", ingredients: ["Raw Frigid Queenfish Filet", "Pumpkin", "Greyeb"], hunger: 30, thirst: 25, cookingMethod: "soup", buff: "Brain Freeze"},
  {name: "Radfish Chowder", ingredients: ["Raw Radfish Filet", "Potato", "Canned Peas"], hunger: 23, thirst: 22, cookingMethod: "soup", buff: "Rad Resistant"},

  // FRYING - Frying Pan
  {name: "Cooked Carbuncle", ingredients: ["Raw Carbuncle"], hunger: 10, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Pest", ingredients: ["Raw Pest"], hunger: 12, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Pest Rump", ingredients: ["Raw Pest Rump"], hunger: 18, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Peccary Chop", ingredients: ["Raw Peccary Chop"], hunger: 15, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Peccary Sausages", ingredients: ["Raw Peccary Sausages"], hunger: 15, thirst: 5, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Alien Drumstick", ingredients: ["Raw Alien Drumstick"], hunger: 12, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Exor Heart", ingredients: ["Raw Exor Heart"], hunger: 18, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Fried Egg", ingredients: ["Egg"], hunger: 18, thirst: 6, cookingMethod: "frying", buff: "Energized"},
  {name: "Cooked Antefish Filet", ingredients: ["Raw Antefish Filet"], hunger: 12, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Chordfish Filet", ingredients: ["Raw Chordfish Filet"], hunger: 18, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Portal Fish Filet", ingredients: ["Raw Portal Fish Fillet"], hunger: 11, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Inkfish Filet", ingredients: ["Raw Inkfish Filet"], hunger: 12, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Radfish Filet", ingredients: ["Raw Radfish Filet"], hunger: 11, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Moon Fish Filet", ingredients: ["Raw Moon Fish Filet"], hunger: 12, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Darkwater Fish Filet", ingredients: ["Raw Darkwater Fish Filet"], hunger: 10, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Silken Betta Filet", ingredients: ["Raw Silken Betta Filet"], hunger: 20, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Penumbra Filet", ingredients: ["Raw Penumbra Filet"], hunger: 22, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},
  {name: "Cooked Frigid Queenfish Filet", ingredients: ["Raw Frigid Queenfish Filet"], hunger: 12, thirst: 0, cookingMethod: "frying", buff: "Well Fed"},

  // OVEN/BAKING
  {name: "Bread", ingredients: ["Raw Dough"], hunger: 12.5, thirst: 5, cookingMethod: "oven", buff: "Energized"},
  {name: "Pumpkin Bread", ingredients: ["Raw Pumpkin Dough"], hunger: 37.5, thirst: 5, cookingMethod: "oven", buff: "Energized", subRecipe: {name: "Raw Pumpkin Dough", ingredients: ["Anteverse Wheat", "Anteverse Wheat", "Milk Sac", "Pumpkin"]}},
  {name: "Cooked Baked Potato", ingredients: ["Potato"], hunger: 10, thirst: 3.75, cookingMethod: "oven", buff: "Energized"},
  {name: "Cooked Pestato", ingredients: ["Raw Pestato"], hunger: 20.7, thirst: 3.45, cookingMethod: "oven", buff: "Energized", subRecipe: {name: "Raw Pestato", ingredients: ["Raw Pest Rump", "Potato"]}},
  {name: "Cooked Fries", ingredients: ["Raw Fries"], hunger: 12.5, thirst: 3.75, cookingMethod: "oven", buff: "Energized", subRecipe: {name: "Raw Fries", ingredients: ["Potato", "Salt"]}},
  {name: "Cooked Stuffed Roast Peccary", ingredients: ["Raw Stuffed Roast Peccary"], hunger: 63, thirst: 28.75, cookingMethod: "oven", buff: "Energized", subRecipe: {name: "Raw Stuffed Roast Peccary", ingredients: ["Raw Alien Drumstick", "Carbuncle Mushroom", "Greyeb", "Canned Peas"]}},
  {name: "Simple Pest Pie", ingredients: ["Raw Simple Pest Pie"], hunger: 30, thirst: 0, cookingMethod: "oven", buff: "Energized", subRecipe: {name: "Raw Simple Pest Pie", ingredients: ["Raw Dough", "Raw Dough", "Raw Pest", "Raw Pest", "Raw Pest", "Raw Pest", "Raw Pest Rump", "Raw Pest Rump"]}},
  {name: "Pest Pot Pie", ingredients: ["Raw Pest Pot Pie"], hunger: 22.75, thirst: 3.15, cookingMethod: "oven", buff: "Energized", subRecipe: {name: "Raw Pest Pot Pie", ingredients: ["Raw Dough", "Raw Dough", "Canned Peas", "Potato", "Potato", "Raw Pest Rump", "Raw Pest Rump", "Raw Pest Rump"]}},
  {name: "Creepy Meat Pie", ingredients: ["Raw Creepy Meat Pie"], hunger: 21.5, thirst: 7.65, cookingMethod: "oven", buff: "Energized", subRecipe: {name: "Raw Creepy Meat Pie", ingredients: ["Raw Dough", "Raw Dough", "Greyeb", "Greyeb", "Carbuncle Mushroom", "Carbuncle Mushroom", "Raw Pest", "Raw Pest"]}},
  {name: "Gumdrop Cookie", ingredients: ["Raw Gumdrop Cookie Tray"], hunger: 13, thirst: 5.175, cookingMethod: "oven", buff: "Energized", subRecipe: {name: "Raw Gumdrop Cookie Tray", ingredients: ["Egg", "Anteverse Wheat", "Anteverse Wheat", "Anteverse Wheat", "Melted Ice Cream", "Jowlers"]}},
  {name: "Pumpkin Cookie", ingredients: ["Pumpkin"], hunger: 15.5, thirst: 4.725, cookingMethod: "oven", buff: "Energized"},
  {name: "Pumpkin Pie", ingredients: ["Pumpkin"], hunger: 23, thirst: 6, cookingMethod: "oven", buff: "Energized"},
  {name: "Apple Pie", ingredients: ["Apple"], hunger: 26.26, thirst: 8.775, cookingMethod: "oven", buff: "Slice of Home"},
  {name: "Salted Honey Pie", ingredients: ["Salt", "Honey"], hunger: 32.5, thirst: 3.6, cookingMethod: "oven", buff: "Energized"},
  {name: "Shadowberry Pie", ingredients: ["Shadowberries"], hunger: 28.25, thirst: 17.325, cookingMethod: "oven", buff: "Energized"},
  {name: "Carbuncle Casserole", ingredients: ["Raw Carbuncle Casserole"], hunger: 16.5, thirst: 2.25, cookingMethod: "oven", buff: "King of Carbuncles", subRecipe: {name: "Raw Carbuncle Casserole", ingredients: ["Raw Carbuncle", "Raw Carbuncle", "Raw Carbuncle", "Potato", "Potato", "Carbuncle Mushroom", "Carbuncle Mushroom", "Anteverse Cheese"]}},
  {name: "Pekkie Brekkie Hash", ingredients: ["Raw Pekkie Brekkie Hash"], hunger: 26.25, thirst: 6.75, cookingMethod: "oven", buff: "Energized", subRecipe: {name: "Raw Pekkie Brekkie Hash", ingredients: ["Egg", "Egg", "Egg", "Potato", "Potato", "Anteverse Cheese", "Anteverse Cheese", "Raw Peccary Sausages"]}},
  {name: "Carbuncle Pizza", ingredients: ["Raw Carbuncle Pizza"], hunger: 12, thirst: 2.25, cookingMethod: "oven", buff: "Energized", subRecipe: {name: "Raw Carbuncle Pizza", ingredients: ["Raw Carbuncle", "Tomato", "Anteverse Cheese", "Raw Dough"]}},
  {name: "Glowing Gâteau", ingredients: ["Raw Glowing Gâteau"], hunger: 18, thirst: 6.525, cookingMethod: "oven", buff: "Energized", subRecipe: {name: "Raw Glowing Gâteau", ingredients: ["Egg", "Egg", "Anteverse Wheat", "Anteverse Wheat", "Anteverse Wheat", "Anteverse Wheat", "Anteverse Wheat", "Anteverse Wheat", "Melted Ice Cream"]}},
  {name: "Crumbed Darkwater Fish", ingredients: ["Raw Crumbed Darkwater Fish"], hunger: 21.75, thirst: 0, cookingMethod: "oven", buff: "Fish Out of Water", subRecipe: {name: "Raw Crumbed Darkwater Fish", ingredients: ["Raw Darkwater Fish Filet", "Anteverse Wheat", "Anteverse Wheat", "Anteverse Wheat", "Anteverse Wheat", "Anteverse Wheat", "Anteverse Wheat", "Anteverse Cheese"]}},
  {name: "Roasted Nori Sheet", ingredients: ["Raw Nori Sheet Tray"], hunger: 17.5, thirst: 0, cookingMethod: "oven", buff: "Energized", subRecipe: {name: "Raw Nori Sheet Tray", ingredients: ["Murkweed", "Murkweed", "Murkweed", "Murkweed", "Murkweed", "Murkweed", "Murkweed", "Murkweed", "Murkweed", "Murkweed", "Murkweed", "Murkweed", "Fish Oil", "Salt"]}},

  // CHEF'S COUNTER - Prepared Foods
  {name: "Gooey Tulip Salad", ingredients: ["Gooey Tulip"], hunger: 15, thirst: 10, cookingMethod: "chef", buff: "Well Fed"},
  {name: "Cooked Gooey Meat Steak", ingredients: ["Cooked Gooey Meat Steak", "Glow Tulip"], hunger: 18, thirst: 5, cookingMethod: "chef", buff: "Well Fed"},
  {name: "Cosmato Salad Wrap", ingredients: ["Space Lettuce", "Tomato", "Greyeb"], hunger: 20, thirst: 12, cookingMethod: "chef", buff: "Well Fed"},

  // SUSHI & NIGIRI
  {name: "Penumbra Nigiri", ingredients: ["Raw Penumbra Filet", "Bowl of Xanterium Rice"], hunger: 16.25, thirst: 1.8, cookingMethod: "chef", buff: "Well Fed", subRecipe: {name: "Bowl of Xanterium Rice", ingredients: ["Xanterium Rice"]}},
  {name: "Mushy Crab Sushi", ingredients: ["Gem Crab", "Carbuncle Mushroom", "Bowl of Xanterium Rice"], hunger: 16, thirst: 2.25, cookingMethod: "chef", buff: "Well Fed", subRecipe: {name: "Bowl of Xanterium Rice", ingredients: ["Xanterium Rice"]}},
  {name: "Icebergiri", ingredients: ["Raw Frigid Queenfish Filet", "Bowl of Xanterium Rice"], hunger: 13.75, thirst: 1, cookingMethod: "chef", buff: "Well Fed", subRecipe: {name: "Bowl of Xanterium Rice", ingredients: ["Xanterium Rice"]}},
  {name: "Gutfish Unagi", ingredients: ["Cooked Gutfish Eel Filet", "Bowl of Xanterium Rice"], hunger: 12.5, thirst: 1, cookingMethod: "chef", buff: "Well Fed", subRecipe: {name: "Bowl of Xanterium Rice", ingredients: ["Xanterium Rice"]}},
  {name: "Fogiri", ingredients: ["Raw Chordfish Filet", "Bowl of Xanterium Rice"], hunger: 10, thirst: 1, cookingMethod: "chef", buff: "Well Fed", subRecipe: {name: "Bowl of Xanterium Rice", ingredients: ["Xanterium Rice"]}},

  // MAKI
  {name: "Antemaki", ingredients: ["Raw Antefish Filet", "Bowl of Xanterium Rice", "Roasted Nori Sheet"], hunger: 14, thirst: 1.5, cookingMethod: "chef", buff: "Well Fed", subRecipe: {name: "Bowl of Xanterium Rice", ingredients: ["Xanterium Rice"]}},
  {name: "Colorful Maki Plate", ingredients: ["Any Raw Fish Filet", "Any Raw Fish Filet", "Bowl of Xanterium Rice", "Roasted Nori Sheet", "Roasted Nori Sheet"], hunger: 16, thirst: 2, cookingMethod: "chef", buff: "Well Fed", subRecipe: {name: "Bowl of Xanterium Rice", ingredients: ["Xanterium Rice"]}},
  {name: "Rad Rice Bowl", ingredients: ["Cooked Radfish Filet", "Bowl of Xanterium Rice", "Egg", "Canned Peas", "Greyeb"], hunger: 22, thirst: 6, cookingMethod: "chef", buff: "Well Fed", subRecipe: {name: "Bowl of Xanterium Rice", ingredients: ["Xanterium Rice"]}},
  {name: "Raw Fr-eyed Rice", ingredients: ["Raw Silken Betta Filet", "Bowl of Xanterium Rice", "Roasted Nori Sheet"], hunger: 20, thirst: 1.5, cookingMethod: "chef", buff: "Well Fed", subRecipe: {name: "Bowl of Xanterium Rice", ingredients: ["Xanterium Rice"]}},

  // ICE CREAM & FROZEN TREATS
  {name: "Ice Cream", ingredients: ["Egg", "Milk Sac", "Gem Sugar"], hunger: 12, thirst: 8, cookingMethod: "chef", buff: "Sweet Tooth"},
  {name: "Honey Apple Ice Cream", ingredients: ["Ice Cream", "Honey", "Apple"], hunger: 18, thirst: 10, cookingMethod: "chef", buff: "Sweet Tooth", subRecipe: {name: "Ice Cream", ingredients: ["Egg", "Milk Sac", "Gem Sugar"]}},
  {name: "Pumpkin Ice Cream", ingredients: ["Ice Cream", "Pumpkin"], hunger: 16, thirst: 9, cookingMethod: "chef", buff: "Sweet Tooth", subRecipe: {name: "Ice Cream", ingredients: ["Egg", "Milk Sac", "Gem Sugar"]}},
  {name: "Shadowberry Milkshake", ingredients: ["Ice Cream", "Shadowberries"], hunger: 15, thirst: 12, cookingMethod: "chef", buff: "Sweet Tooth", subRecipe: {name: "Ice Cream", ingredients: ["Egg", "Milk Sac", "Gem Sugar"]}},
  {name: "Rootbear Float", ingredients: ["Ice Cream", "Rootbear"], hunger: 14, thirst: 15, cookingMethod: "chef", buff: "Sweet Tooth", subRecipe: {name: "Ice Cream", ingredients: ["Egg", "Milk Sac", "Gem Sugar"]}}
];

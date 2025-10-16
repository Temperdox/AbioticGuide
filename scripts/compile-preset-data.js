const fs = require('fs');
const path = require('path');

const presetsDir = path.join(__dirname, '..', 'data', 'presets');
const outputDir = path.join(__dirname, '..', 'src', 'data');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// File mapping with categories
const fileMapping = {
    'Base and Building': {
        'Base defense': 'base_defense.txt',
        'Furniture and Benches': 'furniture_benches.txt',
        'Light and Power': 'light_power.txt'
    },
    'Food': {
        'Farming': 'farming.txt',
        'Fish': 'fish.txt',
        'Food and Cooking': 'food_cooking.txt'
    },
    'People and Enemies': {
        'Enemies': 'enemies.txt',
        'People': 'people.txt',
        'Traders': 'traders.txt'
    },
    'Utility and Travel': {
        'Health and Medical': 'health_medical.txt',
        'Tools': 'tools.txt',
        'Travel and Vehicles': 'travel_vehicles.txt'
    },
    'Weapons and Gear': {
        'Armor and Gear': 'armor_gear.txt',
        'Weapons and Ammo': 'weapons_ammo.txt'
    },
    'Resources': {
        'Resource Nodes': 'resource_nodes.txt',
        'Resources and Sub-components': 'resources_subcomponents.txt'
    }
};

// Function to parse a preset file (each line is a JSON object)
function parsePresetFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const items = [];

    for (const line of lines) {
        try {
            const item = JSON.parse(line);
            items.push(item);
        } catch (error) {
            console.error(`Error parsing line in ${filePath}:`, error.message);
        }
    }

    return items;
}

// Compile all preset data
function compilePresetData() {
    const compiledData = {};

    for (const [mainCategory, subcategories] of Object.entries(fileMapping)) {
        compiledData[mainCategory] = {};

        for (const [subcategory, filename] of Object.entries(subcategories)) {
            const filePath = path.join(presetsDir, filename);

            if (fs.existsSync(filePath)) {
                console.log(`Processing: ${mainCategory} > ${subcategory} (${filename})`);
                compiledData[mainCategory][subcategory] = parsePresetFile(filePath);
                console.log(`  Loaded ${compiledData[mainCategory][subcategory].length} items`);
            } else {
                console.error(`File not found: ${filePath}`);
                compiledData[mainCategory][subcategory] = [];
            }
        }
    }

    return compiledData;
}

// Main execution
console.log('Compiling preset data from Abiotic Factor Interactive Maps...\n');
const presetData = compilePresetData();

// Count total items
let totalItems = 0;
for (const mainCategory of Object.values(presetData)) {
    for (const items of Object.values(mainCategory)) {
        totalItems += items.length;
    }
}

console.log(`\nTotal items compiled: ${totalItems}`);

// Write to JSON file
const jsonOutputPath = path.join(outputDir, 'abiotic-preset-data.json');
fs.writeFileSync(jsonOutputPath, JSON.stringify(presetData, null, 2));
console.log(`\nJSON data written to: ${jsonOutputPath}`);

// Write to JavaScript module
const jsOutputPath = path.join(outputDir, 'abiotic-preset-data.js');
const jsContent = `/**
 * Abiotic Factor Interactive Maps - Preset Data
 *
 * This data was compiled from the Abiotic Factor Interactive Maps GitHub repository
 * Source: https://github.com/ComradeAleks/Abiotic-Factor-Interactive-maps/tree/main/data/presets/
 *
 * Total Items: ${totalItems}
 * Last Updated: ${new Date().toISOString().split('T')[0]}
 */

export const abioticPresetData = ${JSON.stringify(presetData, null, 2)};

// Helper function to get all items from a category
export function getItemsByCategory(mainCategory, subcategory = null) {
    if (!abioticPresetData[mainCategory]) {
        return [];
    }

    if (subcategory) {
        return abioticPresetData[mainCategory][subcategory] || [];
    }

    // Return all items from all subcategories in the main category
    const items = [];
    for (const subcategoryItems of Object.values(abioticPresetData[mainCategory])) {
        items.push(...subcategoryItems);
    }
    return items;
}

// Helper function to search items by name
export function searchItems(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [mainCategory, subcategories] of Object.entries(abioticPresetData)) {
        for (const [subcategory, items] of Object.entries(subcategories)) {
            for (const item of items) {
                if (item.item.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        ...item,
                        mainCategory,
                        subcategory
                    });
                }
            }
        }
    }

    return results;
}

// Helper function to get items with recipes
export function getItemsWithRecipes() {
    const results = [];

    for (const [mainCategory, subcategories] of Object.entries(abioticPresetData)) {
        for (const [subcategory, items] of Object.entries(subcategories)) {
            for (const item of items) {
                if (item.Recipe && item.Recipe !== false) {
                    results.push({
                        ...item,
                        mainCategory,
                        subcategory
                    });
                }
            }
        }
    }

    return results;
}

// Helper function to get items by location
export function getItemsByLocation(location) {
    const results = [];
    const lowerLocation = location.toLowerCase();

    for (const [mainCategory, subcategories] of Object.entries(abioticPresetData)) {
        for (const [subcategory, items] of Object.entries(subcategories)) {
            for (const item of items) {
                if (item['Appears in'] && Array.isArray(item['Appears in'])) {
                    for (const loc of item['Appears in']) {
                        if (loc.toLowerCase().includes(lowerLocation)) {
                            results.push({
                                ...item,
                                mainCategory,
                                subcategory
                            });
                            break;
                        }
                    }
                }
            }
        }
    }

    return results;
}

export default abioticPresetData;
`;

fs.writeFileSync(jsOutputPath, jsContent);
console.log(`JavaScript module written to: ${jsOutputPath}`);

console.log('\nCompilation complete!');

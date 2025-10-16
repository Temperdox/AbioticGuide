const fs = require('fs');
const path = require('path');

const data = require('../src/data/abiotic-preset-data.json');

let output = '=== ABIOTIC FACTOR PRESET DATA - COMPLETE INDEX ===\n\n';

for (const [mainCategory, subcategories] of Object.entries(data)) {
  output += '\n' + mainCategory.toUpperCase() + '\n';
  output += '='.repeat(mainCategory.length) + '\n';

  for (const [subcategory, items] of Object.entries(subcategories)) {
    output += '  ' + subcategory + ': ' + items.length + ' items\n';

    // Show first 5 items as sample
    const sampleItems = items.slice(0, 5).map(item => item.item).join(', ');
    output += '    Sample: ' + sampleItems + (items.length > 5 ? ', ...' : '') + '\n';
  }
}

output += '\n\n=== STATISTICS ===\n';
let totalItems = 0;
let totalWithRecipes = 0;
let totalWithDrops = 0;
let totalWithTrades = 0;

for (const category of Object.values(data)) {
  for (const items of Object.values(category)) {
    totalItems += items.length;
    totalWithRecipes += items.filter(i => i.Recipe !== false).length;
    totalWithDrops += items.filter(i => i.Drops !== false || i['Harvestable Drops'] !== false).length;
    totalWithTrades += items.filter(i => i.Trade !== false).length;
  }
}

output += 'Total Items: ' + totalItems + '\n';
output += 'Items with Recipes: ' + totalWithRecipes + '\n';
output += 'Items with Drops: ' + totalWithDrops + '\n';
output += 'Items with Trades: ' + totalWithTrades + '\n';

const outputPath = path.join(__dirname, '..', 'PRESET_DATA_INDEX.txt');
fs.writeFileSync(outputPath, output);

console.log(output);
console.log('\nIndex written to: ' + outputPath);

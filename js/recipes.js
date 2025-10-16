// ==================== RECIPES PAGE ====================

let inventory = {};
let pinnedRecipes = [];
let currentFilter = 'all';
let currentMethod = '';
let currentBuff = '';
let currentSearchQuery = '';
let allIngredients = new Set();

// ==================== ADVANCED SEARCH PARSER ====================

// Tokenize the search query
function tokenizeSearch(query) {
  const tokens = [];
  let current = '';
  let inParens = 0;

  for (let i = 0; i < query.length; i++) {
    const char = query[i];

    if (char === '(') {
      if (current.trim()) {
        tokens.push({ type: 'TERM', value: current.trim() });
        current = '';
      }
      tokens.push({ type: 'LPAREN', value: '(' });
      inParens++;
    } else if (char === ')') {
      if (current.trim()) {
        tokens.push({ type: 'TERM', value: current.trim() });
        current = '';
      }
      tokens.push({ type: 'RPAREN', value: ')' });
      inParens--;
    } else if (char === ' ' && inParens === 0) {
      if (current.trim()) {
        tokens.push({ type: 'TERM', value: current.trim() });
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    tokens.push({ type: 'TERM', value: current.trim() });
  }

  return tokens;
}

// Parse a search term into field and value
function parseSearchTerm(term) {
  // Replace underscores with spaces
  term = term.replace(/_/g, ' ');

  // Check for NOT operator
  const isNegated = term.startsWith('-');
  if (isNegated) {
    term = term.substring(1);
  }

  // Check for field:value syntax
  const colonIndex = term.indexOf(':');
  let field = 'name';
  let value = term;

  if (colonIndex > 0) {
    field = term.substring(0, colonIndex).trim();
    value = term.substring(colonIndex + 1).trim();
  }

  return { field, value, isNegated };
}

// Check if a recipe matches a search term
function recipeMatchesTerm(recipe, term) {
  const { field, value, isNegated } = parseSearchTerm(term);
  const searchValue = value.toLowerCase();
  let matches;

  switch (field) {
    case 'name':
      matches = recipe.name.toLowerCase().includes(searchValue);
      break;
    case 'buff':
      matches = recipe.buff.toLowerCase().includes(searchValue);
      break;
    case 'buff desc':
    case 'buff description':
      const buffDesc = buffDescriptions[recipe.buff] || '';
      matches = buffDesc.toLowerCase().includes(searchValue);
      break;
    case 'ingredients':
    case 'ingredient':
      matches = recipe.ingredients.some(ing => ing.toLowerCase().includes(searchValue));
      break;
    case 'method':
      matches = recipe.cookingMethod.toLowerCase().includes(searchValue);
      break;
    default:
      // If field not recognized, search in name
      matches = recipe.name.toLowerCase().includes(searchValue);
  }

  return isNegated ? !matches : matches;
}

// Evaluate a group of tokens (handles OR and AND)
function evaluateTokenGroup(recipe, tokens) {
  if (tokens.length === 0) return true;

  // Split by OR operator (||)
  const orGroups = [];
  let currentGroup = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'TERM' && token.value === '||') {
      if (currentGroup.length > 0) {
        orGroups.push(currentGroup);
        currentGroup = [];
      }
    } else {
      currentGroup.push(token);
    }
  }
  if (currentGroup.length > 0) {
    orGroups.push(currentGroup);
  }

  // Each OR group must have at least one match (OR logic)
  for (const group of orGroups) {
    if (evaluateAndGroup(recipe, group)) {
      return true;
    }
  }

  return orGroups.length === 0;
}

// Evaluate an AND group (all terms must match)
function evaluateAndGroup(recipe, tokens) {
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'LPAREN') {
      // Find matching closing paren
      let depth = 1;
      let j = i + 1;
      const innerTokens = [];

      while (j < tokens.length && depth > 0) {
        if (tokens[j].type === 'LPAREN') depth++;
        else if (tokens[j].type === 'RPAREN') depth--;

        if (depth > 0) {
          innerTokens.push(tokens[j]);
        }
        j++;
      }

      // Recursively evaluate the group
      if (!evaluateTokenGroup(recipe, innerTokens)) {
        return false;
      }

      i = j;
    } else if (token.type === 'TERM') {
      // Skip AND operator (+)
      if (token.value === '+') {
        i++;
        continue;
      }

      // Evaluate the term
      if (!recipeMatchesTerm(recipe, token.value)) {
        return false;
      }
      i++;
    } else {
      i++;
    }
  }

  return true;
}

// Main search function
function recipeMatchesAdvancedSearch(recipe, query) {
  if (!query || query.trim() === '') return true;

  const tokens = tokenizeSearch(query);
  return evaluateTokenGroup(recipe, tokens);
}

// Generate random pastel color
function generatePastelColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.random() * 20; // 60-80%
  const lightness = 70 + Math.random() * 15; // 70-85%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function initRecipesPage() {
  inventory = getCookie('abioticInventory') || {};
  pinnedRecipes = getCookie('pinnedRecipes') || [];

  // Reset allIngredients to a Set each time the page initializes
  allIngredients = new Set();
  recipes.forEach(recipe => {
    recipe.ingredients.forEach(ing => allIngredients.add(ing));
  });
  allIngredients = Array.from(allIngredients).sort();

  const searchInput = document.getElementById('ingredientSearch');
  const suggestionsDiv = document.getElementById('suggestions');

  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  if (suggestionsDiv) {
    suggestionsDiv.addEventListener('click', handleSuggestionClick);
  }

  document.addEventListener('click', handleOutsideClick);

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', handleFilterClick);
  });

  document.querySelectorAll('.method-btn').forEach(btn => {
    btn.addEventListener('click', handleMethodClick);
  });

  const buffFilter = document.getElementById('buffFilter');
  if (buffFilter) {
    buffFilter.addEventListener('change', handleBuffChange);
  }

  const recipeSearchInput = document.getElementById('recipeSearch');
  const clearRecipeSearchBtn = document.getElementById('clearRecipeSearch');
  if (recipeSearchInput) {
    recipeSearchInput.addEventListener('input', handleRecipeSearch);
  }
  if (clearRecipeSearchBtn) {
    clearRecipeSearchBtn.addEventListener('click', clearRecipeSearch);
  }

  if (Object.keys(inventory).length > 0) {
    renderInventory();
  }

  renderRecipes();

  // Initialize tooltips for help button
  const helpBtn = document.querySelector('.search-help-btn');
  if (helpBtn) {
    new bootstrap.Tooltip(helpBtn);
  }

  // Handle window resize to reset expanded state when switching from mobile to desktop
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 768) {
        // Reset all expanded states on desktop
        document.body.classList.remove('has-expanded-card');
        document.querySelectorAll('.recipe-card').forEach(card => {
          card.classList.remove('expanded', 'collapsed');
          card.style.display = '';
        });
      }
    }, 250);
  });
}

function handleSearch(e) {
  const suggestionsDiv = document.getElementById('suggestions');
  const query = e.target.value.toLowerCase().trim();

  if (query.length < 2) {
    suggestionsDiv.style.display = 'none';
    return;
  }

  const matches = allIngredients.filter(ing =>
    ing.toLowerCase().includes(query)
  );

  if (matches.length > 0) {
    suggestionsDiv.innerHTML = matches.map(ing =>
      `<div class="suggestion-item" data-ingredient="${ing}">
        ${ing}
        ${inventory[ing] ? '<span class="badge bg-success ms-2">In Inventory</span>' : ''}
      </div>`
    ).join('');
    suggestionsDiv.style.display = 'block';
  } else {
    suggestionsDiv.style.display = 'none';
  }
}

function handleSuggestionClick(e) {
  const item = e.target.closest('.suggestion-item');
  if (item) {
    const ingredient = item.dataset.ingredient;
    addToInventory(ingredient);
    document.getElementById('ingredientSearch').value = '';
    document.getElementById('suggestions').style.display = 'none';
  }
}

function handleOutsideClick(e) {
  const searchInput = document.getElementById('ingredientSearch');
  const suggestionsDiv = document.getElementById('suggestions');

  if (searchInput && suggestionsDiv &&
    !searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
    suggestionsDiv.style.display = 'none';
  }
}

function handleFilterClick(e) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  currentFilter = e.target.dataset.filter;
  renderRecipes();
}

function handleMethodClick(e) {
  const btn = e.currentTarget;
  const method = btn.dataset.method;

  // Toggle the method filter
  if (btn.classList.contains('active')) {
    btn.classList.remove('active');
    currentMethod = '';
  } else {
    document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMethod = method;
  }

  renderRecipes();
}

function handleBuffChange(e) {
  currentBuff = e.target.value;
  renderRecipes();
}

function handleRecipeSearch(e) {
  currentSearchQuery = e.target.value.trim();
  const clearBtn = document.getElementById('clearRecipeSearch');
  if (clearBtn) {
    clearBtn.style.display = currentSearchQuery ? 'block' : 'none';
  }
  renderRecipes();
}

function clearRecipeSearch() {
  const searchInput = document.getElementById('recipeSearch');
  if (searchInput) {
    searchInput.value = '';
    currentSearchQuery = '';
  }
  const clearBtn = document.getElementById('clearRecipeSearch');
  if (clearBtn) {
    clearBtn.style.display = 'none';
  }
  renderRecipes();
}

function addToInventory(ingredient) {
  if (!inventory[ingredient]) {
    inventory[ingredient] = 1;
  } else {
    inventory[ingredient]++;
  }
  setCookie('abioticInventory', inventory);
  renderInventory();
  renderRecipes(currentFilter);
}

function updateQuantity(ingredient, delta) {
  inventory[ingredient] = Math.max(0, (inventory[ingredient] || 0) + delta);
  // Keep items at 0 quantity instead of removing them
  setCookie('abioticInventory', inventory);
  renderInventory();
  renderRecipes(currentFilter);
}

function setQuantity(ingredient, value) {
  // Keep items at 0 quantity instead of removing them
  inventory[ingredient] = parseInt(value) || 0;
  setCookie('abioticInventory', inventory);
  renderInventory();
  renderRecipes();
}

function removeFromInventory(ingredient) {
  delete inventory[ingredient];
  setCookie('abioticInventory', inventory);
  renderInventory();
  renderRecipes();
}

function clearInventory() {
  if (confirm('Are you sure you want to clear your entire inventory?')) {
    inventory = {};
    deleteCookie('abioticInventory');
    renderInventory();
    renderRecipes();
  }
}

function togglePin(recipeName) {
  const index = pinnedRecipes.indexOf(recipeName);
  if (index > -1) {
    pinnedRecipes.splice(index, 1);
  } else {
    pinnedRecipes.push(recipeName);
  }
  setCookie('pinnedRecipes', pinnedRecipes);
  renderRecipes();
}

function craftRecipe(recipeName) {
  const recipe = recipes.find(r => r.name === recipeName);
  if (!recipe) return;

  const canCraft = recipe.ingredients.every(ing => inventory[ing] && inventory[ing] >= 1);
  if (!canCraft) {
    alert('Not enough ingredients to craft this recipe!');
    return;
  }

  recipe.ingredients.forEach(ing => {
    inventory[ing] -= 1;
    // Keep items at 0 quantity instead of removing them
  });

  setCookie('abioticInventory', inventory);
  renderInventory();
  renderRecipes();

  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 150px;
    right: 20px;
    background: linear-gradient(135deg, #27ae60, #229954);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  message.innerHTML = `<strong><i class="fas fa-check-circle"></i> Crafted: ${recipeName}</strong>`;
  document.body.appendChild(message);

  setTimeout(() => {
    message.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => message.remove(), 300);
  }, 2000);
}

function renderInventory() {
  const inventoryContainer = document.getElementById('inventoryContainer');
  const items = Object.keys(inventory);

  if (items.length === 0) {
    inventoryContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>Your inventory is empty<br><small>Search and add ingredients above</small></p>
      </div>`;
    return;
  }

  inventoryContainer.innerHTML = items.map(ing => {
    const quantity = inventory[ing];
    const isZero = quantity === 0;
    return `
    <div class="inventory-item ${isZero ? 'zero-quantity' : ''}">
      <div class="d-flex align-items-center">
        ${getImageTag('ingredients', ing, 'inventory-item-img')}
        <strong>${ing}</strong>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="updateQuantity('${ing}', -1)">
          <i class="fas fa-minus"></i>
        </button>
        <input type="number" class="qty-input" value="${quantity}"
               onchange="setQuantity('${ing}', this.value)" min="0">
        <button class="qty-btn" onclick="updateQuantity('${ing}', 1)">
          <i class="fas fa-plus"></i>
        </button>
        <button class="remove-btn" onclick="removeFromInventory('${ing}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
  }).join('');
}

function calculateCraftableCount(recipe) {
  if (recipe.ingredients.length === 0) return 0;

  const counts = recipe.ingredients.map(ing => {
    return inventory[ing] ? Math.floor(inventory[ing]) : 0;
  });

  return Math.min(...counts);
}

function canMakeRecipe(recipe) {
  const hasAll = recipe.ingredients.every(ing => inventory[ing] && inventory[ing] > 0);
  const hasSome = recipe.ingredients.some(ing => inventory[ing] && inventory[ing] > 0);
  return { hasAll, hasSome };
}

function groupIngredientCounts(ingredients) {
  const counts = {};
  ingredients.forEach(ing => {
    counts[ing] = (counts[ing] || 0) + 1;
  });
  return counts;
}

function getIngredientColor(index) {
  const colors = [
    'rgb(255, 107, 107)', // Red
    'rgb(255, 184, 77)',  // Orange
    'rgb(255, 234, 167)', // Yellow
    'rgb(119, 221, 119)', // Green
    'rgb(84, 160, 255)',  // Blue
    'rgb(162, 155, 254)', // Purple
    'rgb(255, 121, 198)', // Pink
    'rgb(118, 239, 239)', // Cyan
  ];
  return colors[index % colors.length];
}

function getPastelColor(index) {
  const colors = [
    'hsl(10, 85%, 75%)',   // Pastel Red
    'hsl(30, 85%, 75%)',   // Pastel Orange
    'hsl(50, 85%, 75%)',   // Pastel Yellow
    'hsl(120, 60%, 75%)',  // Pastel Green
    'hsl(200, 85%, 75%)',  // Pastel Blue
    'hsl(270, 70%, 78%)',  // Pastel Purple
    'hsl(330, 85%, 80%)',  // Pastel Pink
    'hsl(180, 70%, 75%)',  // Pastel Cyan
    'hsl(150, 60%, 75%)',  // Pastel Mint
    'hsl(280, 65%, 78%)',  // Pastel Lavender
  ];
  return colors[index % colors.length];
}

function getMultiColorGradient(index) {
  const gradients = [
    'linear-gradient(135deg, #FF1744, #FF6F00, #FDD835)',  // Bright Red-Orange-Yellow
    'linear-gradient(135deg, #D500F9, #651FFF, #FF4081)',  // Magenta-Purple-Pink
    'linear-gradient(135deg, #FFEA00, #FF9100, #FF1744)',  // Yellow-Orange-Red
    'linear-gradient(135deg, #F50057, #D500F9, #FFAB00)',  // Pink-Magenta-Amber
    'linear-gradient(135deg, #AA00FF, #FF1744, #FFAB00)',  // Purple-Red-Gold
    'linear-gradient(135deg, #FF6F00, #D500F9, #FF1744)',  // Orange-Magenta-Red
    'linear-gradient(135deg, #FFAB00, #F50057, #AA00FF)',  // Gold-Pink-Purple
    'linear-gradient(135deg, #FF1744, #FFEA00, #FF6F00)',  // Red-Yellow-Orange
    'linear-gradient(135deg, #651FFF, #F50057, #FDD835)',  // Purple-Pink-Yellow
    'linear-gradient(135deg, #FF9100, #AA00FF, #FF4081)',  // Orange-Purple-Pink
  ];
  return gradients[index % gradients.length];
}

function toggleRecipeCard(event, recipeName) {
  event.stopPropagation();

  // Only enable accordion on mobile (768px or less)
  if (window.innerWidth > 768) {
    return;
  }

  const clickedCard = document.querySelector(`.recipe-card[data-recipe="${recipeName}"]`);
  const allCards = document.querySelectorAll('.recipe-card');
  const isCurrentlyExpanded = clickedCard.classList.contains('expanded');

  // If clicking the currently expanded card, collapse it
  if (isCurrentlyExpanded) {
    clickedCard.classList.remove('expanded');
    clickedCard.classList.add('collapsed');
    document.body.classList.remove('has-expanded-card');

    // Show all other cards again
    allCards.forEach(card => {
      if (card !== clickedCard) {
        card.style.display = '';
      }
    });
  } else {
    // Collapse any currently expanded card
    allCards.forEach(card => {
      card.classList.remove('expanded');
      card.classList.add('collapsed');
    });

    // Expand the clicked card
    clickedCard.classList.remove('collapsed');
    clickedCard.classList.add('expanded');
    document.body.classList.add('has-expanded-card');
  }
}

function renderRecipes() {
  // Reset expanded state when re-rendering
  document.body.classList.remove('has-expanded-card');

  let filtered = recipes;

  // Apply advanced search filter
  if (currentSearchQuery) {
    filtered = filtered.filter(r => recipeMatchesAdvancedSearch(r, currentSearchQuery));
  }

  // Apply quick filter
  if (currentFilter === 'pinned') {
    filtered = filtered.filter(r => pinnedRecipes.includes(r.name));
  } else if (currentFilter === 'canMake') {
    filtered = filtered.filter(r => canMakeRecipe(r).hasAll);
  }

  // Apply cooking method filter
  if (currentMethod) {
    filtered = filtered.filter(r => r.cookingMethod === currentMethod);
  }

  // Apply buff filter
  if (currentBuff) {
    filtered = filtered.filter(r => r.buff === currentBuff);
  }

  filtered.sort((a, b) => {
    const aPinned = pinnedRecipes.includes(a.name);
    const bPinned = pinnedRecipes.includes(b.name);

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    const aStatus = canMakeRecipe(a);
    const bStatus = canMakeRecipe(b);

    if (aStatus.hasAll && !bStatus.hasAll) return -1;
    if (!aStatus.hasAll && bStatus.hasAll) return 1;
    if (!aStatus.hasAll && !bStatus.hasAll) {
      if (aStatus.hasSome && !bStatus.hasSome) return -1;
      if (!aStatus.hasSome && bStatus.hasSome) return 1;
    }
    return 0;
  });

  const recipesContainer = document.getElementById('recipesContainer');

  if (filtered.length === 0) {
    let emptyMessage = 'No recipes found';
    if (currentSearchQuery) {
      emptyMessage = `No recipes found matching "${currentSearchQuery}"`;
    } else if (currentFilter === 'pinned') {
      emptyMessage = 'No pinned recipes';
    } else if (currentFilter === 'canMake') {
      emptyMessage = 'No recipes you can make with current inventory';
    }

    recipesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>${emptyMessage}</p>
      </div>`;
    return;
  }

  recipesContainer.innerHTML = filtered.map(recipe => {
    const status = canMakeRecipe(recipe);
    const craftableCount = calculateCraftableCount(recipe);
    const isPinned = pinnedRecipes.includes(recipe.name);

    let cardClass = '';
    if (isPinned) cardClass += 'pinned ';
    if (status.hasAll) cardClass += 'can-make';
    else if (status.hasSome) cardClass += 'partial-make';

    const statusIcon = status.hasAll ? '<i class="fas fa-check-circle text-success"></i>' :
      (status.hasSome ? '<i class="fas fa-exclamation-circle" style="color: #f39c12;"></i>' : '');

    const buffDesc = buffDescriptions[recipe.buff] || "No description available.";

    // Generate random starting hues for color cycling
    const startHue1 = Math.floor(Math.random() * 360);
    const startHue2 = Math.floor(Math.random() * 360);
    const startHue3 = Math.floor(Math.random() * 360);

    // Generate random speeds for rotation and color cycling
    const speed1 = (2 + Math.random() * 4).toFixed(1);
    const speed2 = (3 + Math.random() * 8).toFixed(1);
    const speed3 = (4 + Math.random() * 12).toFixed(1);
    const hueSpeed1 = (4 + Math.random() * 8).toFixed(1);
    const hueSpeed2 = (5 + Math.random() * 10).toFixed(1);
    const hueSpeed3 = (6 + Math.random() * 12).toFixed(1);

    // Generate random directions
    const direction1 = Math.random() > 0.5 ? 'normal' : 'reverse';
    const direction2 = Math.random() > 0.5 ? 'normal' : 'reverse';
    const direction3 = Math.random() > 0.5 ? 'normal' : 'reverse';

    const countBadge = craftableCount > 0 ?
      `<span class="craftable-count" style="--start-hue-1: ${startHue1}; --start-hue-2: ${startHue2}; --start-hue-3: ${startHue3}; --speed-1: ${speed1}s; --speed-2: ${speed2}s; --speed-3: ${speed3}s; --hue-speed-1: ${hueSpeed1}s; --hue-speed-2: ${hueSpeed2}s; --hue-speed-3: ${hueSpeed3}s; --dir-1: ${direction1}; --dir-2: ${direction2}; --dir-3: ${direction3};"><span class="badge-content"><i class="fas fa-check"></i> Can make: ${craftableCount}x</span></span>` : '';

    const methodIcons = {
      'soup': '<i class="fas fa-mug-hot"></i>',
      'frying': '<i class="fas fa-utensils"></i>',
      'oven': '<i class="fas fa-bread-slice"></i>',
      'chef': '<i class="fas fa-hat-chef"></i>'
    };
    const methodIcon = methodIcons[recipe.cookingMethod] || '';
    const methodNames = {
      'soup': 'Soup',
      'frying': 'Frying',
      'oven': 'Oven',
      'chef': "Chef's Counter"
    };
    const methodName = methodNames[recipe.cookingMethod] || '';

    return `
      <div class="recipe-card ${cardClass} collapsed" data-recipe="${recipe.name}">
        <button class="pin-checkbox ${isPinned ? 'pinned' : ''}"
                onclick="togglePin('${recipe.name}'); event.stopPropagation();"
                title="${isPinned ? 'Unpin this recipe' : 'Pin this recipe'}">
          <i class="fas fa-thumbtack"></i>
        </button>
        <div class="recipe-card-header" onclick="toggleRecipeCard(event, '${recipe.name}')">
          <div class="recipe-card-header-content">
            ${getImageTag('recipes', recipe.name, 'recipe-img')}
            <div style="flex: 1;">
              <h5 class="mb-1">${recipe.name} ${statusIcon}</h5>
              <span class="badge method-badge">${methodIcon} ${methodName}</span>
              ${countBadge}
            </div>
          </div>
          <i class="fas fa-chevron-down recipe-card-toggle"></i>
        </div>
        <div class="recipe-card-body">
          <div class="recipe-card-content">
            <div class="d-flex justify-content-between align-items-start mb-2 desktop-header">
              <div class="d-flex align-items-center flex-wrap">
                ${getImageTag('recipes', recipe.name, 'recipe-img')}
                <div>
                  <h5 class="mb-1">${recipe.name} ${statusIcon} ${countBadge}</h5>
                  <span class="badge method-badge">${methodIcon} ${methodName}</span>
                </div>
              </div>
              <span class="badge buff-badge" data-bs-toggle="tooltip" data-bs-placement="left"
                    data-bs-html="true" title="<strong>${recipe.buff}</strong><br>${buffDesc}">
                ${recipe.buff}
              </span>
            </div>
            <div class="mb-2">
              <strong>Ingredients:</strong>
              ${Object.entries(groupIngredientCounts(recipe.ingredients)).map(([ing, count]) => {
                const hasSubRecipe = recipe.subRecipe && recipe.subRecipe.name === ing;
                const borderStyle = hasSubRecipe ? `class="gradient-border-wrapper" style="background: ${getMultiColorGradient(0)}; padding: 3px; display: inline-block; width: fit-content; height: fit-content; border-radius: 30px;"` : '';

                // Special handling for "Any Raw Fish Filet"
                if (ing === "Any Raw Fish Filet") {
                  return `<span class="ingredient-tag ${inventory[ing] ? 'in-inventory' : ''}"
                                onclick="addToInventory('${ing}'); event.stopPropagation();"
                                data-bs-toggle="tooltip" data-bs-placement="top"
                                title="Can use: Chordfish, Portal Fish, Radfish, Inkfish, Moon Fish, Frigid Queenfish, or Silken Betta Filet">
                      ${getImageTag('ingredients', ing, 'ingredient-img')}${ing} ${count > 1 ? `<span class="ingredient-count">x${count}</span>` : ''}
                    </span>`;
                }

                return hasSubRecipe ?
                  `<span ${borderStyle}>
                    <span class="ingredient-tag ${inventory[ing] ? 'in-inventory' : ''}" style="margin: 0;"
                          onclick="addToInventory('${ing}'); event.stopPropagation();">
                      ${getImageTag('ingredients', ing, 'ingredient-img')}${ing} ${count > 1 ? `<span class="ingredient-count">x${count}</span>` : ''}
                    </span>
                  </span>` :
                  `<span class="ingredient-tag ${inventory[ing] ? 'in-inventory' : ''}"
                          onclick="addToInventory('${ing}'); event.stopPropagation();">
                      ${getImageTag('ingredients', ing, 'ingredient-img')}${ing} ${count > 1 ? `<span class="ingredient-count">x${count}</span>` : ''}
                    </span>`;
              }).join('')}
            </div>
            ${recipe.subRecipe ? `
            <div class="sub-recipe-card mb-2" style="background: ${getMultiColorGradient(0)}; padding: 3px; display: block; width: fit-content; height: fit-content; border-radius: 30px;">
              <div style="background: rgb(24, 44, 76); border-radius: 27px; padding: 0.75rem;">
                <div class="sub-recipe-header">
                  <i class="fas fa-layer-group"></i> <strong>Sub-Recipe: ${recipe.subRecipe.name}</strong>
                </div>
                <div class="sub-recipe-body">
                  ${(() => {
                    const ingredientsWithSubs = Object.keys(groupIngredientCounts(recipe.subRecipe.ingredients))
                      .filter(ing => ingredientRecipes[ing] && ingredientRecipes[ing].ingredients.length > 0);
                    const colorMap = {};
                    ingredientsWithSubs.forEach((ing, idx) => {
                      colorMap[ing] = idx + 1;
                    });

                    const ingredientsHTML = Object.entries(groupIngredientCounts(recipe.subRecipe.ingredients)).map(([ing, count]) => {
                      const hasSubRecipe = colorMap[ing];
                      const borderStyle = hasSubRecipe ? `class="gradient-border-wrapper" style="background: ${getMultiColorGradient(hasSubRecipe)}; padding: 3px; display: inline-block; width: fit-content; height: fit-content; border-radius: 30px;"` : '';
                      return hasSubRecipe ?
                        `<span ${borderStyle}>
                          <span class="ingredient-tag ${inventory[ing] ? 'in-inventory' : ''}" style="margin: 0;"
                                  onclick="addToInventory('${ing}'); event.stopPropagation();">
                              ${getImageTag('ingredients', ing, 'ingredient-img')}${ing} ${count > 1 ? `<span class="ingredient-count">x${count}</span>` : ''}
                            </span>
                        </span>` :
                        `<span class="ingredient-tag ${inventory[ing] ? 'in-inventory' : ''}"
                                onclick="addToInventory('${ing}'); event.stopPropagation();">
                            ${getImageTag('ingredients', ing, 'ingredient-img')}${ing} ${count > 1 ? `<span class="ingredient-count">x${count}</span>` : ''}
                          </span>`;
                    }).join('');

                    const subRecipesHTML = ingredientsWithSubs.map((ing, idx) => {
                      const subSubRecipe = ingredientRecipes[ing];
                      const gradientIndex = colorMap[ing];
                      return `
                      <div class="sub-sub-recipe-card" style="background: ${getMultiColorGradient(gradientIndex)}; padding: 3px; display: block; width: fit-content; height: fit-content; border-radius: 30px;">
                        <div style="background: rgb(24, 44, 76); border-radius: 27px; padding: 0.5rem;">
                          <div class="sub-sub-recipe-header">
                            <i class="fas fa-layer-group"></i> <strong>${subSubRecipe.name}</strong>
                          </div>
                          <div class="sub-sub-recipe-body">
                            ${Object.entries(groupIngredientCounts(subSubRecipe.ingredients)).map(([subIng, subCount]) =>
                              `<span class="ingredient-tag ${inventory[subIng] ? 'in-inventory' : ''}"
                                        onclick="addToInventory('${subIng}'); event.stopPropagation();">
                                    ${getImageTag('ingredients', subIng, 'ingredient-img')}${subIng} ${subCount > 1 ? `<span class="ingredient-count">x${subCount}</span>` : ''}
                                  </span>`
                            ).join('')}
                          </div>
                        </div>
                      </div>
                      `;
                    }).join('');

                    return `<div class="sub-recipe-ingredients">${ingredientsHTML}</div>${subRecipesHTML}`;
                  })()}
                </div>
              </div>
            </div>
            ` : ''}
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <span class="stat-display">
                  <i class="fas fa-drumstick-bite stat-icon"></i>
                  <strong>Hunger:</strong> ${recipe.hunger}
                </span>
                <span class="stat-display">
                  <i class="fas fa-tint stat-icon"></i>
                  <strong>Thirst:</strong> ${recipe.thirst}
                </span>
              </div>
              <button class="craft-btn" onclick="craftRecipe('${recipe.name}'); event.stopPropagation();"
                      ${!status.hasAll ? 'disabled' : ''}>
                <i class="fas fa-fire" style="color: #e66205"></i> Craft Recipe
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

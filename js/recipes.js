// ==================== RECIPES PAGE ====================

let inventory = {};
let pinnedRecipes = [];
let currentFilter = 'all';
let currentMethod = '';
let currentBuff = '';
let allIngredients = new Set();

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

  if (Object.keys(inventory).length > 0) {
    renderInventory();
  }

  renderRecipes();
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
  const qty = parseInt(value) || 0;
  // Keep items at 0 quantity instead of removing them
  inventory[ingredient] = qty;
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

function renderRecipes() {
  let filtered = recipes;

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
    recipesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>No recipes found</p>
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
      'oven': '<i class="fas fa-bread-slice"></i>'
    };
    const methodIcon = methodIcons[recipe.cookingMethod] || '';
    const methodNames = {
      'soup': 'Soup',
      'frying': 'Frying',
      'oven': 'Oven'
    };
    const methodName = methodNames[recipe.cookingMethod] || '';

    return `
      <div class="recipe-card ${cardClass}">
        <button class="pin-checkbox ${isPinned ? 'pinned' : ''}"
                onclick="togglePin('${recipe.name}')"
                title="${isPinned ? 'Unpin this recipe' : 'Pin this recipe'}">
          <i class="fas fa-thumbtack"></i>
        </button>
        <div class="d-flex justify-content-between align-items-start mb-2">
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
          ${recipe.ingredients.map(ing =>
      `<span class="ingredient-tag ${inventory[ing] ? 'in-inventory' : ''}"
                  onclick="addToInventory('${ing}')">
              ${getImageTag('ingredients', ing, 'ingredient-img')}${ing}
            </span>`
    ).join('')}
        </div>
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
          <button class="craft-btn" onclick="craftRecipe('${recipe.name}')"
                  ${!status.hasAll ? 'disabled' : ''}>
            <i class="fas fa-fire" style="color: #e66205"></i> Craft Recipe
          </button>
        </div>
      </div>
    `;
  }).join('');

  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

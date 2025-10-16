// ==================== INTERACTIVE MAP ====================
// Based on ComradeAleks's implementation
// GitHub: https://github.com/ComradeAleks/Abiotic-Factor-Interactive-maps

import { abioticPresetData } from './abiotic-preset-data.js';

let map;
let currentMapId = null;
let markerLayers = {
  items: L.layerGroup(),
  enemies: L.layerGroup(),
  locations: L.layerGroup(),
  npcs: L.layerGroup(),
  homeMarkers: L.layerGroup()
};
let allMarkers = [];
let contextMenuPosition = null;

// Home marker storage
let homeMarkers = {
  default: [], // Max 2: current and old
  friends: []  // Max 8
};

// Custom marker storage
let customMarkers = {}; // Organized by mapId
let pendingCustomMarker = null; // Temporary storage for marker being created
let clickedCustomMarker = null; // Track which custom marker was right-clicked
let clickedHomeMarker = null; // Track which home marker was right-clicked

// ==================== UNDO/REDO SYSTEM ====================
const MAX_HISTORY = 25;
let historyStack = [];
let historyIndex = -1;
let isUndoRedoOperation = false; // Flag to prevent recording during undo/redo

// ==================== MINIMAP ====================
let minimap = null;
let minimapViewportRect = null;
let minimapOverlayRects = [];

function initMapPage() {
  const mapElement = document.getElementById('interactive-map');
  if (!mapElement) return;

  // Load saved home markers from localStorage
  loadHomeMarkers();

  // Load saved custom markers from localStorage
  loadCustomMarkers();

  // Load saved marker groups from localStorage
  loadMarkerGroups();

  // Hide loading indicator
  setTimeout(() => {
    const loadingEl = document.getElementById('mapLoading');
    if (loadingEl) loadingEl.style.display = 'none';
  }, 500);

  // Populate map selector
  populateMapSelector();

  // Load the first map
  const firstMap = Object.keys(mapsConfig.maps)[0];
  if (mapsConfig.maps[firstMap].type === 'folder') {
    loadMap(mapsConfig.maps[firstMap].levels[0]);
  } else {
    loadMap(mapsConfig.maps[firstMap]);
  }

  // Set up filter controls
  setupFilters();

  // Set up context menu
  setupContextMenu();

  // Set up marker group modals
  setupMarkerGroupModals();

  // Set up undo/redo controls
  setupUndoRedoControls();

  // Set up delete all markers button
  setupDeleteAllButton();

  // Set up draggable modals
  setupDraggableModals();

  // Set up clear all markers button
  setupClearAllMarkersButton();

  // Set up minimap (will be initialized when map loads)
  setupMinimap();
}

function populateMapSelector() {
  const selector = document.getElementById('mapSelector');
  if (!selector) return;

  let html = '<option value="">Select a Map</option>';

  for (const [key, mapData] of Object.entries(mapsConfig.maps)) {
    if (mapData.type === 'folder') {
      html += `<optgroup label="${mapData.name}">`;
      mapData.levels.forEach(level => {
        html += `<option value="${level.id}" data-parent="${key}">${level.name}</option>`;
      });
      html += '</optgroup>';
    } else {
      html += `<option value="${key}">${mapData.name}</option>`;
    }
  }

  selector.innerHTML = html;

  selector.addEventListener('change', (e) => {
    const mapId = e.target.value;
    if (!mapId) return;

    const selectedOption = e.target.options[e.target.selectedIndex];
    const parent = selectedOption.dataset.parent;

    let mapToLoad;
    if (parent) {
      mapToLoad = mapsConfig.maps[parent].levels.find(l => l.id === mapId);
    } else {
      mapToLoad = mapsConfig.maps[mapId];
    }

    if (mapToLoad) {
      loadMap(mapToLoad);
    }
  });
}

function loadMap(mapData) {
  currentMapId = mapData.id || mapData.name;

  // Show loading indicator
  const loadingEl = document.getElementById('mapLoading');
  if (loadingEl) loadingEl.style.display = 'block';

  // Clean up previous map
  if (map) {
    map.remove();
  }

  // Clear marker layers except home markers
  Object.keys(markerLayers).forEach(key => {
    if (key !== 'homeMarkers') {
      markerLayers[key].clearLayers();
    }
  });
  allMarkers = [];

  // Load the image to get actual dimensions
  const img = new Image();
  img.onload = function() {
    // Hide loading indicator
    if (loadingEl) loadingEl.style.display = 'none';
    // Use actual image dimensions for bounds to maintain aspect ratio
    const width = this.width;
    const height = this.height;
    const bounds = [[0, 0], [height, width]];

    // Initialize the map
    map = L.map('interactive-map', {
      crs: L.CRS.Simple,
      minZoom: -3,
      maxZoom: 2,
      zoomControl: true,
      attributionControl: false
    });

    // Add image overlay with proper bounds
    L.imageOverlay(mapData.image, bounds).addTo(map);
    map.fitBounds(bounds);

    // Add all marker layers
    Object.values(markerLayers).forEach(layer => layer.addTo(map));

    // Load markers for this map
    loadMarkersForMap(currentMapId);

    // Render home markers for this map
    renderHomeMarkers();

    // Render custom markers for this map
    renderCustomMarkers();

    // Set up reset button
    const resetBtn = document.getElementById('resetView');
    if (resetBtn) {
      resetBtn.onclick = () => map.fitBounds(bounds);
    }

    // Set up map click handler for context menu
    map.on('contextmenu', handleMapRightClick);

    // Add custom attribution
    L.control.attribution({
      position: 'bottomright',
      prefix: '<a href="https://github.com/ComradeAleks/Abiotic-Factor-Interactive-maps" target="_blank">Map by ComradeAleks</a>'
    }).addTo(map);

    // Create minimap
    createMinimap({ ...mapData, width, height });
  };

  img.onerror = function() {
    // Hide loading indicator
    if (loadingEl) loadingEl.style.display = 'none';

    console.error('Failed to load map image:', mapData.image);
    showToast('Failed to load map. The image may not be available.', 'error');
  };

  // Start loading the image with CORS enabled
  img.crossOrigin = 'anonymous';
  img.src = mapData.image;
}

function loadMarkersForMap(mapId) {
  const markers = sampleMarkers[mapId] || [];

  const iconColors = {
    items: '#3498db',
    enemies: '#e74c3c',
    locations: '#f39c12',
    npcs: '#27ae60'
  };

  markers.forEach(marker => {
    const category = marker.category || 'items';
    const icon = L.divIcon({
      className: 'custom-map-marker',
      html: `<div style="background-color: ${iconColors[category]};" class="marker-icon">
               <i class="fas ${marker.icon}"></i>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    const leafletMarker = L.marker([marker.lat, marker.lng], { icon: icon })
      .bindPopup(`
        <div class="marker-popup">
          <h6><i class="fas ${marker.icon}"></i> ${marker.name}</h6>
          <p>${marker.description}</p>
          <small class="text-muted">Category: ${category}</small>
        </div>
      `);

    markerLayers[category].addLayer(leafletMarker);
    allMarkers.push({marker: leafletMarker, data: marker, category});
  });
}

function setupFilters() {
  const filters = {
    showItems: 'items',
    showEnemies: 'enemies',
    showLocations: 'locations',
    showNPCs: 'npcs'
  };

  Object.keys(filters).forEach(filterId => {
    const checkbox = document.getElementById(filterId);
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        const layer = markerLayers[filters[filterId]];
        if (e.target.checked) {
          map.addLayer(layer);
        } else {
          map.removeLayer(layer);
        }
      });
    }
  });
}

// ==================== CONTEXT MENU & HOME MARKERS ====================

function setupContextMenu() {
  const contextMenu = document.getElementById('mapContextMenu');
  if (!contextMenu) return;

  // Close context menu on click outside
  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
      contextMenu.classList.remove('show');
    }
  });

  // Handle context menu actions
  contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      handleContextAction(action);
      contextMenu.classList.remove('show');
    });
  });

  // Set up friend base modal
  setupFriendBaseModal();

  // Set up custom marker modals
  setupMarkerTypeModal();
  setupMarkerDetailsModal();

  // Set up export button
  const exportBtn = document.getElementById('exportMarkers');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportCustomMarkers);
  }
}

function handleMapRightClick(e) {
  e.originalEvent.preventDefault();

  contextMenuPosition = e.latlng;
  clickedCustomMarker = null; // Reset when clicking on map background
  clickedHomeMarker = null; // Reset when clicking on map background
  clickedMarkerGroup = null; // Reset when clicking on map background

  const contextMenu = document.getElementById('mapContextMenu');
  const addMarkerOption = contextMenu.querySelector('[data-action="add-marker"]');
  const removeMarkerOption = document.getElementById('removeMarkerOption');
  const removeThisHomeOption = document.getElementById('removeThisHomeOption');
  const addToGroupOption = document.getElementById('addToGroupOption');
  const removeFromGroupOption = document.getElementById('removeFromGroupOption');
  const deleteGroupOption = document.getElementById('deleteGroupOption');
  const ungroupOption = document.getElementById('ungroupOption');

  if (!contextMenu) return;

  // Show "Add Marker" option for map background
  if (addMarkerOption) {
    addMarkerOption.style.display = 'flex';
  }

  // Hide all marker-specific options for map background clicks
  if (removeMarkerOption) {
    removeMarkerOption.style.display = 'none';
  }

  // Hide home marker options
  if (removeThisHomeOption) {
    removeThisHomeOption.style.display = 'none';
  }

  // Hide group-related options
  if (addToGroupOption) {
    addToGroupOption.style.display = 'none';
  }
  if (removeFromGroupOption) {
    removeFromGroupOption.style.display = 'none';
  }
  if (deleteGroupOption) {
    deleteGroupOption.style.display = 'none';
  }
  if (ungroupOption) {
    ungroupOption.style.display = 'none';
  }

  // Position the context menu
  const x = e.originalEvent.clientX;
  const y = e.originalEvent.clientY;

  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.add('show');
}

function handleContextAction(action) {
  if (!contextMenuPosition) return;

  switch (action) {
    case 'add-marker':
      showMarkerTypeDialog(contextMenuPosition);
      break;
    case 'remove-marker':
      removeCustomMarker();
      break;
    case 'add-to-group':
      if (clickedCustomMarker) {
        enterAddToGroupMode(clickedCustomMarker.marker, clickedCustomMarker.index);
      }
      break;
    case 'remove-from-group':
      showRemoveMarkersModal();
      break;
    case 'delete-group':
      deleteMarkerGroupAndMarkers();
      break;
    case 'ungroup':
      ungroupMarkers();
      break;
    case 'add-home':
      addHomeMarker(contextMenuPosition);
      break;
    case 'add-friend':
      showFriendBaseDialog(contextMenuPosition);
      break;
    case 'directions':
      showToast('Directions feature coming soon!', 'info');
      break;
    case 'remove-this-home':
      removeThisHomeMarker();
      break;
    case 'remove-home':
      removeAllHomeMarkers();
      break;
  }
}

function addHomeMarker(latlng) {
  // Check if we need to convert or remove markers
  if (homeMarkers.default.length >= 2) {
    showConfirmModal(
      'Replace Home Marker',
      'You already have 2 home base markers. The oldest marker will be removed. Continue?',
      () => {
        // Remove the oldest marker and add new one
        homeMarkers.default.shift();
        completeAddHomeMarker(latlng);
      },
      null,
      'fa-home'
    );
    return;
  }
  completeAddHomeMarker(latlng);
}

function completeAddHomeMarker(latlng) {
  // If we have 1 marker, convert it to "old"
  if (homeMarkers.default.length === 1) {
    homeMarkers.default[0].type = 'old';
  }

  // Add new marker as "current"
  homeMarkers.default.push({
    mapId: currentMapId,
    lat: latlng.lat,
    lng: latlng.lng,
    type: 'current',
    timestamp: Date.now()
  });

  saveHomeMarkers();
  renderHomeMarkers();
  showToast('Home marker added successfully', 'success');
}

function showFriendBaseDialog(latlng) {
  const modal = document.getElementById('friendBaseModal');
  const input = document.getElementById('friendBaseName');

  if (!modal || !input) return;

  input.value = '';
  modal.classList.add('show');
  input.focus();

  // Store the position temporarily
  modal.dataset.lat = latlng.lat;
  modal.dataset.lng = latlng.lng;
}

function setupFriendBaseModal() {
  const modal = document.getElementById('friendBaseModal');
  const confirmBtn = document.getElementById('friendBaseConfirm');
  const cancelBtn = document.getElementById('friendBaseCancel');
  const input = document.getElementById('friendBaseName');

  if (!modal || !confirmBtn || !cancelBtn || !input) return;

  confirmBtn.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) {
      showToast('Please enter a name for this base', 'warning');
      return;
    }

    const lat = parseFloat(modal.dataset.lat);
    const lng = parseFloat(modal.dataset.lng);

    addFriendMarker({ lat, lng }, name);
    modal.classList.remove('show');
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.remove('show');
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      confirmBtn.click();
    }
  });

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
}

function addFriendMarker(latlng, name) {
  // Check if we're at the limit
  if (homeMarkers.friends.length >= 8) {
    showConfirmModal(
      'Replace Friend Marker',
      `You already have 8 friend base markers. The oldest marker ("${homeMarkers.friends[0].name}") will be removed. Continue?`,
      () => {
        homeMarkers.friends.shift();
        completeAddFriendMarker(latlng, name);
      },
      null,
      'fa-user-friends'
    );
    return;
  }

  completeAddFriendMarker(latlng, name);
}

function completeAddFriendMarker(latlng, name) {
  homeMarkers.friends.push({
    mapId: currentMapId,
    lat: latlng.lat,
    lng: latlng.lng,
    name: name,
    timestamp: Date.now()
  });

  saveHomeMarkers();
  renderHomeMarkers();
  showToast(`Friend marker "${name}" added successfully`, 'success');
}

function removeThisHomeMarker() {
  if (!clickedHomeMarker) {
    showToast('Error: No home marker selected for removal', 'error');
    return;
  }

  const { type, index } = clickedHomeMarker;
  let markerName = '';

  if (type === 'default') {
    const marker = homeMarkers.default[index];
    markerName = marker.type === 'current' ? 'Current Home Base' : 'Old Home Base';
  } else if (type === 'friend') {
    const marker = homeMarkers.friends[index];
    markerName = `${marker.name}'s Base`;
  }

  showConfirmModal(
    'Remove Home Marker',
    `Remove "${markerName}"?`,
    () => {
      // Remove from the appropriate array
      if (type === 'default') {
        homeMarkers.default.splice(index, 1);
      } else if (type === 'friend') {
        homeMarkers.friends.splice(index, 1);
      }

      // Save and re-render
      saveHomeMarkers();
      renderHomeMarkers();
      showToast(`Removed "${markerName}"`, 'success');

      clickedHomeMarker = null;
    },
    null,
    'fa-trash'
  );
}

function removeAllHomeMarkers() {
  if (homeMarkers.default.length === 0 && homeMarkers.friends.length === 0) {
    showToast('No home markers to remove', 'info');
    return;
  }

  showConfirmModal(
    'Remove All Home Markers',
    'Remove all home base markers? This cannot be undone.',
    () => {
      homeMarkers = { default: [], friends: [] };
      saveHomeMarkers();
      renderHomeMarkers();
      showToast('All home markers removed', 'success');
    },
    null,
    'fa-trash-alt'
  );
}

function renderHomeMarkers() {
  if (!map) return;

  // Clear existing home markers
  markerLayers.homeMarkers.clearLayers();

  // Render default home markers for current map
  homeMarkers.default.forEach((marker, index) => {
    if (marker.mapId === currentMapId) {
      const iconClass = marker.type === 'current' ? 'current' : 'old';
      const iconHtml = `<div class="home-marker-icon ${iconClass}">
                         <i class="fas fa-home"></i>
                       </div>`;

      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: iconHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      const leafletMarker = L.marker([marker.lat, marker.lng], { icon: icon })
        .bindPopup(`
          <div class="marker-popup">
            <h6><i class="fas fa-home"></i> ${marker.type === 'current' ? 'Current' : 'Old'} Home Base</h6>
            <p>Your ${marker.type === 'current' ? 'current' : 'previous'} home base location</p>
          </div>
        `);

      // Add right-click handler to home marker
      leafletMarker.on('contextmenu', (e) => {
        L.DomEvent.stopPropagation(e);
        handleHomeMarkerRightClick(e, 'default', index);
      });

      markerLayers.homeMarkers.addLayer(leafletMarker);
    }
  });

  // Render friend markers for current map
  homeMarkers.friends.forEach((marker, index) => {
    if (marker.mapId === currentMapId) {
      const iconHtml = `<div class="home-marker-icon friend">
                         <i class="fas fa-user-friends"></i>
                       </div>`;

      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: iconHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      const leafletMarker = L.marker([marker.lat, marker.lng], { icon: icon })
        .bindPopup(`
          <div class="marker-popup">
            <h6><i class="fas fa-user-friends"></i> ${marker.name}'s Base</h6>
            <p>Friend base marker</p>
          </div>
        `);

      // Add right-click handler to friend marker
      leafletMarker.on('contextmenu', (e) => {
        L.DomEvent.stopPropagation(e);
        handleHomeMarkerRightClick(e, 'friend', index);
      });

      markerLayers.homeMarkers.addLayer(leafletMarker);
    }
  });
}

function handleHomeMarkerRightClick(e, type, index) {
  e.originalEvent.preventDefault();

  // Store the clicked home marker info
  clickedHomeMarker = { type, index };

  const contextMenu = document.getElementById('mapContextMenu');
  const removeMarkerOption = document.getElementById('removeMarkerOption');
  const removeThisHomeOption = document.getElementById('removeThisHomeOption');
  if (!contextMenu) return;

  // Hide custom marker removal option
  if (removeMarkerOption) {
    removeMarkerOption.style.display = 'none';
  }

  // Show remove this home option
  if (removeThisHomeOption) {
    removeThisHomeOption.style.display = 'flex';
  }

  // Position the context menu
  const x = e.originalEvent.clientX;
  const y = e.originalEvent.clientY;

  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.add('show');
}

function saveHomeMarkers() {
  localStorage.setItem('abioticHomeMarkers', JSON.stringify(homeMarkers));
}

function loadHomeMarkers() {
  const saved = localStorage.getItem('abioticHomeMarkers');
  if (saved) {
    try {
      homeMarkers = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load home markers:', e);
      homeMarkers = { default: [], friends: [] };
    }
  }
}

// ==================== CUSTOM MARKER SYSTEM ====================

function loadCustomMarkers() {
  const saved = localStorage.getItem('abioticCustomMarkers');
  if (saved) {
    try {
      customMarkers = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load custom markers:', e);
      customMarkers = {};
    }
  }
}

function saveCustomMarkers() {
  localStorage.setItem('abioticCustomMarkers', JSON.stringify(customMarkers));
}

function showMarkerTypeDialog(latlng) {
  const modal = document.getElementById('markerTypeModal');
  if (!modal) return;

  // Store the position temporarily
  pendingCustomMarker = {
    mapId: currentMapId,
    lat: latlng.lat,
    lng: latlng.lng
  };

  modal.classList.add('show');
}

function setupMarkerTypeModal() {
  const modal = document.getElementById('markerTypeModal');
  const cancelBtn = document.getElementById('markerTypeCancel');
  const markerTypeBtns = document.querySelectorAll('.marker-type-btn');

  if (!modal || !cancelBtn) return;

  // Handle marker type selection
  markerTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      const icon = btn.dataset.icon;
      const type = btn.dataset.type;
      const typeName = btn.querySelector('span').textContent;

      // Store selected type
      if (pendingCustomMarker) {
        pendingCustomMarker.category = category;
        pendingCustomMarker.icon = icon;
        pendingCustomMarker.typeName = typeName;
        pendingCustomMarker.markerTypeName = typeName; // Store original type name
      }

      // Hide type modal
      modal.classList.remove('show');

      // Determine which modal to show based on marker type
      if (type === 'complex') {
        // Complex markers show category selection modal
        showCategorySelectionModal(typeName);
      } else {
        // Simple markers go directly to details modal
        showMarkerDetailsDialog();
      }
    });
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    pendingCustomMarker = null;
  });

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
      pendingCustomMarker = null;
    }
  });

  // Setup preset selection modal
  setupPresetSelectionModal();
}

function showMarkerDetailsDialog() {
  const modal = document.getElementById('markerDetailsModal');
  const titleInput = document.getElementById('markerTitle');
  const descInput = document.getElementById('markerDescription');
  const header = document.getElementById('markerDetailsHeader');

  if (!modal || !titleInput || !descInput) return;

  // Set default values based on marker type
  if (pendingCustomMarker) {
    const typeName = pendingCustomMarker.typeName;
    titleInput.value = `${typeName} Location`;
    descInput.value = `Mark a ${typeName.toLowerCase()} location on the map`;
    header.innerHTML = `<i class="fas ${pendingCustomMarker.icon}"></i> Add ${typeName} Marker`;
  }

  modal.classList.add('show');
  titleInput.focus();
  titleInput.select();
}

function setupMarkerDetailsModal() {
  const modal = document.getElementById('markerDetailsModal');
  const confirmBtn = document.getElementById('markerDetailsConfirm');
  const backBtn = document.getElementById('markerDetailsBack');
  const titleInput = document.getElementById('markerTitle');
  const descInput = document.getElementById('markerDescription');

  if (!modal || !confirmBtn || !backBtn || !titleInput || !descInput) return;

  confirmBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const description = descInput.value.trim();

    if (!title) {
      showToast('Please enter a title for this marker', 'warning');
      return;
    }

    if (!pendingCustomMarker) {
      showToast('Error: No marker data available', 'error');
      return;
    }

    // Save the custom marker
    addCustomMarker({
      ...pendingCustomMarker,
      name: title,
      description: description,
      timestamp: Date.now()
    });

    modal.classList.remove('show');
    pendingCustomMarker = null;
  });

  backBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    // Show type selection modal again
    const typeModal = document.getElementById('markerTypeModal');
    if (typeModal) typeModal.classList.add('show');
  });

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
      pendingCustomMarker = null;
    }
  });

  // Allow Enter key to confirm
  titleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      confirmBtn.click();
    }
  });
}

function addCustomMarker(markerData) {
  // Initialize array for this map if it doesn't exist
  if (!customMarkers[markerData.mapId]) {
    customMarkers[markerData.mapId] = [];
  }

  customMarkers[markerData.mapId].push(markerData);
  const newMarkerIndex = customMarkers[markerData.mapId].length - 1;

  // Check if this marker should be grouped with another marker
  if (window.pendingGroupWithMarker !== undefined) {
    const sourceIndex = window.pendingGroupWithMarker;
    addMarkerToGroup(newMarkerIndex, sourceIndex);
    delete window.pendingGroupWithMarker;
    showToast('Markers grouped successfully', 'success');
  }

  saveCustomMarkers();
  renderCustomMarkers();

  // Save state to history
  saveStateToHistory();
}

function renderCustomMarkers() {
  if (!map || !currentMapId) return;

  // Get custom markers for this map
  const markers = customMarkers[currentMapId] || [];
  const groups = markerGroups[currentMapId] || [];

  const iconColors = {
    items: '#3498db',
    enemies: '#e74c3c',
    locations: '#f39c12',
    npcs: '#27ae60'
  };

  // First, render all groups
  groups.forEach((group, groupIndex) => {
    renderGroupedMarker(group, groupIndex);
  });

  // Get indices of markers that are in groups
  const groupedIndices = new Set();
  groups.forEach(group => {
    group.markerIndices.forEach(idx => groupedIndices.add(idx));
  });

  // Then render individual markers (excluding those in groups)
  markers.forEach((marker, index) => {
    // Skip if marker is in a group
    if (groupedIndices.has(index)) return;
    const category = marker.category || 'items';

    // Check if marker has a single selected item with an image
    let iconHtml;
    if (marker.selectedItems && marker.selectedItems.length === 1 && marker.selectedItems[0].image) {
      // Use the item's image as the marker icon
      const itemImage = marker.selectedItems[0].image;
      iconHtml = `<div class="marker-icon marker-icon-image" style="border: 3px solid ${iconColors[category]};">
                   <img src="${itemImage}" alt="${marker.selectedItems[0].item}" style="width: 100%; height: 100%; object-fit: contain;">
                 </div>`;
    } else {
      // Use generic icon
      iconHtml = `<div style="background-color: ${iconColors[category]}; border: 3px solid #f39c12;" class="marker-icon">
                   <i class="fas ${marker.icon}"></i>
                 </div>`;
    }

    const icon = L.divIcon({
      className: 'custom-map-marker',
      html: iconHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });

    // Generate popup content
    let popupContent = `<div class="marker-popup">`;

    // If marker has selected items (from category selection)
    if (marker.selectedItems && marker.selectedItems.length > 0) {
      popupContent += `<h6><i class="fas ${marker.icon}"></i> ${marker.name}</h6>`;
      popupContent += `<p style="margin-bottom: 0.5rem;">Items at this location:</p>`;
      popupContent += `<ul style="margin: 0.5rem 0; padding-left: 1.25rem; font-size: 0.9rem;">`;

      marker.selectedItems.forEach((item, idx) => {
        const itemDataStr = JSON.stringify(item).replace(/"/g, '&quot;');
        popupContent += `<li><a href="#" class="item-link" data-item='${itemDataStr}' style="color: var(--secondary-color); text-decoration: none; cursor: pointer;">${item.item}</a></li>`;
      });

      popupContent += `</ul>`;
    } else {
      // Legacy marker or marker without selected items
      popupContent += `<h6><i class="fas ${marker.icon}"></i> ${marker.name}</h6>`;
      popupContent += `<p>${marker.description || ''}</p>`;

      // Add preset information if available (legacy support)
      if (marker.presetData) {
        const preset = marker.presetData;

        if (preset.drops && preset.drops.length > 0) {
          popupContent += `
            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(52, 152, 219, 0.3);">
              <strong style="color: var(--secondary-color);">Drops:</strong>
              <ul style="margin: 0.5rem 0; padding-left: 1.25rem; font-size: 0.85rem;">
                ${preset.drops.map(d => `<li>${d.quantity && d.quantity !== '1' ? d.quantity + 'x ' : ''}${d.item} <span style="color: var(--success-color);">(${d.chance})</span></li>`).join('')}
              </ul>
            </div>
          `;
        }

        if (preset.harvestableDrops && preset.harvestableDrops.length > 0) {
          popupContent += `
            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(52, 152, 219, 0.3);">
              <strong style="color: var(--secondary-color);">Harvestable:</strong>
              <ul style="margin: 0.5rem 0; padding-left: 1.25rem; font-size: 0.85rem;">
                ${preset.harvestableDrops.map(d => `<li>${d.quantity && d.quantity !== '1' ? d.quantity + 'x ' : ''}${d.item} <span style="color: var(--success-color);">(${d.chance})</span></li>`).join('')}
              </ul>
            </div>
          `;
        }

        if (preset.scrapResult && preset.scrapResult.length > 0) {
          popupContent += `
            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(52, 152, 219, 0.3);">
              <strong style="color: var(--secondary-color);">Scrap Results:</strong>
              <ul style="margin: 0.5rem 0; padding-left: 1.25rem; font-size: 0.85rem;">
                ${preset.scrapResult.map(s => `<li>${s.quantity ? s.quantity + 'x ' : ''}${s.item}</li>`).join('')}
              </ul>
            </div>
          `;
        }

        if (preset.recipe && preset.recipe.length > 0) {
          popupContent += `
            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(52, 152, 219, 0.3);">
              <strong style="color: var(--secondary-color);">Recipe:</strong>
              <ul style="margin: 0.5rem 0; padding-left: 1.25rem; font-size: 0.85rem;">
                ${preset.recipe.map(r => `<li>${r.quantity ? r.quantity + 'x ' : ''}${r.item}</li>`).join('')}
              </ul>
            </div>
          `;
        }
      }
    }

    popupContent += '<small class="text-muted" style="display: block; margin-top: 0.75rem;">Custom marker</small></div>';

    const leafletMarker = L.marker([marker.lat, marker.lng], {
      icon: icon,
      draggable: true
    })
      .bindPopup(popupContent, { maxWidth: 300 });

    // Add right-click handler to custom marker
    leafletMarker.on('contextmenu', (e) => {
      L.DomEvent.stopPropagation(e);
      handleCustomMarkerRightClick(e, marker, index);
    });

    // Add dragging handlers
    setupMarkerDragging(leafletMarker, marker, index);

    // Add click handler for item links in popup
    leafletMarker.on('popupopen', () => {
      const popup = leafletMarker.getPopup();
      if (popup) {
        const popupElement = popup.getElement();
        if (popupElement) {
          const itemLinks = popupElement.querySelectorAll('.item-link');
          itemLinks.forEach(link => {
            link.addEventListener('click', (e) => {
              e.preventDefault();
              const itemDataStr = link.dataset.item;
              try {
                const itemData = JSON.parse(itemDataStr);
                showItemInfoModal(itemData);
              } catch (err) {
                console.error('Failed to parse item data:', err);
              }
            });
          });
        }
      }
    });

    markerLayers[category].addLayer(leafletMarker);
  });
}

function handleCustomMarkerRightClick(e, marker, index) {
  e.originalEvent.preventDefault();

  // Store the clicked marker info
  clickedCustomMarker = { marker, index };

  const contextMenu = document.getElementById('mapContextMenu');
  const addMarkerOption = contextMenu.querySelector('[data-action="add-marker"]');
  const removeMarkerOption = document.getElementById('removeMarkerOption');
  const addToGroupOption = document.getElementById('addToGroupOption');
  const removeFromGroupOption = document.getElementById('removeFromGroupOption');
  const deleteGroupOption = document.getElementById('deleteGroupOption');
  const ungroupOption = document.getElementById('ungroupOption');
  const removeThisHomeOption = document.getElementById('removeThisHomeOption');

  if (!contextMenu) return;

  // Hide "Add Marker" option when right-clicking on a marker
  if (addMarkerOption) {
    addMarkerOption.style.display = 'none';
  }

  // Show individual marker options
  if (removeMarkerOption) {
    removeMarkerOption.style.display = 'flex';
  }

  // Always show "Add to Group" option for individual markers
  if (addToGroupOption) {
    addToGroupOption.style.display = 'flex';
  }

  // Hide group-specific options
  if (removeFromGroupOption) {
    removeFromGroupOption.style.display = 'none';
  }
  if (deleteGroupOption) {
    deleteGroupOption.style.display = 'none';
  }
  if (ungroupOption) {
    ungroupOption.style.display = 'none';
  }

  // Hide home marker options
  if (removeThisHomeOption) {
    removeThisHomeOption.style.display = 'none';
  }

  // Position the context menu
  const x = e.originalEvent.clientX;
  const y = e.originalEvent.clientY;

  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.add('show');
}

function removeCustomMarker() {
  if (!clickedCustomMarker || !currentMapId) {
    showToast('Error: No marker selected for removal', 'error');
    return;
  }

  const { marker, index } = clickedCustomMarker;

  showConfirmModal(
    'Remove Marker',
    `Remove marker "${marker.name}"?`,
    () => {
      // Remove from the array
      customMarkers[currentMapId].splice(index, 1);

      // If array is empty, remove the mapId key
      if (customMarkers[currentMapId].length === 0) {
        delete customMarkers[currentMapId];
      }

      // Save and re-render
      saveCustomMarkers();

      // Clear and reload all markers for this map
      Object.keys(markerLayers).forEach(key => {
        if (key !== 'homeMarkers') {
          markerLayers[key].clearLayers();
        }
      });

      loadMarkersForMap(currentMapId);
      renderCustomMarkers();

      showToast(`Removed marker "${marker.name}"`, 'success');
      clickedCustomMarker = null;

      // Save state to history
      saveStateToHistory();
    },
    null,
    'fa-trash'
  );
}

function exportCustomMarkers() {
  if (!customMarkers || Object.keys(customMarkers).length === 0) {
    showToast('No custom markers to export', 'info');
    return;
  }

  // Create a formatted JSON export
  const exportData = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    markers: customMarkers
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  // Create download link
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `abiotic-factor-custom-markers-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Custom markers exported successfully!', 'success');
}

// ==================== PRESET SELECTION MODAL ====================

function showPresetSelectionModal(category, typeName) {
  const modal = document.getElementById('presetSelectionModal');
  const header = document.getElementById('presetSelectionHeader');
  const searchInput = document.getElementById('presetSearch');
  const grid = document.getElementById('presetGrid');

  if (!modal || !header || !searchInput || !grid) return;

  // Set header title
  const icons = {
    items: 'fa-box',
    enemies: 'fa-skull-crossbones',
    resources: 'fa-mountain',
    furniture: 'fa-chair'
  };
  header.innerHTML = `<i class="fas ${icons[category] || 'fa-search'}"></i> Select ${typeName}`;

  // Clear search input
  searchInput.value = '';

  // Render preset items
  renderPresetGrid(category, '');

  // Show modal
  modal.classList.add('show');
  searchInput.focus();
}

function renderPresetGrid(category, searchTerm) {
  const grid = document.getElementById('presetGrid');
  if (!grid) return;

  // Get presets from markerData
  const presets = searchPresets(category, searchTerm);

  if (!presets || presets.length === 0) {
    grid.innerHTML = `
      <div class="preset-no-results">
        <i class="fas fa-search"></i>
        <p>No ${category} found</p>
        <small>Try adjusting your search</small>
      </div>
    `;
    return;
  }

  // Render preset items
  const html = presets.map(preset => {
    return `
      <div class="preset-item" data-preset='${JSON.stringify(preset)}'>
        <img src="${preset.image}" alt="${preset.name}" class="preset-item-image" onerror="this.style.display='none'">
        <span class="preset-item-name">${preset.name}</span>
      </div>
    `;
  }).join('');

  grid.innerHTML = html;

  // Add click handlers to preset items
  grid.querySelectorAll('.preset-item').forEach(item => {
    item.addEventListener('click', () => {
      const preset = JSON.parse(item.dataset.preset);
      selectPreset(preset);
    });
  });
}

function selectPreset(preset) {
  if (!pendingCustomMarker) return;

  // Store preset data in pending marker
  pendingCustomMarker.presetData = preset;
  pendingCustomMarker.name = preset.name;
  pendingCustomMarker.description = generatePresetDescription(preset);

  // Hide preset modal and show details modal
  const presetModal = document.getElementById('presetSelectionModal');
  if (presetModal) presetModal.classList.remove('show');

  showMarkerDetailsDialog();
}

function generatePresetDescription(preset) {
  let description = `${preset.name}`;

  // Add drops information for enemies
  if (preset.drops && preset.drops.length > 0) {
    description += `\n\nDrops: ${preset.drops.map(d => `${d.item} (${d.chance})`).join(', ')}`;
  }

  // Add harvestable drops
  if (preset.harvestableDrops && preset.harvestableDrops.length > 0) {
    description += `\n\nHarvestable: ${preset.harvestableDrops.map(d => `${d.item} (${d.chance})`).join(', ')}`;
  }

  // Add scrap results for items/furniture
  if (preset.scrapResult && preset.scrapResult.length > 0) {
    description += `\n\nScrap: ${preset.scrapResult.map(s => `${s.item} x${s.quantity}`).join(', ')}`;
  }

  return description;
}

function setupPresetSelectionModal() {
  const modal = document.getElementById('presetSelectionModal');
  const searchInput = document.getElementById('presetSearch');
  const backBtn = document.getElementById('presetSelectionBack');
  const customBtn = document.getElementById('presetSelectionCustom');

  if (!modal) return;

  // Handle search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value;
      const category = pendingCustomMarker ? pendingCustomMarker.category : 'items';
      renderPresetGrid(category, searchTerm);
    });
  }

  // Handle back button
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      // Show type selection modal again
      const typeModal = document.getElementById('markerTypeModal');
      if (typeModal) typeModal.classList.add('show');
    });
  }

  // Handle custom marker button
  if (customBtn) {
    customBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      showMarkerDetailsDialog();
    });
  }

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });

  // Setup category selection modal
  setupCategorySelectionModal();

  // Setup item info modal
  setupItemInfoModal();
}

// ==================== CATEGORY SELECTION MODAL (Comprehensive) ====================

let selectedCategoryItems = [];
let currentCategory = 'Base and Building';
let currentSubcategory = null;

function setupCategorySelectionModal() {
  const modal = document.getElementById('categorySelectionModal');
  const cancelBtn = document.getElementById('categorySelectionCancel');
  const okBtn = document.getElementById('categorySelectionOk');
  const searchInput = document.getElementById('categorySearch');
  const categoryTabs = document.querySelectorAll('.category-tab');

  if (!modal) return;

  // Handle category tab clicks
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      populateSubcategoryTabs(currentCategory);
    });
  });

  // Handle search
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      filterCategoryItems(searchTerm);
    });
  }

  // Handle cancel
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      selectedCategoryItems = [];
    });
  }

  // Handle OK
  if (okBtn) {
    okBtn.addEventListener('click', () => {
      if (selectedCategoryItems.length === 0) {
        showToast('Please select at least one item', 'warning');
        return;
      }
      createMarkerFromSelectedItems();
      modal.classList.remove('show');
    });
  }

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
      selectedCategoryItems = [];
    }
  });
}

function showCategorySelectionModal(markerType) {
  console.log('showCategorySelectionModal called with markerType:', markerType);

  const modal = document.getElementById('categorySelectionModal');
  const categoryTabsContainer = document.querySelector('.category-tabs');

  console.log('Modal element:', modal);
  console.log('Category tabs container:', categoryTabsContainer);

  if (!modal || !categoryTabsContainer) {
    console.error('Modal or category tabs container not found!');
    return;
  }

  selectedCategoryItems = [];

  // Configure tabs based on marker type
  const tabConfigs = {
    'Items': [
      { name: 'Resource Nodes', dataCategory: 'Resources', subcategories: ['Resource Nodes'] },
      { name: 'Components', dataCategory: 'Resources', subcategories: ['Resources and Sub-components'] },
      { name: 'Medical', dataCategory: 'Utility and Travel', subcategories: ['Health and Medical'] },
      { name: 'Weapons', dataCategory: 'Weapons and Gear', subcategories: ['Weapons and Ammo'] },
      { name: 'Gear', dataCategory: 'Weapons and Gear', subcategories: ['Armor and Gear'] },
      { name: 'Tools', dataCategory: 'Utility and Travel', subcategories: ['Tools'] }
    ],
    'Food': [
      { name: 'Farming', dataCategory: 'Food', subcategories: ['Farming'] },
      { name: 'Fish', dataCategory: 'Food', subcategories: ['Fish'] },
      { name: 'Food and Cooking', dataCategory: 'Food', subcategories: ['Food and Cooking'] }
    ],
    'NPCs & Enemies': [
      { name: 'Enemies', dataCategory: 'People and Enemies', subcategories: ['Enemies'] },
      { name: 'People', dataCategory: 'People and Enemies', subcategories: ['People'] },
      { name: 'Traders', dataCategory: 'People and Enemies', subcategories: ['Traders'] }
    ],
    'Base & Building': [
      { name: 'Base and Building', dataCategory: 'Base and Building', subcategories: null } // Show all subcategories
    ]
  };

  const config = tabConfigs[markerType] || tabConfigs['Base & Building'];

  // Build category tabs HTML
  let tabsHtml = '';
  config.forEach((tab, index) => {
    tabsHtml += `<button class="category-tab ${index === 0 ? 'active' : ''}" data-category="${tab.dataCategory}" data-subcategories='${JSON.stringify(tab.subcategories)}'>${tab.name}</button>`;
  });

  categoryTabsContainer.innerHTML = tabsHtml;

  // Set current category to first tab
  currentCategory = config[0].dataCategory;

  // Re-attach event listeners for new tabs
  categoryTabsContainer.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      categoryTabsContainer.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      const allowedSubcategories = JSON.parse(tab.dataset.subcategories);
      populateSubcategoryTabs(currentCategory, allowedSubcategories);
    });
  });

  // Populate subcategories for first category
  const allowedSubcategories = config[0].subcategories;  // Already a JavaScript array, no need to parse
  populateSubcategoryTabs(currentCategory, allowedSubcategories);

  // Clear search
  const searchInput = document.getElementById('categorySearch');
  if (searchInput) searchInput.value = '';

  modal.classList.add('show');
}

function populateSubcategoryTabs(category, allowedSubcategories = null) {
  console.log('populateSubcategoryTabs called with category:', category, 'allowedSubcategories:', allowedSubcategories);

  const container = document.getElementById('subcategoryTabs');
  console.log('Subcategory tabs container:', container);
  console.log('abioticPresetData available:', typeof abioticPresetData !== 'undefined');
  console.log('Category exists in data:', abioticPresetData && abioticPresetData[category] !== undefined);

  if (!container) {
    console.error('Subcategory tabs container not found!');
    return;
  }

  if (!abioticPresetData[category]) {
    console.error('Category not found in abioticPresetData:', category);
    console.log('Available categories:', Object.keys(abioticPresetData || {}));
    return;
  }

  let subcategories = Object.keys(abioticPresetData[category]);
  console.log('All subcategories for', category + ':', subcategories);

  // Filter subcategories if allowed list is provided
  if (allowedSubcategories && Array.isArray(allowedSubcategories)) {
    subcategories = subcategories.filter(subcat => allowedSubcategories.includes(subcat));
    console.log('Filtered subcategories:', subcategories);
  }

  // If no subcategories found, hide the subcategory tabs container
  if (subcategories.length === 0) {
    console.error('No subcategories found after filtering!');
    container.style.display = 'none';
    return;
  }

  // If only one subcategory, hide the tabs (redundant to show single tab)
  if (subcategories.length === 1) {
    container.style.display = 'none';
    currentSubcategory = subcategories[0];
    renderCategoryItems(category, currentSubcategory);
    return;
  }

  container.style.display = 'flex';

  let html = '';
  subcategories.forEach((subcat, index) => {
    html += `<button class="subcategory-tab ${index === 0 ? 'active' : ''}" data-subcategory="${subcat}">${subcat}</button>`;
  });

  container.innerHTML = html;

  // Set current subcategory to first one
  currentSubcategory = subcategories[0];

  // Add click handlers
  container.querySelectorAll('.subcategory-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.subcategory-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentSubcategory = tab.dataset.subcategory;
      renderCategoryItems(category, currentSubcategory);
    });
  });

  // Render items for first subcategory
  renderCategoryItems(category, currentSubcategory);
}

function renderCategoryItems(category, subcategory) {
  const grid = document.getElementById('categoryItemsGrid');
  if (!grid || !abioticPresetData[category] || !abioticPresetData[category][subcategory]) return;

  const items = abioticPresetData[category][subcategory];

  let html = '';
  items.forEach((item, index) => {
    const itemId = `${category}-${subcategory}-${index}`;
    const isSelected = selectedCategoryItems.some(i => i.id === itemId);

    html += `
      <div class="category-item ${isSelected ? 'selected' : ''}" data-item-id="${itemId}">
        <input type="checkbox" class="category-item-checkbox" ${isSelected ? 'checked' : ''}>
        <img src="${item.image}" alt="${item.item}" class="category-item-image" onerror="this.style.display='none'">
        <span class="category-item-name">${item.item}</span>
      </div>
    `;
  });

  grid.innerHTML = html;

  // Add click handlers
  grid.querySelectorAll('.category-item').forEach(itemEl => {
    itemEl.addEventListener('click', (e) => {
      const itemId = itemEl.dataset.itemId;
      const checkbox = itemEl.querySelector('.category-item-checkbox');
      const [cat, subcat, idx] = itemId.split('-');
      const itemIndex = parseInt(idx);
      const itemData = abioticPresetData[cat][subcat][itemIndex];

      // Toggle selection
      if (itemEl.classList.contains('selected')) {
        itemEl.classList.remove('selected');
        checkbox.checked = false;
        selectedCategoryItems = selectedCategoryItems.filter(i => i.id !== itemId);
      } else {
        itemEl.classList.add('selected');
        checkbox.checked = true;
        selectedCategoryItems.push({
          id: itemId,
          data: itemData
        });
      }
    });
  });
}

function filterCategoryItems(searchTerm) {
  if (!searchTerm) {
    renderCategoryItems(currentCategory, currentSubcategory);
    return;
  }

  const grid = document.getElementById('categoryItemsGrid');
  if (!grid || !abioticPresetData[currentCategory] || !abioticPresetData[currentCategory][currentSubcategory]) return;

  const items = abioticPresetData[currentCategory][currentSubcategory];
  const filtered = items.filter(item => item.item.toLowerCase().includes(searchTerm));

  let html = '';
  filtered.forEach((item, index) => {
    const itemId = `${currentCategory}-${currentSubcategory}-${items.indexOf(item)}`;
    const isSelected = selectedCategoryItems.some(i => i.id === itemId);

    html += `
      <div class="category-item ${isSelected ? 'selected' : ''}" data-item-id="${itemId}">
        <input type="checkbox" class="category-item-checkbox" ${isSelected ? 'checked' : ''}>
        <img src="${item.image}" alt="${item.item}" class="category-item-image" onerror="this.style.display='none'">
        <span class="category-item-name">${item.item}</span>
      </div>
    `;
  });

  grid.innerHTML = html || '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">No items found</p>';

  // Re-add click handlers
  grid.querySelectorAll('.category-item').forEach(itemEl => {
    itemEl.addEventListener('click', (e) => {
      const itemId = itemEl.dataset.itemId;
      const checkbox = itemEl.querySelector('.category-item-checkbox');
      const [cat, subcat, idx] = itemId.split('-');
      const itemIndex = parseInt(idx);
      const itemData = abioticPresetData[cat][subcat][itemIndex];

      if (itemEl.classList.contains('selected')) {
        itemEl.classList.remove('selected');
        checkbox.checked = false;
        selectedCategoryItems = selectedCategoryItems.filter(i => i.id !== itemId);
      } else {
        itemEl.classList.add('selected');
        checkbox.checked = true;
        selectedCategoryItems.push({
          id: itemId,
          data: itemData
        });
      }
    });
  });
}

function createMarkerFromSelectedItems() {
  if (!pendingCustomMarker || selectedCategoryItems.length === 0) return;

  const markerNameInput = document.getElementById('categoryMarkerName');
  const customName = markerNameInput ? markerNameInput.value.trim() : '';

  // Create marker name from selected items
  let markerName = customName;
  if (!markerName) {
    if (selectedCategoryItems.length === 1) {
      markerName = selectedCategoryItems[0].data.item;
    } else {
      markerName = `${selectedCategoryItems.length} items`;
    }
  }

  // Create marker with all selected items
  const markerData = {
    ...pendingCustomMarker,
    name: markerName,
    selectedItems: selectedCategoryItems.map(i => i.data),
    timestamp: Date.now()
  };

  addCustomMarker(markerData);
  selectedCategoryItems = [];
  pendingCustomMarker = null;
}

// ==================== ITEM INFO MODAL (Draggable/Resizable) ====================

let itemInfoModalPinned = false;
let itemInfoDragging = false;
let itemInfoDragStart = { x: 0, y: 0 };
let itemInfoModalPos = { x: 0, y: 0 };

function setupItemInfoModal() {
  const modal = document.getElementById('itemInfoModal');
  const closeBtn = document.getElementById('itemInfoClose');
  const pinBtn = document.getElementById('itemInfoPin');
  const dragHandle = document.getElementById('itemInfoDragHandle');

  if (!modal) return;

  // Handle close
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
    });
  }

  // Handle pin
  if (pinBtn) {
    pinBtn.addEventListener('click', () => {
      itemInfoModalPinned = !itemInfoModalPinned;
      if (itemInfoModalPinned) {
        pinBtn.classList.add('pinned');
        modal.classList.add('pinned');
      } else {
        pinBtn.classList.remove('pinned');
        modal.classList.remove('pinned');
      }
    });
  }

  // Handle dragging
  if (dragHandle) {
    dragHandle.addEventListener('mousedown', (e) => {
      itemInfoDragging = true;
      itemInfoDragStart = {
        x: e.clientX - itemInfoModalPos.x,
        y: e.clientY - itemInfoModalPos.y
      };
      dragHandle.style.cursor = 'grabbing';
    });
  }

  document.addEventListener('mousemove', (e) => {
    if (!itemInfoDragging) return;

    itemInfoModalPos = {
      x: e.clientX - itemInfoDragStart.x,
      y: e.clientY - itemInfoDragStart.y
    };

    modal.style.transform = `translate(calc(-50% + ${itemInfoModalPos.x}px), calc(-50% + ${itemInfoModalPos.y}px))`;
  });

  document.addEventListener('mouseup', () => {
    if (itemInfoDragging && dragHandle) {
      itemInfoDragging = false;
      dragHandle.style.cursor = 'move';
    }
  });
}

function showItemInfoModal(itemData) {
  const modal = document.getElementById('itemInfoModal');
  if (!modal) return;

  // Populate modal with item data
  const titleEl = document.getElementById('itemInfoTitle');
  const wikiLinkEl = document.getElementById('itemInfoWikiLink');
  const imageEl = document.getElementById('itemInfoImage');
  const categoryEl = document.getElementById('itemInfoCategory');
  const locationEl = document.getElementById('itemInfoLocation');
  const harvestableEl = document.getElementById('itemInfoHarvestable');
  const dropsEl = document.getElementById('itemInfoDrops');
  const scrapEl = document.getElementById('itemInfoScrap');
  const recipeEl = document.getElementById('itemInfoRecipe');
  const butcheringEl = document.getElementById('itemInfoButchering');
  const tradesEl = document.getElementById('itemInfoTrades');
  const descEl = document.getElementById('itemInfoDescription');

  // Set title and link
  if (titleEl) titleEl.textContent = itemData.item || 'Unknown Item';
  if (wikiLinkEl && itemData.link) {
    wikiLinkEl.href = itemData.link;
    wikiLinkEl.style.display = 'inline-flex';
  } else if (wikiLinkEl) {
    wikiLinkEl.style.display = 'none';
  }

  // Set image
  if (imageEl && itemData.image) {
    imageEl.src = itemData.image;
    imageEl.style.display = 'block';
  } else if (imageEl) {
    imageEl.style.display = 'none';
  }

  // Set category
  if (categoryEl) {
    const categoryP = categoryEl.querySelector('p');
    if (categoryP) categoryP.textContent = itemData.category || '-';
  }

  // Populate sections
  populateListSection(harvestableEl, itemData['Harvestable Drops']);
  populateListSection(dropsEl, itemData['Drops']);
  populateListSection(scrapEl, itemData['Scrap Result']);
  populateListSection(recipeEl, itemData['Recipe']);
  populateListSection(butcheringEl, itemData['Butchering']);
  populateListSection(tradesEl, itemData['Trade']);

  modal.classList.add('show');
}

function populateListSection(sectionEl, data) {
  if (!sectionEl) return;

  const ul = sectionEl.querySelector('ul');
  if (!ul) return;

  if (!data || data === false || (Array.isArray(data) && data.length === 0)) {
    sectionEl.style.display = 'none';
    return;
  }

  sectionEl.style.display = 'block';
  ul.innerHTML = '';

  if (Array.isArray(data)) {
    if (typeof data[0] === 'string') {
      // Simple string array
      data.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      });
    } else if (Array.isArray(data[0])) {
      // Nested array (like Recipe)
      data[0].forEach((group, index) => {
        if (Array.isArray(group)) {
          group.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
          });
        }
      });
    } else if (typeof data[0] === 'object') {
      // Object array (like drops with quantity/chance)
      data.forEach(item => {
        const li = document.createElement('li');
        let text = '';
        if (item.quantity) text += `${item.quantity}x `;
        text += item.item || item.name || JSON.stringify(item);
        if (item.chance) text += ` (${item.chance})`;
        li.textContent = text;
        ul.appendChild(li);
      });
    }
  } else if (typeof data === 'object') {
    // Object data
    for (const [key, value] of Object.entries(data)) {
      const li = document.createElement('li');
      li.textContent = `${key}: ${value}`;
      ul.appendChild(li);
    }
  } else {
    // Simple value
    const li = document.createElement('li');
    li.textContent = String(data);
    ul.appendChild(li);
  }
}

// ==================== TOAST NOTIFICATION SYSTEM ====================

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info} toast-icon"></i>
    <div class="toast-content">${message}</div>
    <button class="toast-close">
      <i class="fas fa-times"></i>
    </button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

// ==================== CONFIRMATION MODAL SYSTEM ====================

function showConfirmModal(title, message, onConfirm, onCancel = null, icon = 'fa-exclamation-triangle') {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmModalTitle');
    const bodyEl = document.getElementById('confirmModalBody');
    const iconEl = document.getElementById('confirmModalIcon');
    const confirmBtn = document.getElementById('confirmModalConfirm');
    const cancelBtn = document.getElementById('confirmModalCancel');

    if (!modal) {
      resolve(false);
      return;
    }

    titleEl.textContent = title;
    bodyEl.textContent = message;
    iconEl.className = `fas ${icon} confirm-modal-icon`;

    // Remove any existing event listeners by cloning
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    const hideModal = () => {
      modal.classList.remove('show');
    };

    newConfirmBtn.addEventListener('click', () => {
      hideModal();
      if (onConfirm) onConfirm();
      resolve(true);
    });

    newCancelBtn.addEventListener('click', () => {
      hideModal();
      if (onCancel) onCancel();
      resolve(false);
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideModal();
        if (onCancel) onCancel();
        resolve(false);
      }
    }, { once: true });

    modal.classList.add('show');
  });
}

// ==================== MARKER GROUPING SYSTEM ====================

// Marker groups storage
let markerGroups = {}; // Organized by mapId
let clickedMarkerGroup = null; // Track which marker group was clicked
const GROUPING_DISTANCE = 100; // Pixel distance to consider markers as "nearby"

function loadMarkerGroups() {
  const saved = localStorage.getItem('abioticMarkerGroups');
  if (saved) {
    try {
      markerGroups = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load marker groups:', e);
      markerGroups = {};
    }
  }
}

function saveMarkerGroups() {
  localStorage.setItem('abioticMarkerGroups', JSON.stringify(markerGroups));
}

function findNearbyMarkers(lat, lng, excludeIndex = -1) {
  if (!map || !currentMapId) return [];

  const markers = customMarkers[currentMapId] || [];
  const nearby = [];

  const clickPoint = map.latLngToLayerPoint([lat, lng]);

  markers.forEach((marker, index) => {
    if (index === excludeIndex) return;

    const markerPoint = map.latLngToLayerPoint([marker.lat, marker.lng]);
    const distance = Math.sqrt(
      Math.pow(clickPoint.x - markerPoint.x, 2) +
      Math.pow(clickPoint.y - markerPoint.y, 2)
    );

    if (distance <= GROUPING_DISTANCE) {
      nearby.push({ marker, index, distance });
    }
  });

  return nearby.sort((a, b) => a.distance - b.distance);
}

function showAddToGroupModal(sourceMarker, sourceIndex) {
  const nearby = findNearbyMarkers(sourceMarker.lat, sourceMarker.lng, sourceIndex);

  if (nearby.length === 0) {
    showToast('No nearby markers found to add this marker to', 'info');
    return;
  }

  // For now, add to the first nearby marker
  // In the future, you could show a modal to let user choose which marker
  const targetIndex = nearby[0].index;
  addMarkerToGroup(sourceIndex, targetIndex);
}

function addMarkerToGroup(sourceIndex, targetIndex) {
  if (!currentMapId) return;

  // Initialize groups for this map if needed
  if (!markerGroups[currentMapId]) {
    markerGroups[currentMapId] = [];
  }

  const sourceMarker = customMarkers[currentMapId][sourceIndex];
  const targetMarker = customMarkers[currentMapId][targetIndex];

  // Check if target is already in a group
  let targetGroupIndex = markerGroups[currentMapId].findIndex(g =>
    g.markerIndices.includes(targetIndex)
  );

  // Check if source is already in a group
  let sourceGroupIndex = markerGroups[currentMapId].findIndex(g =>
    g.markerIndices.includes(sourceIndex)
  );

  if (targetGroupIndex >= 0) {
    // Target is in a group, add source to that group
    if (!markerGroups[currentMapId][targetGroupIndex].markerIndices.includes(sourceIndex)) {
      markerGroups[currentMapId][targetGroupIndex].markerIndices.push(sourceIndex);
    }
  } else if (sourceGroupIndex >= 0) {
    // Source is in a group, add target to that group
    if (!markerGroups[currentMapId][sourceGroupIndex].markerIndices.includes(targetIndex)) {
      markerGroups[currentMapId][sourceGroupIndex].markerIndices.push(targetIndex);
    }
  } else {
    // Neither is in a group, create a new group
    markerGroups[currentMapId].push({
      lat: targetMarker.lat,
      lng: targetMarker.lng,
      markerIndices: [targetIndex, sourceIndex],
      timestamp: Date.now()
    });
  }

  saveMarkerGroups();

  // Clear and re-render markers
  Object.keys(markerLayers).forEach(key => {
    if (key !== 'homeMarkers') {
      markerLayers[key].clearLayers();
    }
  });
  loadMarkersForMap(currentMapId);
  renderCustomMarkers();
}

function renderGroupedMarker(group, groupIndex) {
  if (!map || !currentMapId) return;

  const markers = customMarkers[currentMapId] || [];
  const groupMarkers = group.markerIndices
    .filter(idx => idx < markers.length)
    .map(idx => markers[idx]);

  if (groupMarkers.length === 0) return;

  // Get category from first marker
  const category = groupMarkers[0].category || 'items';

  const iconColors = {
    items: '#3498db',
    enemies: '#e74c3c',
    locations: '#f39c12',
    npcs: '#27ae60'
  };

  // Create 2x2 grid HTML
  let gridHtml = '<div class="marker-group-grid">';

  // Get up to 4 markers' display info (images or icons)
  const markersToShow = groupMarkers.slice(0, 4);

  // Fill grid with images or icons
  for (let i = 0; i < 4; i++) {
    if (i < markersToShow.length) {
      const m = markersToShow[i];

      // Check if marker has an item image
      if (m.selectedItems && m.selectedItems.length > 0 && m.selectedItems[0].image) {
        gridHtml += `<img src="${m.selectedItems[0].image}" alt="Item ${i + 1}">`;
      } else {
        // Use marker's default icon
        const markerIcon = m.icon || 'fa-map-marker';
        const markerColor = iconColors[m.category] || iconColors[category];
        gridHtml += `<div style="background: ${markerColor}; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">
                      <i class="fas ${markerIcon}"></i>
                    </div>`;
      }
    } else {
      // Empty placeholder
      gridHtml += `<div style="background: rgba(${category === 'items' ? '52, 152, 219' : category === 'enemies' ? '231, 76, 60' : category === 'locations' ? '243, 156, 18' : '39, 174, 96'}, 0.3);"></div>`;
    }
  }

  // Add +n indicator if more than 4 markers
  if (groupMarkers.length > 4) {
    gridHtml += `<div class="marker-group-count">+${groupMarkers.length - 4}</div>`;
  }

  gridHtml += '</div>';

  const icon = L.divIcon({
    className: 'custom-map-marker',
    html: gridHtml,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42]
  });

  // Create popup content
  let popupContent = `<div class="marker-popup">`;
  popupContent += `<h6><i class="fas fa-layer-group"></i> Marker Group (${groupMarkers.length} markers)</h6>`;
  popupContent += `<p style="margin-bottom: 0.5rem;">Click to view all markers in this group</p>`;
  popupContent += `</div>`;

  const leafletMarker = L.marker([group.lat, group.lng], {
    icon: icon,
    draggable: true
  })
    .bindPopup(popupContent, { maxWidth: 300 });

  // Add click handler to show group modal
  leafletMarker.on('click', () => {
    showMarkerGroupModal(group, groupIndex);
  });

  // Add right-click handler for group
  leafletMarker.on('contextmenu', (e) => {
    L.DomEvent.stopPropagation(e);
    handleMarkerGroupRightClick(e, group, groupIndex);
  });

  // Add dragging handlers for group
  setupGroupDragging(leafletMarker, group, groupIndex);

  markerLayers[category].addLayer(leafletMarker);
}

function showMarkerGroupModal(group, groupIndex) {
  const modal = document.getElementById('markerGroupModal');
  const tabsContainer = document.getElementById('markerGroupTabs');
  const contentContainer = document.getElementById('markerGroupContent');

  if (!modal || !tabsContainer || !contentContainer || !currentMapId) return;

  const markers = customMarkers[currentMapId] || [];
  const groupMarkers = group.markerIndices
    .filter(idx => idx < markers.length)
    .map((idx, arrayIdx) => ({ marker: markers[idx], originalIndex: idx, arrayIdx }));

  // Build tabs
  let tabsHtml = '';
  groupMarkers.forEach(({ marker }, idx) => {
    const itemName = marker.name || `Marker ${idx + 1}`;
    const imageUrl = marker.selectedItems && marker.selectedItems.length > 0 && marker.selectedItems[0].image
      ? marker.selectedItems[0].image
      : null;

    const iconColors = {
      items: '#3498db',
      enemies: '#e74c3c',
      locations: '#f39c12',
      npcs: '#27ae60'
    };

    tabsHtml += `<button class="marker-group-tab ${idx === 0 ? 'active' : ''}" data-index="${idx}">`;
    if (imageUrl) {
      tabsHtml += `<img src="${imageUrl}" alt="${itemName}">`;
    } else {
      // Show icon instead of image
      const markerIcon = marker.icon || 'fa-map-marker';
      const markerColor = iconColors[marker.category] || iconColors['items'];
      tabsHtml += `<div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: ${markerColor}; border-radius: 4px; color: white; font-size: 14px;">
                    <i class="fas ${markerIcon}"></i>
                  </div>`;
    }
    tabsHtml += `<span>${itemName}</span></button>`;
  });

  tabsContainer.innerHTML = tabsHtml;

  // Show first marker details
  showGroupMarkerDetails(groupMarkers[0], 0, contentContainer);

  // Add tab click handlers
  tabsContainer.querySelectorAll('.marker-group-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tabsContainer.querySelectorAll('.marker-group-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const index = parseInt(tab.dataset.index);
      showGroupMarkerDetails(groupMarkers[index], index, contentContainer);
    });
  });

  modal.classList.add('show');
}

function showGroupMarkerDetails(markerData, index, container) {
  const { marker } = markerData;

  const iconColors = {
    items: '#3498db',
    enemies: '#e74c3c',
    locations: '#f39c12',
    npcs: '#27ae60'
  };

  let html = '<div class="marker-group-item-details">';
  html += '<div class="marker-group-item-header">';

  // Image or Icon
  if (marker.selectedItems && marker.selectedItems.length > 0 && marker.selectedItems[0].image) {
    html += `<img src="${marker.selectedItems[0].image}" alt="${marker.name}" class="marker-group-item-image">`;
  } else {
    // Show icon instead of image
    const markerIcon = marker.icon || 'fa-map-marker';
    const markerColor = iconColors[marker.category] || iconColors['items'];
    html += `<div class="marker-group-item-image" style="background: ${markerColor}; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px;">
              <i class="fas ${markerIcon}"></i>
            </div>`;
  }

  // Info
  html += '<div class="marker-group-item-info">';
  html += `<h6>${marker.name || 'Unnamed Marker'}</h6>`;

  if (marker.selectedItems && marker.selectedItems.length > 0) {
    html += `<p><strong>Items:</strong> ${marker.selectedItems.length}</p>`;
  }

  html += `<p><strong>Category:</strong> ${marker.category || 'Unknown'}</p>`;
  html += '</div></div>';

  // Description or items list
  if (marker.selectedItems && marker.selectedItems.length > 0) {
    html += '<div style="margin-top: 1rem;">';
    html += '<p style="color: var(--secondary-color); font-weight: 600; margin-bottom: 0.5rem;">Items at this location:</p>';
    html += '<ul style="margin: 0; padding-left: 1.25rem;">';
    marker.selectedItems.forEach(item => {
      html += `<li>${item.item}</li>`;
    });
    html += '</ul></div>';
  } else if (marker.description) {
    html += `<div style="margin-top: 1rem;"><p>${marker.description}</p></div>`;
  }

  html += '</div>';

  container.innerHTML = html;
}

function handleMarkerGroupRightClick(e, group, groupIndex) {
  e.originalEvent.preventDefault();

  clickedMarkerGroup = { group, groupIndex };

  const contextMenu = document.getElementById('mapContextMenu');
  const addMarkerOption = contextMenu.querySelector('[data-action="add-marker"]');
  const removeMarkerOption = document.getElementById('removeMarkerOption');
  const addToGroupOption = document.getElementById('addToGroupOption');
  const removeFromGroupOption = document.getElementById('removeFromGroupOption');
  const deleteGroupOption = document.getElementById('deleteGroupOption');
  const ungroupOption = document.getElementById('ungroupOption');
  const removeThisHomeOption = document.getElementById('removeThisHomeOption');

  if (!contextMenu) return;

  // Hide "Add Marker" option
  if (addMarkerOption) addMarkerOption.style.display = 'none';

  // Hide individual marker options
  if (removeMarkerOption) removeMarkerOption.style.display = 'none';
  if (addToGroupOption) addToGroupOption.style.display = 'none';

  // Hide home marker options
  if (removeThisHomeOption) removeThisHomeOption.style.display = 'none';

  // Show group options
  if (removeFromGroupOption) removeFromGroupOption.style.display = 'flex';
  if (deleteGroupOption) deleteGroupOption.style.display = 'flex';
  if (ungroupOption) ungroupOption.style.display = 'flex';

  // Position the context menu
  const x = e.originalEvent.clientX;
  const y = e.originalEvent.clientY;

  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.add('show');
}

function setupMarkerGroupModals() {
  // Setup group view modal close button
  const closeBtn = document.getElementById('markerGroupClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const modal = document.getElementById('markerGroupModal');
      if (modal) modal.classList.remove('show');
    });
  }

  // Setup remove markers modal
  const removeModal = document.getElementById('removeMarkersModal');
  const removeCancelBtn = document.getElementById('removeMarkersCancel');
  const removeConfirmBtn = document.getElementById('removeMarkersConfirm');

  if (removeCancelBtn) {
    removeCancelBtn.addEventListener('click', () => {
      if (removeModal) removeModal.classList.remove('show');
    });
  }

  if (removeConfirmBtn) {
    removeConfirmBtn.addEventListener('click', () => {
      removeSelectedMarkersFromGroup();
      if (removeModal) removeModal.classList.remove('show');
    });
  }
}

function showRemoveMarkersModal() {
  if (!clickedMarkerGroup || !currentMapId) return;

  const modal = document.getElementById('removeMarkersModal');
  const listContainer = document.getElementById('removeMarkersList');

  if (!modal || !listContainer) return;

  const { group, groupIndex } = clickedMarkerGroup;
  const markers = customMarkers[currentMapId] || [];
  const groupMarkers = group.markerIndices
    .filter(idx => idx < markers.length)
    .map(idx => ({ marker: markers[idx], originalIndex: idx }));

  const iconColors = {
    items: '#3498db',
    enemies: '#e74c3c',
    locations: '#f39c12',
    npcs: '#27ae60'
  };

  // Build checkbox list
  let html = '';
  groupMarkers.forEach(({ marker, originalIndex }) => {
    const imageUrl = marker.selectedItems && marker.selectedItems.length > 0 && marker.selectedItems[0].image
      ? marker.selectedItems[0].image
      : null;

    html += '<div class="remove-marker-item">';
    html += `<input type="checkbox" value="${originalIndex}">`;

    if (imageUrl) {
      html += `<img src="${imageUrl}" alt="${marker.name}">`;
    } else {
      // Show icon instead of image
      const markerIcon = marker.icon || 'fa-map-marker';
      const markerColor = iconColors[marker.category] || iconColors['items'];
      html += `<div style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: ${markerColor}; border-radius: 6px; color: white; font-size: 20px;">
                <i class="fas ${markerIcon}"></i>
              </div>`;
    }

    html += '<div class="remove-marker-item-info">';
    html += `<strong>${marker.name || 'Unnamed Marker'}</strong>`;
    html += `<small>${marker.category || 'Unknown category'}</small>`;
    html += '</div></div>';
  });

  listContainer.innerHTML = html;
  modal.classList.add('show');
}

function removeSelectedMarkersFromGroup() {
  if (!clickedMarkerGroup || !currentMapId) return;

  const listContainer = document.getElementById('removeMarkersList');
  if (!listContainer) return;

  const { group, groupIndex } = clickedMarkerGroup;
  const checkboxes = listContainer.querySelectorAll('input[type="checkbox"]:checked');
  const indicesToRemove = Array.from(checkboxes).map(cb => parseInt(cb.value));

  if (indicesToRemove.length === 0) {
    showToast('Please select at least one marker to remove', 'warning');
    return;
  }

  // Remove indices from group
  markerGroups[currentMapId][groupIndex].markerIndices =
    markerGroups[currentMapId][groupIndex].markerIndices.filter(idx => !indicesToRemove.includes(idx));

  // If group has less than 2 markers, delete it
  if (markerGroups[currentMapId][groupIndex].markerIndices.length < 2) {
    markerGroups[currentMapId].splice(groupIndex, 1);
  }

  saveMarkerGroups();

  // Re-render markers
  Object.keys(markerLayers).forEach(key => {
    if (key !== 'homeMarkers') {
      markerLayers[key].clearLayers();
    }
  });
  loadMarkersForMap(currentMapId);
  renderCustomMarkers();

  clickedMarkerGroup = null;

  // Save state to history
  saveStateToHistory();
}

function deleteMarkerGroup() {
  // NOTE: This function is deprecated. Use deleteMarkerGroupAndMarkers() instead.
  if (!clickedMarkerGroup || !currentMapId) return;

  const { group, groupIndex } = clickedMarkerGroup;
  const markerCount = group.markerIndices.length;

  showConfirmModal(
    'Delete Marker Group',
    `Delete this marker group with ${markerCount} markers? The individual markers will remain on the map.`,
    () => {
      markerGroups[currentMapId].splice(groupIndex, 1);
      saveMarkerGroups();

      // Re-render markers
      Object.keys(markerLayers).forEach(key => {
        if (key !== 'homeMarkers') {
          markerLayers[key].clearLayers();
        }
      });
      loadMarkersForMap(currentMapId);
      renderCustomMarkers();

      showToast('Marker group deleted', 'success');
      clickedMarkerGroup = null;
    },
    null,
    'fa-trash'
  );
}

// ==================== MARKER DRAGGING SYSTEM ====================

let markerBeingDragged = null;
let originalMarkerPosition = null;
let meldHighlightElement = null;
let nearbyMarkerDuringDrag = null;

function setupMarkerDragging(leafletMarker, markerData, markerIndex) {
  let originalLatLng = null;

  leafletMarker.on('dragstart', (e) => {
    originalLatLng = e.target.getLatLng();
    originalMarkerPosition = { lat: originalLatLng.lat, lng: originalLatLng.lng };
    markerBeingDragged = { marker: markerData, index: markerIndex, leafletMarker: e.target };

    // Add dragging class
    const icon = e.target.getElement();
    if (icon) icon.classList.add('marker-dragging');

    // Close any open popups
    e.target.closePopup();
  });

  leafletMarker.on('drag', (e) => {
    if (!markerBeingDragged) return;

    const currentLatLng = e.target.getLatLng();

    // Check for nearby markers
    const nearby = findNearbyMarkersForDrag(currentLatLng.lat, currentLatLng.lng, markerIndex);

    if (nearby.length > 0) {
      nearbyMarkerDuringDrag = nearby[0];
      showMeldEffect(currentLatLng, nearby[0]);
    } else {
      nearbyMarkerDuringDrag = null;
      hideMeldEffect();
    }
  });

  leafletMarker.on('dragend', (e) => {
    const icon = e.target.getElement();
    if (icon) icon.classList.remove('marker-dragging');

    const newLatLng = e.target.getLatLng();
    hideMeldEffect();

    // Check if dropped on another marker
    if (nearbyMarkerDuringDrag) {
      // Merge into group
      handleMarkerMerge(markerIndex, nearbyMarkerDuringDrag.index, originalLatLng);
      nearbyMarkerDuringDrag = null;
      markerBeingDragged = null;
    } else {
      // Show confirmation modal
      showConfirmModal(
        'Move Marker',
        'Do you want to move the marker to this new location?',
        () => {
          // User confirmed - update marker position
          markerData.lat = newLatLng.lat;
          markerData.lng = newLatLng.lng;
          saveCustomMarkers();
          showToast('Marker moved successfully', 'success');
          markerBeingDragged = null;

          // Save state to history
          saveStateToHistory();
        },
        () => {
          // User cancelled - return to original position
          e.target.setLatLng(originalLatLng);
          markerBeingDragged = null;
        },
        'fa-arrows-alt'
      );
    }
  });
}

function findNearbyMarkersForDrag(lat, lng, excludeIndex) {
  if (!map || !currentMapId) return [];

  const markers = customMarkers[currentMapId] || [];
  const nearby = [];
  const clickPoint = map.latLngToLayerPoint([lat, lng]);
  const mergeDistance = 50; // pixels - reasonable distance for merge detection

  markers.forEach((marker, index) => {
    if (index === excludeIndex) return;

    const markerPoint = map.latLngToLayerPoint([marker.lat, marker.lng]);
    const distance = Math.sqrt(
      Math.pow(clickPoint.x - markerPoint.x, 2) +
      Math.pow(clickPoint.y - markerPoint.y, 2)
    );

    if (distance <= mergeDistance) {
      nearby.push({ marker, index, distance });
    }
  });

  return nearby.sort((a, b) => a.distance - b.distance);
}

function showMeldEffect(draggedLatLng, nearbyMarker) {
  if (!map) return;

  // Remove existing highlight if any
  hideMeldEffect();

  // Get the target marker's position
  const targetLatLng = L.latLng(nearbyMarker.marker.lat, nearbyMarker.marker.lng);
  const targetPoint = map.latLngToLayerPoint(targetLatLng);

  // Create simple highlight circle
  meldHighlightElement = document.createElement('div');
  meldHighlightElement.className = 'marker-meld-highlight';
  meldHighlightElement.style.width = '50px';
  meldHighlightElement.style.height = '50px';
  meldHighlightElement.style.left = `${targetPoint.x - 25}px`;
  meldHighlightElement.style.top = `${targetPoint.y - 25}px`;

  map.getContainer().appendChild(meldHighlightElement);
}

function hideMeldEffect() {
  if (meldHighlightElement && meldHighlightElement.parentElement) {
    meldHighlightElement.remove();
    meldHighlightElement = null;
  }
}

function handleMarkerMerge(draggedIndex, targetIndex, originalLatLng) {
  showConfirmModal(
    'Merge Markers',
    'Merge these markers into a group?',
    () => {
      // User confirmed - merge into group
      addMarkerToGroup(draggedIndex, targetIndex);
      showToast('Markers merged into group', 'success');

      // Save state to history
      saveStateToHistory();
    },
    () => {
      // User cancelled - return to original position
      if (markerBeingDragged && markerBeingDragged.leafletMarker) {
        markerBeingDragged.leafletMarker.setLatLng(originalLatLng);
      }
    },
    'fa-layer-group'
  );
}

function setupGroupDragging(leafletMarker, group, groupIndex) {
  let originalLatLng = null;

  leafletMarker.on('dragstart', (e) => {
    originalLatLng = e.target.getLatLng();

    // Add dragging class
    const icon = e.target.getElement();
    if (icon) icon.classList.add('marker-dragging');

    // Close any open popups
    e.target.closePopup();
  });

  leafletMarker.on('dragend', (e) => {
    const icon = e.target.getElement();
    if (icon) icon.classList.remove('marker-dragging');

    const newLatLng = e.target.getLatLng();

    // Show confirmation modal
    showConfirmModal(
      'Move Marker Group',
      'Do you want to move this marker group to the new location?',
      () => {
        // User confirmed - update group position
        group.lat = newLatLng.lat;
        group.lng = newLatLng.lng;
        saveMarkerGroups();
        showToast('Marker group moved successfully', 'success');

        // Save state to history
        saveStateToHistory();
      },
      () => {
        // User cancelled - return to original position
        e.target.setLatLng(originalLatLng);
      },
      'fa-arrows-alt'
    );
  });
}

// ==================== NEW MARKER GROUPING FEATURES ====================

let addToGroupModeActive = false;
let addToGroupSourceMarker = null;

function enterAddToGroupMode(sourceMarker, sourceIndex) {
  addToGroupModeActive = true;
  addToGroupSourceMarker = { marker: sourceMarker, index: sourceIndex };

  // Change cursor to crosshair
  map.getContainer().style.cursor = 'crosshair';

  // Show toast notification
  showToast('Click on the map to place a new marker to group with', 'info');

  // Add temporary click handler to map
  map.once('click', handleAddToGroupPlacement);

  // Add escape key handler to cancel
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      cancelAddToGroupMode();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

function handleAddToGroupPlacement(e) {
  if (!addToGroupModeActive || !addToGroupSourceMarker) return;

  const latlng = e.latlng;

  // Reset mode
  addToGroupModeActive = false;
  map.getContainer().style.cursor = '';

  // Show marker type dialog for the new marker
  contextMenuPosition = latlng;
  showMarkerTypeDialog(latlng);

  // Store a flag so we know to group this marker when it's created
  window.pendingGroupWithMarker = addToGroupSourceMarker.index;
  addToGroupSourceMarker = null;
}

function cancelAddToGroupMode() {
  addToGroupModeActive = false;
  addToGroupSourceMarker = null;
  map.getContainer().style.cursor = '';
  showToast('Add to group cancelled', 'info');
}

function deleteMarkerGroupAndMarkers() {
  if (!clickedMarkerGroup || !currentMapId) return;

  const { group, groupIndex } = clickedMarkerGroup;
  const markerCount = group.markerIndices.length;

  showConfirmModal(
    'Delete Marker Group',
    `Delete this marker group and all ${markerCount} markers in it? This cannot be undone.`,
    () => {
      // Sort indices in descending order to remove from end first (prevents index shifting)
      const sortedIndices = [...group.markerIndices].sort((a, b) => b - a);

      // Remove all markers in the group
      sortedIndices.forEach(idx => {
        if (customMarkers[currentMapId] && customMarkers[currentMapId][idx]) {
          customMarkers[currentMapId].splice(idx, 1);
        }
      });

      // Remove the group
      markerGroups[currentMapId].splice(groupIndex, 1);

      // Update indices in remaining groups
      markerGroups[currentMapId].forEach(g => {
        g.markerIndices = g.markerIndices.map(idx => {
          // Adjust index based on how many markers were removed before it
          let newIdx = idx;
          sortedIndices.forEach(removedIdx => {
            if (idx > removedIdx) newIdx--;
          });
          return newIdx;
        });
      });

      // Save changes
      saveCustomMarkers();
      saveMarkerGroups();

      // Re-render markers
      Object.keys(markerLayers).forEach(key => {
        if (key !== 'homeMarkers') {
          markerLayers[key].clearLayers();
        }
      });
      loadMarkersForMap(currentMapId);
      renderCustomMarkers();

      showToast(`Deleted marker group with ${markerCount} markers`, 'success');
      clickedMarkerGroup = null;

      // Save state to history
      saveStateToHistory();
    },
    null,
    'fa-trash'
  );
}

function ungroupMarkers() {
  if (!clickedMarkerGroup || !currentMapId) return;

  const { group, groupIndex } = clickedMarkerGroup;
  const markerCount = group.markerIndices.length;

  showConfirmModal(
    'Ungroup Markers',
    `Remove the group and space out ${markerCount} markers individually?`,
    () => {
      const markers = customMarkers[currentMapId] || [];
      const groupMarkers = group.markerIndices
        .filter(idx => idx < markers.length)
        .map(idx => markers[idx]);

      // Calculate new positions in a circle around the group center
      const radius = 50; // pixels
      const angleStep = (2 * Math.PI) / groupMarkers.length;

      groupMarkers.forEach((marker, i) => {
        const angle = i * angleStep;
        const centerPoint = map.latLngToLayerPoint([group.lat, group.lng]);
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        const newPoint = L.point(centerPoint.x + offsetX, centerPoint.y + offsetY);
        const newLatLng = map.layerPointToLatLng(newPoint);

        marker.lat = newLatLng.lat;
        marker.lng = newLatLng.lng;
      });

      // Remove the group
      markerGroups[currentMapId].splice(groupIndex, 1);

      // Save changes
      saveCustomMarkers();
      saveMarkerGroups();

      // Re-render markers
      Object.keys(markerLayers).forEach(key => {
        if (key !== 'homeMarkers') {
          markerLayers[key].clearLayers();
        }
      });
      loadMarkersForMap(currentMapId);
      renderCustomMarkers();

      showToast(`Ungrouped ${markerCount} markers`, 'success');
      clickedMarkerGroup = null;

      // Save state to history
      saveStateToHistory();
    },
    null,
    'fa-object-ungroup'
  );
}

// ==================== UNDO/REDO IMPLEMENTATION ====================

function saveStateToHistory() {
  if (isUndoRedoOperation) return; // Don't save during undo/redo

  // Create a deep copy of current state
  const state = {
    customMarkers: JSON.parse(JSON.stringify(customMarkers)),
    markerGroups: JSON.parse(JSON.stringify(markerGroups)),
    timestamp: Date.now()
  };

  // If we're not at the end of history, remove everything after current position
  if (historyIndex < historyStack.length - 1) {
    historyStack = historyStack.slice(0, historyIndex + 1);
  }

  // Add new state
  historyStack.push(state);

  // Limit history to MAX_HISTORY
  if (historyStack.length > MAX_HISTORY) {
    historyStack.shift();
  } else {
    historyIndex++;
  }

  updateUndoRedoButtons();
}

function undo() {
  if (historyIndex <= 0) {
    showToast('Nothing to undo', 'info');
    return;
  }

  isUndoRedoOperation = true;
  historyIndex--;

  // Restore state from history
  const state = historyStack[historyIndex];
  customMarkers = JSON.parse(JSON.stringify(state.customMarkers));
  markerGroups = JSON.parse(JSON.stringify(state.markerGroups));

  // Save and re-render
  saveCustomMarkers();
  saveMarkerGroups();
  refreshMap();

  updateUndoRedoButtons();
  showToast('Undo successful', 'success');

  isUndoRedoOperation = false;
}

function redo() {
  if (historyIndex >= historyStack.length - 1) {
    showToast('Nothing to redo', 'info');
    return;
  }

  isUndoRedoOperation = true;
  historyIndex++;

  // Restore state from history
  const state = historyStack[historyIndex];
  customMarkers = JSON.parse(JSON.stringify(state.customMarkers));
  markerGroups = JSON.parse(JSON.stringify(state.markerGroups));

  // Save and re-render
  saveCustomMarkers();
  saveMarkerGroups();
  refreshMap();

  updateUndoRedoButtons();
  showToast('Redo successful', 'success');

  isUndoRedoOperation = false;
}

function refreshMap() {
  if (!map || !currentMapId) return;

  // Clear and reload all markers
  Object.keys(markerLayers).forEach(key => {
    if (key !== 'homeMarkers') {
      markerLayers[key].clearLayers();
    }
  });

  loadMarkersForMap(currentMapId);
  renderCustomMarkers();
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  if (undoBtn) {
    undoBtn.disabled = historyIndex <= 0;
  }

  if (redoBtn) {
    redoBtn.disabled = historyIndex >= historyStack.length - 1;
  }
}

function setupUndoRedoControls() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  if (undoBtn) {
    undoBtn.addEventListener('click', undo);
  }

  if (redoBtn) {
    redoBtn.addEventListener('click', redo);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+Z or Cmd+Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    // Ctrl+Y or Cmd+Shift+Z for redo
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault();
      redo();
    }
  });

  // Initialize with current state
  saveStateToHistory();
}

// ==================== DELETE ALL MARKERS ====================

function deleteAllMarkers() {
  const totalCustomMarkers = Object.values(customMarkers).reduce((acc, markers) => acc + markers.length, 0);
  const totalGroups = Object.values(markerGroups).reduce((acc, groups) => acc + groups.length, 0);

  if (totalCustomMarkers === 0 && totalGroups === 0) {
    showToast('No markers to delete', 'info');
    return;
  }

  showConfirmModal(
    'Delete All Markers',
    `Delete ALL ${totalCustomMarkers} custom marker(s) and ${totalGroups} group(s) from all maps? This cannot be undone through normal means (but undo will still work).`,
    () => {
      // Save state before deletion
      saveStateToHistory();

      // Clear everything
      customMarkers = {};
      markerGroups = {};

      // Save and re-render
      saveCustomMarkers();
      saveMarkerGroups();
      refreshMap();

      // Save new state
      saveStateToHistory();

      showToast(`Deleted all markers and groups`, 'success');
    },
    null,
    'fa-exclamation-triangle'
  );
}

function setupDeleteAllButton() {
  const deleteAllBtn = document.getElementById('deleteAllMarkers');
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', deleteAllMarkers);
  }
}

// ==================== DRAGGABLE MODALS ====================

function setupDraggableModals() {
  const modals = [
    'friendBaseModal',
    'markerTypeModal',
    'presetSelectionModal',
    'markerDetailsModal',
    'categorySelectionModal',
    'markerGroupModal',
    'removeMarkersModal'
  ];

  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      makeDraggable(modal);
    }
  });
}

function makeDraggable(modal) {
  const header = modal.querySelector('.custom-modal-header');
  const content = modal.querySelector('.custom-modal-content');

  if (!header || !content) return;

  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    // Don't drag if clicking on buttons or inputs
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;

    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === header || header.contains(e.target)) {
      isDragging = true;
      modal.classList.add('dragging');
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, content);
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;

    isDragging = false;
    modal.classList.remove('dragging');
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }

  // Reset position when modal is closed
  modal.addEventListener('click', (e) => {
    if (e.target === modal && !modal.classList.contains('show')) {
      xOffset = 0;
      yOffset = 0;
      content.style.transform = 'translate(0px, 0px)';
    }
  });
}

// ==================== CLEAR ALL MARKERS BUTTON ====================

function setupClearAllMarkersButton() {
  const btn = document.getElementById('clearAllMapMarkersBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      deleteAllMarkers();
    });
  }
}

// ==================== MINIMAP ====================

function setupMinimap() {
  // Minimap will be created after the main map is loaded
  // This is called from loadMap after the map is initialized
}

function createMinimap(mapData) {
  const minimapEl = document.getElementById('minimap');
  if (!minimapEl || !map) return;

  // Destroy existing minimap if it exists
  if (minimap) {
    minimap.remove();
    minimap = null;
    minimapViewportRect = null;
  }

  // Create minimap with same image
  const bounds = [[0, 0], [mapData.height, mapData.width]];

  // Get minimap container dimensions
  const containerWidth = minimapEl.offsetWidth;
  const containerHeight = minimapEl.offsetHeight;

  // Calculate the zoom level needed to fit the entire map
  // For CRS.Simple, zoom level affects scale as: scale = 2^zoom
  const scaleX = containerWidth / mapData.width;
  const scaleY = containerHeight / mapData.height;
  const scale = Math.min(scaleX, scaleY) * 0.95; // 0.95 to add small padding
  const zoom = Math.log2(scale);

  minimap = L.map('minimap', {
    crs: L.CRS.Simple,
    center: [mapData.height / 2, mapData.width / 2],
    zoom: zoom,
    minZoom: zoom,
    maxZoom: zoom,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false,
    zoomSnap: 0.01,
    zoomDelta: 0.01
  });

  const minimapImage = L.imageOverlay(mapData.image, bounds);
  minimapImage.addTo(minimap);

  // Lock the view
  minimap.setMaxBounds(bounds);

  // Create viewport rectangle after a short delay
  setTimeout(() => {
    updateMinimapViewport();
  }, 100);

  // Update viewport when main map moves
  map.on('move', updateMinimapViewport);
  map.on('zoom', updateMinimapViewport);
}

function updateMinimapViewport() {
  if (!map || !minimap) return;

  // Remove old rectangles
  if (minimapViewportRect) {
    minimap.removeLayer(minimapViewportRect);
  }
  minimapOverlayRects.forEach(rect => minimap.removeLayer(rect));
  minimapOverlayRects = [];

  // Get main map bounds
  const bounds = map.getBounds();
  const mapBounds = minimap.getBounds();

  // Create dark overlay rectangles around the viewport
  // Top rectangle
  if (bounds.getNorth() < mapBounds.getNorth()) {
    const topRect = L.rectangle(
      [[bounds.getNorth(), mapBounds.getWest()], [mapBounds.getNorth(), mapBounds.getEast()]],
      {
        color: 'black',
        fillColor: 'black',
        fillOpacity: 0.5,
        weight: 0,
        interactive: false
      }
    ).addTo(minimap);
    minimapOverlayRects.push(topRect);
  }

  // Bottom rectangle
  if (bounds.getSouth() > mapBounds.getSouth()) {
    const bottomRect = L.rectangle(
      [[mapBounds.getSouth(), mapBounds.getWest()], [bounds.getSouth(), mapBounds.getEast()]],
      {
        color: 'black',
        fillColor: 'black',
        fillOpacity: 0.5,
        weight: 0,
        interactive: false
      }
    ).addTo(minimap);
    minimapOverlayRects.push(bottomRect);
  }

  // Left rectangle
  if (bounds.getWest() > mapBounds.getWest()) {
    const leftRect = L.rectangle(
      [[bounds.getSouth(), mapBounds.getWest()], [bounds.getNorth(), bounds.getWest()]],
      {
        color: 'black',
        fillColor: 'black',
        fillOpacity: 0.5,
        weight: 0,
        interactive: false
      }
    ).addTo(minimap);
    minimapOverlayRects.push(leftRect);
  }

  // Right rectangle
  if (bounds.getEast() < mapBounds.getEast()) {
    const rightRect = L.rectangle(
      [[bounds.getSouth(), bounds.getEast()], [bounds.getNorth(), mapBounds.getEast()]],
      {
        color: 'black',
        fillColor: 'black',
        fillOpacity: 0.5,
        weight: 0,
        interactive: false
      }
    ).addTo(minimap);
    minimapOverlayRects.push(rightRect);
  }

  // Create rectangle showing current viewport (on top of overlays)
  minimapViewportRect = L.rectangle(bounds, {
    className: 'minimap-viewport',
    weight: 2,
    fillOpacity: 0
  }).addTo(minimap);
}

// Export initMapPage to global scope for navigation.js
window.initMapPage = initMapPage;

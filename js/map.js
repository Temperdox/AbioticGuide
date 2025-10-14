// ==================== INTERACTIVE MAP ====================
// Based on ComradeAleks's implementation
// GitHub: https://github.com/ComradeAleks/Abiotic-Factor-Interactive-maps

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

function initMapPage() {
  const mapElement = document.getElementById('interactive-map');
  if (!mapElement) return;

  // Load saved home markers from localStorage
  loadHomeMarkers();

  // Load saved custom markers from localStorage
  loadCustomMarkers();

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
  };

  img.onerror = function() {
    // Hide loading indicator
    if (loadingEl) loadingEl.style.display = 'none';

    console.error('Failed to load map image:', mapData.image);
    alert('Failed to load map. The image may not be available.');
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

  const contextMenu = document.getElementById('mapContextMenu');
  const removeMarkerOption = document.getElementById('removeMarkerOption');
  const removeThisHomeOption = document.getElementById('removeThisHomeOption');
  if (!contextMenu) return;

  // Hide remove marker option for map background clicks
  if (removeMarkerOption) {
    removeMarkerOption.style.display = 'none';
  }

  // Hide remove this home option for map background clicks
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

function handleContextAction(action) {
  if (!contextMenuPosition) return;

  switch (action) {
    case 'add-marker':
      showMarkerTypeDialog(contextMenuPosition);
      break;
    case 'remove-marker':
      removeCustomMarker();
      break;
    case 'add-home':
      addHomeMarker(contextMenuPosition);
      break;
    case 'add-friend':
      showFriendBaseDialog(contextMenuPosition);
      break;
    case 'directions':
      alert('Directions feature coming soon!');
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
    if (!confirm('You already have 2 home base markers. The oldest marker will be removed. Continue?')) {
      return;
    }
    // Remove the oldest marker
    homeMarkers.default.shift();
  }

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
      alert('Please enter a name for this base.');
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
    if (!confirm(`You already have 8 friend base markers. The oldest marker ("${homeMarkers.friends[0].name}") will be removed. Continue?`)) {
      return;
    }
    homeMarkers.friends.shift();
  }

  homeMarkers.friends.push({
    mapId: currentMapId,
    lat: latlng.lat,
    lng: latlng.lng,
    name: name,
    timestamp: Date.now()
  });

  saveHomeMarkers();
  renderHomeMarkers();
}

function removeThisHomeMarker() {
  if (!clickedHomeMarker) {
    alert('Error: No home marker selected for removal.');
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

  if (confirm(`Remove "${markerName}"?`)) {
    // Remove from the appropriate array
    if (type === 'default') {
      homeMarkers.default.splice(index, 1);
    } else if (type === 'friend') {
      homeMarkers.friends.splice(index, 1);
    }

    // Save and re-render
    saveHomeMarkers();
    renderHomeMarkers();

    clickedHomeMarker = null;
  }
}

function removeAllHomeMarkers() {
  if (homeMarkers.default.length === 0 && homeMarkers.friends.length === 0) {
    alert('No home markers to remove.');
    return;
  }

  if (confirm('Remove all home base markers? This cannot be undone.')) {
    homeMarkers = { default: [], friends: [] };
    saveHomeMarkers();
    renderHomeMarkers();
  }
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
      const typeName = btn.querySelector('span').textContent;

      // Store selected type
      if (pendingCustomMarker) {
        pendingCustomMarker.category = category;
        pendingCustomMarker.icon = icon;
        pendingCustomMarker.typeName = typeName;
      }

      // Hide type modal and show details modal
      modal.classList.remove('show');
      showMarkerDetailsDialog();
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
      alert('Please enter a title for this marker.');
      return;
    }

    if (!pendingCustomMarker) {
      alert('Error: No marker data available.');
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
  saveCustomMarkers();
  renderCustomMarkers();
}

function renderCustomMarkers() {
  if (!map || !currentMapId) return;

  // Get custom markers for this map
  const markers = customMarkers[currentMapId] || [];

  const iconColors = {
    items: '#3498db',
    enemies: '#e74c3c',
    locations: '#f39c12',
    npcs: '#27ae60'
  };

  markers.forEach((marker, index) => {
    const category = marker.category || 'items';
    const icon = L.divIcon({
      className: 'custom-map-marker',
      html: `<div style="background-color: ${iconColors[category]}; border: 3px solid #f39c12;" class="marker-icon">
               <i class="fas ${marker.icon}"></i>
             </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });

    const leafletMarker = L.marker([marker.lat, marker.lng], { icon: icon })
      .bindPopup(`
        <div class="marker-popup">
          <h6><i class="fas ${marker.icon}"></i> ${marker.name}</h6>
          <p>${marker.description}</p>
          <small class="text-muted">Custom marker</small>
        </div>
      `);

    // Add right-click handler to custom marker
    leafletMarker.on('contextmenu', (e) => {
      L.DomEvent.stopPropagation(e);
      handleCustomMarkerRightClick(e, marker, index);
    });

    markerLayers[category].addLayer(leafletMarker);
  });
}

function handleCustomMarkerRightClick(e, marker, index) {
  e.originalEvent.preventDefault();

  // Store the clicked marker info
  clickedCustomMarker = { marker, index };

  const contextMenu = document.getElementById('mapContextMenu');
  const removeMarkerOption = document.getElementById('removeMarkerOption');
  if (!contextMenu) return;

  // Show remove marker option
  if (removeMarkerOption) {
    removeMarkerOption.style.display = 'flex';
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
    alert('Error: No marker selected for removal.');
    return;
  }

  const { marker, index } = clickedCustomMarker;

  if (confirm(`Remove marker "${marker.name}"?`)) {
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

    clickedCustomMarker = null;
  }
}

function exportCustomMarkers() {
  if (!customMarkers || Object.keys(customMarkers).length === 0) {
    alert('No custom markers to export.');
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

  alert('Custom markers exported successfully!');
}

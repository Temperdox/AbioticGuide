// ==================== MAPS CONFIGURATION ====================
// Based on ComradeAleks's Abiotic Factor Interactive Maps
// GitHub: https://github.com/ComradeAleks/Abiotic-Factor-Interactive-maps

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/ComradeAleks/Abiotic-Factor-Interactive-maps/main/data/app-data/maps';

// Map loading order from GitHub
const mapsConfig = {
  loadingOrder: {
    root: [
      "Office-Complex",
      "Manufacturing_West_map.png",
      "Cascade-labratories",
      "Security.png",
      "Hydroplant.png",
      "Reactormap.png",
      "ResidenceTerribleMap.png"
    ],
    "Office-Complex": [
      "Office-Level-1.jpg",
      "Office-Level-3.jpg",
      "Office-Level-2.jpg"
    ],
    "Cascade-labratories": [
      "Cascade_wildlife.png",
      "Cascade_containment.png"
    ]
  },

  // Map metadata
  maps: {
    "Office-Complex": {
      name: "Office Complex",
      type: "folder",
      levels: [
        {
          id: "Office-Level-1",
          name: "Office Level 1",
          image: `${GITHUB_RAW_BASE}/Office-Complex/Office-Level-1/Office-Level-1.jpg`,
          bounds: [[0, 0], [2048, 2048]]
        },
        {
          id: "Office-Level-2",
          name: "Office Level 2",
          image: `${GITHUB_RAW_BASE}/Office-Complex/Office-Level-2/Office-Level-2.jpg`,
          bounds: [[0, 0], [2048, 2048]]
        },
        {
          id: "Office-Level-3",
          name: "Office Level 3",
          image: `${GITHUB_RAW_BASE}/Office-Complex/Office-Level-3/Office-Level-3.jpg`,
          bounds: [[0, 0], [2048, 2048]]
        }
      ]
    },
    "Cascade-labratories": {
      name: "Cascade Laboratories",
      type: "folder",
      levels: [
        {
          id: "Cascade_wildlife",
          name: "Wildlife Division",
          image: `${GITHUB_RAW_BASE}/Cascade-labratories/Cascade_wildlife/Cascade_wildlife.png`,
          bounds: [[0, 0], [2048, 2048]]
        },
        {
          id: "Cascade_containment",
          name: "Containment Division",
          image: `${GITHUB_RAW_BASE}/Cascade-labratories/Cascade_containment/Cascade_containment.png`,
          bounds: [[0, 0], [2048, 2048]]
        }
      ]
    },
    "Manufacturing_West_map": {
      name: "Manufacturing West",
      type: "single",
      image: `${GITHUB_RAW_BASE}/Manufacturing_West_map/Manufacturing_West_map.png`,
      bounds: [[0, 0], [2048, 2048]]
    },
    "Security": {
      name: "Security",
      type: "single",
      image: `${GITHUB_RAW_BASE}/Security/Security.png`,
      bounds: [[0, 0], [2048, 2048]]
    },
    "Hydroplant": {
      name: "Hydroplant",
      type: "single",
      image: `${GITHUB_RAW_BASE}/Hydroplant/Hydroplant.png`,
      bounds: [[0, 0], [2048, 2048]]
    },
    "Reactormap": {
      name: "Reactor",
      type: "single",
      image: `${GITHUB_RAW_BASE}/Reactormap/Reactormap.png`,
      bounds: [[0, 0], [2048, 2048]]
    },
    "ResidenceTerribleMap": {
      name: "Residence",
      type: "single",
      image: `${GITHUB_RAW_BASE}/ResidenceTerribleMap/ResidenceTerribleMap.png`,
      bounds: [[0, 0], [2048, 2048]]
    }
  }
};

// Default marker data - currently empty, will be populated with user-submitted markers
const sampleMarkers = {};

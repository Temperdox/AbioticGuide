# Abiotic Factor - Interactive Wiki

A community-driven interactive wiki for Abiotic Factor, featuring recipes, crafting guides, trader information, and an interactive map with custom markers and presets.

[![Live Demo](https://img.shields.io/badge/demo-live-green)](https://temperdox.github.io/AbioticGuide/)

## Features

### 📖 Recipe & Crafting Database
- Comprehensive cooking recipes with ingredients and cooking times
- Crafting recipes for items, tools, and equipment
- Search and filter functionality
- Detailed item information with images

### 🗺️ Interactive Map
- Custom markers for points of interest
- Preset categories (Base Defense, Furniture & Benches, etc.)
- Minimap with viewport indicator and dark overlay
- Draggable markers with save/load functionality
- Undo/Redo system (25 actions)
- Friend base markers for co-op play
- Clear all markers with confirmation

### 🛒 Trader Information
- Complete trader inventory listings
- Item prices and availability
- Trader locations and schedules

### 📍 Location Guide
- Important location markers
- Interactive map integration
- Location descriptions and details

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5.3.2
- **Icons**: Font Awesome 6.4.2
- **Map Library**: Leaflet.js 1.9.4
- **Storage**: LocalStorage for persistent data

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Temperdox/AbioticGuide.git
cd AbioticGuide
```

2. Open `index.html` in your browser, or use a local web server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server
```

3. Navigate to `http://localhost:8000` in your browser

## Project Structure

```
AbioticGuide/
├── css/
│   ├── style.css           # Main styles
│   └── recipes.css         # Recipe page styles
├── js/
│   ├── config.js           # Configuration
│   ├── navigation.js       # Navigation handler
│   ├── recipes.js          # Recipe functionality
│   ├── map.js              # Interactive map
│   ├── maps-config.js      # Map configurations
│   ├── utils.js            # Utility functions
│   └── abiotic-preset-data.js  # Preset data
├── img/                    # Images and assets
├── data/                   # Data files
├── pages/
│   └── map.html           # Map page
├── index.html             # Main entry point
└── README.md
```

## Features in Detail

### Interactive Map Features
- **Custom Markers**: Add markers anywhere on the map with custom labels
- **Presets**: Pre-configured marker sets for base defense, furniture, etc.
- **Friend Bases**: Mark and track friend base locations
- **Undo/Redo**: Full history management for up to 25 actions
- **Minimap**: Overview minimap with viewport indicator
- **Draggable Modals**: All modal dialogs can be repositioned
- **Persistent Storage**: All markers and settings saved to browser storage

### Recipe System
- Filter by cooking bench type
- Search by ingredient or recipe name
- View detailed cooking times and requirements
- Responsive grid layout for mobile and desktop

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Credits

- **Website Created By**: Cotton Le Sergal
- **Game Assets & Data**: [wiki.gg](https://abioticfactor.wiki.gg/)
- **Interactive Map Base**: [ComradeAleks](https://github.com/ComradeAleks/Abiotic-Factor-Interactive-maps)
- **Game**: Abiotic Factor © Deep Field Games

## Disclaimer

This is an unofficial fan-made website and is not affiliated with or endorsed by Deep Field Games. Game assets are used respectfully for informational purposes.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/Temperdox/AbioticGuide/issues) on GitHub.

---

**Live Site**: [https://temperdox.github.io/AbioticGuide/](https://temperdox.github.io/AbioticGuide/)

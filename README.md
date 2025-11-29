# ManuZard - Interactive Manufacturing Process Visualizer

A modern web application for visualizing engineering manufacturing processes in interactive 3D using React Three Fiber.

## Features

- **8 Manufacturing Processes**:
  - Casting
  - Welding
  - Forging
  - Rolling
  - Extrusion
  - Sheet Metal
  - 3D Printing
  - Laser Cutting

- **Dark Industrial Theme** with neon cyan and magenta highlights
- **Interactive 3D Canvas** for each manufacturing process
- **Responsive Navigation** with smooth transitions
- **Modern UI/UX** with glassmorphism effects

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **React Three Fiber** - 3D rendering with Three.js
- **React Router** - Client-side routing
- **@react-three/drei** - Useful helpers for R3F

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd manuzard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit:
```
http://localhost:5173
```

## Project Structure

```
manuzard/
├── src/
│   ├── components/
│   │   ├── Navigation.jsx      # Sidebar navigation component
│   │   └── Navigation.css      # Navigation styles
│   ├── pages/
│   │   ├── Home.jsx            # Landing page
│   │   ├── Home.css            # Home page styles
│   │   ├── CastingScene.jsx    # Casting 3D scene
│   │   ├── WeldingScene.jsx    # Welding 3D scene
│   │   ├── ForgingScene.jsx    # Forging 3D scene
│   │   ├── RollingScene.jsx    # Rolling 3D scene
│   │   ├── ExtrusionScene.jsx  # Extrusion 3D scene
│   │   ├── SheetMetalScene.jsx # Sheet Metal 3D scene
│   │   ├── PrintingScene.jsx   # 3D Printing scene
│   │   ├── LaserCuttingScene.jsx # Laser Cutting scene
│   │   └── Scene.css           # Shared scene styles
│   ├── App.jsx                 # Main app component
│   ├── App.css                 # App styles
│   ├── index.css               # Global styles
│   └── main.jsx                # Entry point
└── package.json
```

## Next Steps

The current implementation includes:
- Fully functional UI with navigation
- 8 scene pages with placeholder 3D objects
- Dark industrial theme with neon highlights
- Responsive design

### To Add Later:
1. **Detailed 3D Models** - Replace placeholder meshes with accurate manufacturing process models
2. **Animations** - Add process animations to show manufacturing steps
3. **Interactive Controls** - Add sliders and buttons to control process parameters
4. **Educational Content** - Add detailed descriptions and process steps
5. **Performance Optimization** - Implement lazy loading for 3D models

## Color Scheme

- **Primary Neon**: `#00ffff` (Cyan)
- **Secondary Neon**: `#ff00ff` (Magenta)
- **Background Dark**: `#0a0a0a` to `#1a1a2e`
- **Card Background**: `#16213e` to `#0f3460`
- **Text Primary**: `#e0e0e0`
- **Text Secondary**: `#b0b0b0`

## Browser Support

- Chrome (recommended)
- Firefox
- Edge
- Safari (limited WebGL support)

## License

Educational project for manufacturing process visualization.

---

Built with passion for engineering education

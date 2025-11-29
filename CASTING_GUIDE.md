# Sand Casting Visualization - Technical Guide

## Overview

The Sand Casting System is a physics-accurate educational visualization that demonstrates the complete metal casting process, including:

1. **Gating System Geometry** - Proper industrial layout
2. **Clipping Plane Animation** - Realistic metal filling
3. **Chvorinov's Rule** - Differential cooling based on geometry
4. **Interactive Controls** - Educational exploration

---

## The Engineering Theory

### 1. Anatomy of the Sand Casting Mold

#### **The Flask**
- **Cope**: Top half of the mold box
- **Drag**: Bottom half of the mold box
- **Function**: Contains the sand mold and provides structural support

#### **The Gating System** (The Metal Plumbing)

```
Pouring Basin (Entry)
    ↓
  Sprue (Vertical drop - gravity driven)
    ↓
  Runner (Horizontal distribution)
    ↓
  Gate → Part Cavity (The actual part being cast)
    ↓
  Riser (Shrinkage compensation reservoir)
```

**Why Each Component Exists:**

- **Pouring Basin**: Steady metal entry, reduces turbulence
- **Sprue**: Gravity accelerates the metal downward (tapered to prevent aspiration)
- **Runner**: Slows metal down, distributes it horizontally
- **Gate**: Controlled entry into the part cavity
- **Riser**: Critical! Metal shrinks ~3-5% when solidifying. The riser holds extra molten metal to "feed" the part as it shrinks, preventing voids/cavities

---

### 2. Chvorinov's Rule (The Physics of Solidification)

**Formula:**
```
Solidification Time = C × (Volume / Surface Area)²
```

**Translation:**
- **High Volume/Surface ratio** = Thick part = Slow cooling
- **Low Volume/Surface ratio** = Thin part = Fast cooling

**In Our Visualization:**

| Component | Thickness | Cool Rate | Solidifies |
|-----------|-----------|-----------|------------|
| Sprue     | Thin      | 2.5×      | **First**  |
| Runner    | Thin      | 2.0×      | **Second** |
| Riser     | Medium    | 0.8×      | Third      |
| Part (TorusKnot) | Thick | 0.5× | **Last**   |

**Why This Matters:**
- If the **runner solidifies before the part**, you get a complete casting ✓
- If the **riser solidifies before the part**, you get shrinkage cavities (defect) ✗

---

## How the Visualization Works

### Phase 1: Pouring (0-30% Progress)

**Technique: Clipping Plane Animation**

Instead of scaling geometry (which distorts complex shapes), we use a WebGL clipping plane:

```javascript
// Three.js Plane: Ax + By + Cz + D = 0
// We use: -Y + D = 0 (horizontal plane moving upward)
const clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), fillHeight);
```

**How It Works:**
- The plane starts at the bottom (Y = -3)
- As `processProgress` increases from 0→30%, the plane rises to Y = 4
- Any geometry **below** the plane is rendered (visible metal)
- Any geometry **above** the plane is clipped (invisible)
- This creates the illusion of liquid metal rising through the mold

**Advantages:**
- No geometry deformation
- Works with complex shapes (TorusKnot)
- GPU-accelerated (fast)

---

### Phase 2: Solidification (30-100% Progress)

**Technique: Material Color Lerping with Differential Rates**

Each component has a `coolRate` multiplier:

```javascript
const coolingProgress = Math.min(solidificationPhase * coolRate, 1);

// Color transition
const moltenColor = new THREE.Color(0xff6600); // Orange/Red
const solidColor = new THREE.Color(0x555555);   // Dark Grey
const currentColor = moltenColor.lerp(solidColor, coolingProgress);
```

**Visual Result:**
1. At 30% progress, all metal is bright orange (molten)
2. The **sprue** (coolRate 2.5) turns grey **first**
3. The **runner** (coolRate 2.0) turns grey **second**
4. The **riser** (coolRate 0.8) stays orange longer
5. The **part** (coolRate 0.5) stays orange **longest** (correct!)

**Emissive Intensity:**
- Molten metal glows brightly (`emissiveIntensity = 2.0`)
- Solid metal stops glowing (`emissiveIntensity = 0.0`)

---

## Using the Leva Controls

When you navigate to the Casting page, you'll see a control panel in the top-right corner:

### Controls:

1. **Process Progress (0-100%)**
   - **0-30%**: Pouring phase (metal fills the mold)
   - **30-100%**: Solidification phase (metal cools and solidifies)
   - Drag the slider to manually scrub through the process
   - Disabled when Auto Play is active

2. **Sand Opacity (0-0.25)**
   - Controls transparency of the sand mold
   - Default 0.25 for optimal X-ray view
   - Set to 0 for complete transparency
   - Set to 1.0 for fully opaque mold

3. **Show Labels**
   - Toggles component labels (Sprue, Runner, Riser, etc.)
   - Also shows real-time progress indicator
   - Useful for educational presentations

4. **Auto Play** ✨ NEW
   - Automatically animates the entire casting process
   - Loops continuously for demonstrations
   - Smooth interpolation between phases

5. **Playback Speed** ✨ NEW
   - Range: 0.1× to 5× speed
   - Default: 1.5× (optimized for viewing)
   - Slower speeds (0.5×) for detailed analysis
   - Faster speeds (3-5×) for quick overviews

6. **Show Particles** ✨ NEW
   - Toggles particle effects on/off
   - Metal splash particles during pouring
   - Steam particles during cooling
   - Performance: Disable for slower devices

7. **Reset Button** ✨ NEW
   - Instantly resets animation to start
   - Useful for presentations and demos

---

## Component Breakdown

### File Structure:

```
src/
├── components/
│   └── SandCastingSystem.jsx    ← The 3D casting system
└── pages/
    └── CastingScene.jsx         ← The scene wrapper
```

### Key Code Sections:

#### 1. Geometry Creation (Primitives)

```javascript
// Sprue - Tapered cylinder
<cylinderGeometry args={[0.3, 0.4, 6, 16]} />
// [topRadius, bottomRadius, height, segments]

// Runner - Box (rectangular channel)
<boxGeometry args={[5, 0.4, 0.4]} />

// Part - TorusKnot (complex industrial geometry)
<torusKnotGeometry args={[1, 0.3, 128, 16]} />
```

#### 2. Clipping Plane Setup

```javascript
const clippingPlane = useMemo(() => {
  return new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
}, []);

// In useFrame:
const fillHeight = -3 + pouringPhase * 7; // -3 to 4
clippingPlane.constant = fillHeight;

// In material:
<meshStandardMaterial clippingPlanes={[clippingPlane]} />
```

#### 3. Material Color Calculation

```javascript
const getMaterialColor = (baseTemp, coolRate) => {
  const coolingProgress = Math.min(solidificationPhase * coolRate, 1);
  const moltenColor = new THREE.Color(0xff6600);
  const solidColor = new THREE.Color(0x555555);
  return moltenColor.lerp(solidColor, coolingProgress);
};
```

---

## Educational Use Cases

### For Students:
1. **Understand Gating Design**: See why each component is necessary
2. **Visualize Chvorinov's Rule**: Watch thin parts solidify before thick parts
3. **Explore Defects**: Understand what happens if the riser is too small

### For Professors:
1. **Lecture Tool**: Project the visualization and scrub through the process
2. **Quiz Mode**: Hide labels and ask students to identify components
3. **Defect Scenarios**: Modify coolRates to show what happens with poor mold design

### For Presentations:
1. Set `processProgress` to 15% to show mid-pour
2. Set `sandOpacity` to 0.2 for X-ray view
3. Enable labels for component identification

---

## Common Defects (Future Enhancements)

You can extend the visualization to show:

### 1. **Shrinkage Cavity**
- **Cause**: Riser too small or solidifies too fast
- **Code**: Make riser `coolRate = 3.0` (faster than part)
- **Visual**: Add a dark void in the center of the part

### 2. **Cold Shut**
- **Cause**: Metal too cold when streams meet
- **Code**: Reduce `emissiveIntensity` at runner-part junction
- **Visual**: Add a crack line texture

### 3. **Porosity**
- **Cause**: Gas trapped during pour
- **Code**: Add small bubble particles during pouring phase
- **Visual**: Use `InstancedMesh` for bubbles

---

## Performance Notes

- **Clipping Planes**: Requires `gl={{ localClippingEnabled: true }}` in Canvas
- **Material Count**: 5 separate materials (one per component) for independent cooling
- **Geometry Complexity**: TorusKnot is high-poly (128 segments) - optimize if needed
- **60 FPS Target**: Current setup runs smoothly on modern hardware

---

## Next Steps / Extensions

1. **Add Temperature Color Map**
   - Use a gradient texture (red → orange → yellow → grey)
   - More realistic than binary molten/solid

2. **Add Particle Effects**
   - Smoke/steam during pouring
   - Sparks when metal hits the mold

3. **Add Cross-Section View**
   - Button to slice the mold in half
   - Show internal structure clearly

4. **Add Defect Modes**
   - Toggle switches to introduce common defects
   - Educational comparison tool

5. **Add Multiple Casting Types**
   - Die Casting (metal mold, faster cooling)
   - Investment Casting (wax pattern, ceramic shell)

---

## References

- **Chvorinov's Rule**: Solidification time calculation
- **Gating System Design**: ASM Metals Handbook Vol. 15
- **Three.js Clipping Planes**: [Three.js Docs](https://threejs.org/docs/#api/en/materials/Material.clippingPlanes)
- **React Three Fiber**: [R3F Docs](https://docs.pmnd.rs/react-three-fiber)

---

## Troubleshooting

**Issue**: Metal doesn't appear to fill
- **Solution**: Check that `gl={{ localClippingEnabled: true }}` is set in Canvas

**Issue**: All parts cool at same rate
- **Solution**: Verify each mesh has unique `coolRate` in `getMaterialColor()`

**Issue**: Labels not showing
- **Solution**: Ensure `showLabels` is true in Leva controls

**Issue**: Performance drops
- **Solution**: Reduce TorusKnot segments from 128 to 64

---

Built with engineering precision for manufacturing education 🏭

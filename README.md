# **Neon Runner Ultimate: Career Edition**

**Neon Runner Ultimate** is a high-performance, procedurally generated endless runner built entirely with HTML5 Canvas and Vanilla JavaScript. It features a retro-futuristic aesthetic, advanced physics mechanics, and a persistent progression system.

This project demonstrates the power of the HTML5 Canvas API by rendering all graphics, particles, and UI elements programmatically without external image assets.

## **🎮 Game Features**

### **Core Mechanics**

* **Physics Engine:** Custom implementation of gravity, velocity, and collision detection.  
* **Abilities:**  
  * **Double Jump:** Air maneuverability.  
  * **Phase Dash:** Defy gravity and become invincible for short bursts.  
  * **Fast Drop:** tactical vertical control.  
* **Procedural Generation:** Endless obstacle patterns including static blocks, flying drones, and rolling hazards.

### **"Career Edition" Features**

* **Shop System:** Collect "Data Cores" (Currency) during runs to purchase unlocks.  
* **Theme Engine:** 4 Distinct Biomes affecting visuals and weather:  
  * *Neon City* (Default)  
  * *Mars Colony*  
  * *Digital Void* (Matrix style)  
  * *Midnight Tokyo*  
* **Power-ups:**  
  * 🛡️ **Shield:** Protection against one collision.  
  * 🧲 **Magnet:** Attracts currency automatically.  
  * ⏳ **Time Warp:** Slows down time for precision maneuvering.  
* **Persistence:** Uses localStorage to save high scores, currency, and inventory across sessions.

### **Visual & Audio**

* **Parallax Backgrounds:** Multi-layered depth scrolling.  
* **Particle Systems:** Explosions, weather effects (rain, embers), and trails.  
* **Post-Processing:** CRT scanlines, vignette, and camera shake effects.  
* **Synthesized Audio:** All sound effects are generated in real-time using the Web Audio API.

## **🕹️ Controls**

| Action | Keyboard | Touch / Mobile |
| :---- | :---- | :---- |
| **Jump** | Space or Up Arrow | Tap Screen |
| **Double Jump** | Space (in air) | Tap (in air) |
| **Phase Dash** | Shift | Swipe Right |
| **Fast Drop** | Down Arrow or S | Swipe Down |
| **Pause** | Esc | UI Button |

## **🚀 Installation & Usage**

This project follows a **Single-File Architecture**. No build process, node modules, or external servers are required.

1. **Download** the index.html file.  
2. **Open** the file in any modern web browser (Chrome, Firefox, Safari, Edge).  
3. **Play** immediately.

### **Browser Compatibility**

* Requires a browser with support for:  
  * HTML5 Canvas  
  * ES6 JavaScript  
  * Web Audio API

## **🛠️ Technical Overview**

* **Language:** Pure JavaScript (ES6+)  
* **Rendering:** HTML5 Canvas Context 2D (requestAnimationFrame loop)  
* **Styling:** CSS3 variables for dynamic theming  
* **Audio:** window.AudioContext oscillators (Square, Sawtooth, Sine waves)  
* **Storage:** Browser localStorage API

## **👨‍💻 Developer**

**Shiboshree Roy**

* *Lead Developer & Designer*

*© 2026 Shiboshree Roy. All Rights Reserved.*
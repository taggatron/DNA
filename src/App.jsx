
import { useState, useRef } from 'react';
import './App.css';


// SVG puzzle shapes for each base
const BaseSVG = ({ base, size = 48 }) => {
  // A/T pair: left tab, right slot; T: left slot, right tab
  // C/G pair: top tab, bottom slot; G: top slot, bottom tab
  switch (base) {
    case 'A':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48">
          <path d="M0,8 Q0,0 8,0 H40 Q48,0 48,8 V40 Q48,48 40,48 H8 Q0,48 0,40 V32 Q8,32 8,24 Q8,16 0,16 Z" fill="#FFB347" stroke="#d89b2d" strokeWidth="2"/>
          <text x="50%" y="60%" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#fff" dy="-2">A</text>
        </svg>
      );
    case 'T':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48">
          <path d="M0,8 Q0,0 8,0 H40 Q48,0 48,8 V16 Q40,16 40,24 Q40,32 48,32 V40 Q48,48 40,48 H8 Q0,48 0,40 Z" fill="#B0E0E6" stroke="#6bb3bb" strokeWidth="2"/>
          <text x="50%" y="60%" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#fff" dy="-2">T</text>
        </svg>
      );
    case 'C':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48">
          <path d="M8,0 Q0,0 0,8 V40 Q0,48 8,48 H40 Q48,48 48,40 V32 Q32,32 32,40 Q32,48 24,48 Q16,48 16,40 Q16,32 0,32 V16 Q16,16 16,8 Q16,0 24,0 Q32,0 32,8 Q32,16 48,16 V8 Q48,0 40,0 Z" fill="#90EE90" stroke="#4bb34b" strokeWidth="2"/>
          <text x="50%" y="60%" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#fff" dy="-2">C</text>
        </svg>
      );
    case 'G':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48">
          <path d="M8,0 Q0,0 0,8 V16 Q16,16 16,8 Q16,0 24,0 Q32,0 32,8 Q32,16 48,16 V40 Q48,48 40,48 H8 Q0,48 0,40 V32 Q16,32 16,40 Q16,48 24,48 Q32,48 32,40 Q32,32 48,32 V8 Q48,0 40,0 Z" fill="#FF6961" stroke="#d13b3b" strokeWidth="2"/>
          <text x="50%" y="60%" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#fff" dy="-2">G</text>
        </svg>
      );
    default:
      return null;
  }
};

const BASES = [
  { label: 'A' },
  { label: 'T' },
  { label: 'C' },
  { label: 'G' },
];

function App() {

  // Each base: { type, x, y, rotation }
  const [placedBases, setPlacedBases] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const svgRef = useRef(null);

  const onDragStart = (e, base) => {
    e.dataTransfer.setData('base', base);
  };

  // Drop base at mouse position
  const onDrop = (e) => {
    e.preventDefault();
    const base = e.dataTransfer.getData('base');
    const svgRect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    setPlacedBases([
      ...placedBases,
      { type: base, x, y, rotation: 0 },
    ]);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  // Drag to move base
  const onBaseMouseDown = (idx, e) => {
    setSelectedIdx(idx);
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = placedBases[idx];
    const onMove = (moveEvt) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;
      setPlacedBases((prev) => prev.map((b, i) =>
        i === idx ? { ...b, x: orig.x + dx, y: orig.y + dy } : b
      ));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Rotate base by 15deg with Q/E keys when selected
  const onKeyDown = (e) => {
    if (selectedIdx == null) return;
    if (e.key === 'q' || e.key === 'Q') {
      setPlacedBases((prev) => prev.map((b, i) =>
        i === selectedIdx ? { ...b, rotation: b.rotation - 15 } : b
      ));
    } else if (e.key === 'e' || e.key === 'E') {
      setPlacedBases((prev) => prev.map((b, i) =>
        i === selectedIdx ? { ...b, rotation: b.rotation + 15 } : b
      ));
    }
  };

  // Remove base on double click
  const onBaseDoubleClick = (idx) => {
    setPlacedBases(placedBases.filter((_, i) => i !== idx));
    setSelectedIdx(null);
  };

  return (
    <div className="dna-app" tabIndex={0} onKeyDown={onKeyDown}>
      <h1>Physically Assemble a DNA Strand</h1>
      <div className="bases-container">
        {BASES.map((b) => (
          <div
            key={b.label}
            className="base-draggable"
            draggable
            onDragStart={(e) => onDragStart(e, b.label)}
            title={`Drag ${b.label}`}
          >
            <BaseSVG base={b.label} />
          </div>
        ))}
      </div>
      <div className="canvas-container">
        <svg
          ref={svgRef}
          width={400}
          height={320}
          className="dna-canvas"
          onDrop={onDrop}
          onDragOver={onDragOver}
          style={{ background: '#f3f3fa', border: '2px dashed #bdbdbd', borderRadius: 12 }}
        >
          {placedBases.map((b, idx) => (
            <g
              key={idx}
              transform={`translate(${b.x},${b.y}) rotate(${b.rotation})`}
              style={{ cursor: selectedIdx === idx ? 'move' : 'pointer', opacity: selectedIdx === idx ? 0.85 : 1 }}
              onMouseDown={(e) => onBaseMouseDown(idx, e)}
              onDoubleClick={() => onBaseDoubleClick(idx)}
              onClick={() => setSelectedIdx(idx)}
            >
              <BaseSVG base={b.type} />
              {selectedIdx === idx && (
                <circle
                  cx={24}
                  cy={-18}
                  r={8}
                  fill="#9575cd"
                  stroke="#fff"
                  strokeWidth={2}
                  style={{ cursor: 'pointer' }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const startY = e.clientY;
                    const startRot = b.rotation;
                    const onMove = (moveEvt) => {
                      const dy = moveEvt.clientY - startY;
                      setPlacedBases((prev) => prev.map((base, i) =>
                        i === idx ? { ...base, rotation: startRot + dy } : base
                      ));
                    };
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                />
              )}
            </g>
          ))}
        </svg>
      </div>
      <p className="instructions">
        Drag A, T, C, G into the canvas. Move by dragging, rotate with Q/E keys or the purple handle. Double-click a base to remove it.
      </p>
    </div>
  );

    }

export default App;

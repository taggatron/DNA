
import { useState, useRef, useId } from 'react';
import './App.css';


// SVG puzzle shapes for each base:
// - A/T complement across left/right edges (A has RIGHT tab, T has LEFT slot)
// - C/G complement across top/bottom edges (C has TOP tab, G has BOTTOM slot)
const BaseSVG = ({ base, size = 48 }) => {
  const id = useId().replace(/:/g, '');
  const fillMap = { A: '#FFB347', T: '#B0E0E6', C: '#90EE90', G: '#FF6961' };
  const strokeMap = { A: '#d89b2d', T: '#6bb3bb', C: '#4bb34b', G: '#d13b3b' };
  const fill = fillMap[base] || '#ddd';
  const stroke = strokeMap[base] || '#999';

  const vb = 48; // viewBox size
  const P = 6;   // padding from edges for base rect
  const R = 8;   // rect corner radius
  const RT = 6;  // tab/slot radius

  const RightTab = () => (
    <g>
      <rect x={P} y={P} width={vb - 2 * P} height={vb - 2 * P} rx={R} fill={fill} stroke={stroke} strokeWidth={2} />
      <circle cx={vb - P} cy={vb / 2} r={RT} fill={fill} stroke={stroke} strokeWidth={2} />
    </g>
  );
  const RightSlot = () => (
    <g>
      <defs>
        <mask id={`mask-right-${id}`}>
          <rect x="0" y="0" width={vb} height={vb} fill="white" />
          <circle cx={vb - P} cy={vb / 2} r={RT} fill="black" />
        </mask>
      </defs>
      <rect x={P} y={P} width={vb - 2 * P} height={vb - 2 * P} rx={R} fill={fill} stroke={stroke} strokeWidth={2} mask={`url(#mask-right-${id})`} />
    </g>
  );
  const LeftSlot = () => (
    <g>
      <defs>
        <mask id={`mask-left-${id}`}>
          <rect x="0" y="0" width={vb} height={vb} fill="white" />
          <circle cx={P} cy={vb / 2} r={RT} fill="black" />
        </mask>
      </defs>
      <rect x={P} y={P} width={vb - 2 * P} height={vb - 2 * P} rx={R} fill={fill} stroke={stroke} strokeWidth={2} mask={`url(#mask-left-${id})`} />
    </g>
  );
  const TopTab = () => (
    <g>
      <rect x={P} y={P} width={vb - 2 * P} height={vb - 2 * P} rx={R} fill={fill} stroke={stroke} strokeWidth={2} />
      <circle cx={vb / 2} cy={P} r={RT} fill={fill} stroke={stroke} strokeWidth={2} />
    </g>
  );
  const TopSlot = () => (
    <g>
      <defs>
        <mask id={`mask-top-${id}`}>
          <rect x="0" y="0" width={vb} height={vb} fill="white" />
          <circle cx={vb / 2} cy={P} r={RT} fill="black" />
        </mask>
      </defs>
      <rect x={P} y={P} width={vb - 2 * P} height={vb - 2 * P} rx={R} fill={fill} stroke={stroke} strokeWidth={2} mask={`url(#mask-top-${id})`} />
    </g>
  );
  const BottomSlot = () => (
    <g>
      <defs>
        <mask id={`mask-bottom-${id}`}>
          <rect x="0" y="0" width={vb} height={vb} fill="white" />
          <circle cx={vb / 2} cy={vb - P} r={RT} fill="black" />
        </mask>
      </defs>
      <rect x={P} y={P} width={vb - 2 * P} height={vb - 2 * P} rx={R} fill={fill} stroke={stroke} strokeWidth={2} mask={`url(#mask-bottom-${id})`} />
    </g>
  );

  const Letter = () => (
    <text x="50%" y="58%" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#ffffff">{base}</text>
  );

  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      {base === 'A' && <RightTab />}
      {base === 'T' && <LeftSlot />}
      {base === 'C' && <TopTab />}
      {base === 'G' && <BottomSlot />}
      <Letter />
    </svg>
  );
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
      // After releasing, attempt snapping to complementary neighbor
      setPlacedBases((prev) => {
        const cur = prev[idx];
        if (!cur) return prev;

        // Find best complementary candidate
        const compMap = { A: 'T', T: 'A', C: 'G', G: 'C' };
        const need = compMap[cur.type];
        let best = { i: -1, dist: Infinity };
        prev.forEach((b, i) => {
          if (i === idx) return;
          if (b.type !== need) return;
          const dx = b.x - cur.x;
          const dy = b.y - cur.y;
          const d = Math.hypot(dx, dy);
          if (d < best.dist) best = { i, dist: d };
        });
        if (best.i === -1 || best.dist > 40) return prev; // proximity threshold

        const target = prev[best.i];
        // Desired alignment depends on pair
        const snap = (arr, i, val) => arr.map((x, k) => (k === i ? val : x));
        const centerOffset = 24; // rotate around center in our math
        let snapped = prev;

        if ((cur.type === 'A' && target.type === 'T') || (cur.type === 'T' && target.type === 'A')) {
          // Align horizontally: centers aligned on y, x offset such that A's right tab meets T's left slot
          // We snap cur onto target's left side regardless of which is which, using a small gap ~0
          const desiredRot = 0; // prefer upright
          if (Math.abs((cur.rotation % 360)) < 20 && Math.abs((target.rotation % 360)) < 20) {
            const gap = 0; // visual contact
            const x = target.x - (cur.type === 'A' ? (48 - 6) + gap : -(48 - 6) - gap);
            const y = target.y; // align centers
            snapped = snap(snapped, idx, { ...cur, x, y, rotation: 0 });
          }
        } else if ((cur.type === 'C' && target.type === 'G') || (cur.type === 'G' && target.type === 'C')) {
          // Align vertically: centers aligned on x, y offset such that C's top tab meets G's bottom slot
          if (Math.abs((cur.rotation % 360)) < 20 && Math.abs((target.rotation % 360)) < 20) {
            const gap = 0;
            const x = target.x; // align centers
            const y = target.y + (cur.type === 'C' ? (48 - 6) + gap : -(48 - 6) - gap);
            snapped = snap(snapped, idx, { ...cur, x, y, rotation: 0 });
          }
        }

        return snapped;
      });
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

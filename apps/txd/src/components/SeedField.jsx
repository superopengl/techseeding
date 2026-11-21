import React, { useEffect, useMemo, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

// A grid of "seeds" echoing the dot cluster in the Techseeding logo. Dots grow
// from the bottom-left corner towards the top-right, and a few ripen to sprout green.

const sprout = keyframes`
  from { transform: scale(0); }
  to { transform: scale(1); }
`;

// A slow swell that rolls diagonally across the field, like wind through a crop.
const sway = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.28); }
`;

const ripen = keyframes`
  0%, 100% { filter: drop-shadow(0 0 0 rgba(95, 227, 168, 0)); }
  50% { filter: drop-shadow(0 0 7px rgba(95, 227, 168, 0.9)); }
`;

// Each seed is three nested layers so their transforms don't fight:
//   g.sprout  one-off grow-in on load
//   g.reach   swells towards the pointer (driven from JS via --p)
//   circle    the continuous sway
const Svg = styled.svg`
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;

  g,
  circle {
    transform-box: fill-box;
    transform-origin: center;
  }

  .reach {
    transform: scale(calc(1 + var(--p, 0) * 0.9));
    transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  &[data-animate='true'] {
    .sprout {
      animation: ${sprout} 0.7s cubic-bezier(0.3, 1.5, 0.5, 1) both;
      animation-delay: calc(var(--d) * 45ms + 300ms);
    }

    circle {
      animation: ${sway} 4.8s ease-in-out infinite;
      animation-delay: calc(var(--d) * 160ms + 1.4s);
    }

    circle[data-ripe='true'] {
      animation: ${sway} 4.8s ease-in-out infinite, ${ripen} 3.2s ease-in-out infinite;
      animation-delay: calc(var(--d) * 160ms + 1.4s), calc(var(--d) * 300ms);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .reach {
      transform: none;
    }
  }
`;

// Small deterministic PRNG so the field looks the same on every render.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function SeedField({ cols = 9, rows = 9, seed = 7, animate = false, palette, className }) {
  const colors = palette || { base: '#3da0f5', light: '#ffffff', ripe: '#5fe3a8' };
  const gap = 40;

  const dots = useMemo(() => {
    const rand = mulberry32(seed);
    const out = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // 0 at bottom-left, 1 at top-right
        const growth = (c / (cols - 1) + (rows - 1 - r) / (rows - 1)) / 2;
        const jitter = rand();
        const radius = 1.2 + Math.pow(growth, 1.6) * 17 * (0.55 + jitter * 0.45);
        if (radius < 2.2 && jitter < 0.5) continue;
        let fill = colors.base;
        let ripe = false;
        let opacity = 0.35 + growth * 0.65;
        if (jitter > 0.93 && growth > 0.45) {
          fill = colors.ripe;
          ripe = fill !== colors.base;
          opacity = 1;
        } else if (jitter < 0.22) {
          fill = colors.light;
          opacity = 0.25 + growth * 0.6;
        }
        // Offset alternate rows and nudge each seed so the field reads as sown, not plotted.
        const cx = c * gap + gap / 2 + (r % 2 ? gap / 2 : 0) + (rand() - 0.5) * 8;
        const cy = r * gap + gap / 2 + (rand() - 0.5) * 8;
        out.push({ cx, cy, r: radius, fill, opacity, ripe, d: c + (rows - 1 - r) });
      }
    }
    return out;
  }, [cols, rows, seed, colors.base, colors.light, colors.ripe]);

  const svgRef = useRef(null);
  const width = cols * gap + gap / 2;
  const height = rows * gap;

  // Seeds near the mouse swell up; the effect fades out over ~3 grid cells.
  useEffect(() => {
    const svg = svgRef.current;
    if (!animate || !svg) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;

    const nodes = Array.from(svg.querySelectorAll('.reach'));
    const reach = gap * 3;
    let frame = 0;
    let last = null;

    const apply = () => {
      frame = 0;
      const rect = svg.getBoundingClientRect();
      const scale = width / rect.width;
      const px = (last.clientX - rect.left) * scale;
      const py = (last.clientY - rect.top) * scale;
      nodes.forEach((node, i) => {
        const d = dots[i];
        const dist = Math.hypot(d.cx - px, d.cy - py);
        const p = Math.max(0, 1 - dist / reach);
        node.style.setProperty('--p', (p * p).toFixed(3));
      });
    };

    const onMove = (e) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      nodes.forEach((node) => node.style.setProperty('--p', 0));
    };

    const area = svg.closest('section') || svg;
    area.addEventListener('pointermove', onMove);
    area.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      area.removeEventListener('pointermove', onMove);
      area.removeEventListener('pointerleave', onLeave);
    };
  }, [animate, dots, width]);

  return (
    <Svg
      ref={svgRef}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      data-animate={animate}
      aria-hidden="true"
      focusable="false"
    >
      {dots.map((d, i) => (
        <g key={i} className="sprout" style={{ '--d': d.d }}>
          <g className="reach">
            <circle cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} fillOpacity={d.opacity} data-ripe={d.ripe} />
          </g>
        </g>
      ))}
    </Svg>
  );
}

export default SeedField;

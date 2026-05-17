import React from "react";

const BG_SVG = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'>
  <g transform='translate(80,60) rotate(-15)' opacity='0.07'>
    <rect x='0' y='10' width='60' height='36' rx='12' fill='%2343b88c'/>
    <rect x='14' y='4' width='8' height='18' rx='2' fill='%2343b88c'/>
    <rect x='8' y='10' width='20' height='8' rx='2' fill='%2343b88c'/>
    <circle cx='44' cy='22' r='4' fill='%23e8f8f0'/><circle cx='44' cy='34' r='4' fill='%23e8f8f0'/>
  </g>
  <polygon points='700,80 712,110 744,110 718,128 728,158 700,140 672,158 682,128 656,110 688,110' fill='%23fcd63c' opacity='0.09'/>
  <g transform='translate(650,600) rotate(20)' opacity='0.06'>
    <rect width='28' height='28' rx='4' fill='%237c5cfc'/><rect y='28' width='28' height='28' rx='4' fill='%237c5cfc'/><rect x='28' y='28' width='28' height='28' rx='4' fill='%237c5cfc'/>
  </g>
  <g transform='translate(100,650) rotate(-10)' opacity='0.06'>
    <rect width='24' height='24' rx='3' fill='%236ec1e4'/><rect x='24' width='24' height='24' rx='3' fill='%236ec1e4'/><rect x='48' width='24' height='24' rx='3' fill='%236ec1e4'/><rect x='24' y='24' width='24' height='24' rx='3' fill='%236ec1e4'/>
  </g>
  <g transform='translate(640,320)' opacity='0.07'>
    <rect x='8' y='0' width='8' height='8' fill='%23f59e0b'/><rect x='24' y='0' width='8' height='8' fill='%23f59e0b'/>
    <rect x='0' y='8' width='40' height='8' fill='%23f59e0b'/>
    <rect x='4' y='16' width='32' height='8' fill='%23f59e0b'/>
    <rect x='8' y='24' width='24' height='8' fill='%23f59e0b'/>
    <rect x='12' y='32' width='16' height='8' fill='%23f59e0b'/>
    <rect x='16' y='40' width='8' height='8' fill='%23f59e0b'/>
  </g>
  <g transform='translate(60,380) rotate(10)' opacity='0.06'>
    <rect x='14' y='0' width='14' height='42' rx='3' fill='%237c5cfc'/><rect x='0' y='14' width='42' height='14' rx='3' fill='%237c5cfc'/>
  </g>
  <circle cx='720' cy='450' r='22' fill='none' stroke='%23fcd63c' stroke-width='3' opacity='0.09'/>
  <text x='720' y='457' text-anchor='middle' font-size='20' font-weight='bold' fill='%23fcd63c' opacity='0.09'>$</text>
  <polygon points='180,150 195,150 188,170 202,170 178,198 184,178 172,178' fill='%23f59e0b' opacity='0.07'/>
  <polygon points='400,50 404,62 416,62 406,70 410,82 400,74 390,82 394,70 384,62 396,62' fill='%2343b88c' opacity='0.06'/>
  <polygon points='300,720 303,728 312,728 305,733 308,742 300,737 292,742 295,733 288,728 297,728' fill='%236ec1e4' opacity='0.07'/>
  <g transform='translate(500,100) rotate(35)' opacity='0.06'>
    <rect x='0' y='0' width='6' height='36' rx='1' fill='%2343b88c'/>
    <rect x='-8' y='36' width='22' height='6' rx='1' fill='%2343b88c'/>
    <rect x='-2' y='42' width='10' height='10' rx='1' fill='%2343b88c'/>
  </g>
  <g transform='translate(350,680) rotate(5)' opacity='0.05'>
    <rect width='26' height='26' rx='4' fill='%2361ce70'/><rect x='26' width='26' height='26' rx='4' fill='%2361ce70'/><rect x='-26' y='26' width='26' height='26' rx='4' fill='%2361ce70'/><rect x='0' y='26' width='26' height='26' rx='4' fill='%2361ce70'/>
  </g>
  <polygon points='50,520 65,505 80,520 65,550' fill='%236ec1e4' opacity='0.07'/>
  <g transform='translate(550,500)' opacity='0.05'>
    <rect x='6' y='0' width='4' height='16' rx='1' fill='%237c5cfc'/><rect x='0' y='6' width='16' height='4' rx='1' fill='%237c5cfc'/>
  </g>
  <g transform='translate(250,250)' opacity='0.05'>
    <rect x='6' y='0' width='4' height='16' rx='1' fill='%23f59e0b'/><rect x='0' y='6' width='16' height='4' rx='1' fill='%23f59e0b'/>
  </g>
</svg>`)}")`;

export function PlayfulBackdrop() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: BG_SVG,
        backgroundSize: "800px 800px",
        backgroundRepeat: "repeat",
        pointerEvents: "none",
      }}
    />
  );
}

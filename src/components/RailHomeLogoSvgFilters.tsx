/**
 * 좌측 레일 홈 마크 PNG — 알파 기준 균일 스트로크(SVG filter).
 * `filter: url(#reelsRailLogoOutlineDark|Light)` 와 짝을 맞춥니다.
 */
export function RailHomeLogoSvgFilters() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={0}
      height={0}
      aria-hidden
      className="pointer-events-none absolute overflow-hidden"
      style={{ width: 0, height: 0 }}
    >
      <defs>
        <filter
          id="reelsRailLogoOutlineDark"
          colorInterpolationFilters="sRGB"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
          primitiveUnits="userSpaceOnUse"
        >
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius="1.1"
            result="spread"
          />
          <feComposite
            in="spread"
            in2="SourceAlpha"
            operator="out"
            result="outline"
          />
          <feFlood floodColor="#ffffff" floodOpacity="0.38" result="flood" />
          <feComposite
            in="flood"
            in2="outline"
            operator="in"
            result="outlineColored"
          />
          <feMerge>
            <feMergeNode in="outlineColored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter
          id="reelsRailLogoOutlineLight"
          colorInterpolationFilters="sRGB"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
          primitiveUnits="userSpaceOnUse"
        >
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius="1.1"
            result="spread"
          />
          <feComposite
            in="spread"
            in2="SourceAlpha"
            operator="out"
            result="outline"
          />
          <feFlood floodColor="#0f172a" floodOpacity="0.24" result="flood" />
          <feComposite
            in="flood"
            in2="outline"
            operator="in"
            result="outlineColored"
          />
          <feMerge>
            <feMergeNode in="outlineColored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

import { useEffect, useRef } from "react";
import { animate, createScope } from "animejs";

export default function Mascot({
  small = false,
  still = false,
}: {
  small?: boolean;
  still?: boolean;
}) {
  const root = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const scope = createScope({
      root,
      mediaQueries: { reduced: "(prefers-reduced-motion: reduce)" },
    }).add((self) => {
      if (self?.matches.reduced || still) return;
      animate(".sun-body", {
        translateY: [-3, 4],
        rotate: [-3, 3],
        duration: 2800,
        alternate: true,
        loop: true,
        ease: "inOutSine",
      });
      animate(".sun-arm", {
        rotate: [-7, 5],
        duration: 2200,
        alternate: true,
        loop: true,
        ease: "inOutSine",
      });
      animate(".sun-spark", {
        opacity: [0.35, 1],
        scale: [0.75, 1],
        duration: 2200,
        alternate: true,
        loop: true,
        ease: "inOutSine",
      });
    });
    return () => scope.revert();
  }, [still]);
  return (
    <svg
      ref={root}
      className={small ? "mascot small" : "mascot"}
      viewBox="0 0 320 280"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="164" cy="252" rx="66" ry="9" fill="#DBBB8F" opacity=".25" />
      <path d="M31 195c18-29 37-30 47-12-22 0-34 6-47 12Z" fill="#A7B5A0" />
      <path d="M274 214c-6-31 10-52 27-49 0 24-12 39-27 49Z" fill="#A7B5A0" />
      <g
        className="sun-spark"
        stroke="#B58B52"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M54 64v14m-7-7h14M270 100v14m-7-7h14M246 32v9m-4-4h8" />
      </g>
      <g className="sun-body" style={{ transformOrigin: "160px 135px" }}>
        <path
          d="M112 211c-11 12-29 21-31 15-2-8 16-17 30-22m99 7c11 12 29 21 31 15 2-8-16-17-30-22"
          stroke="#9A633A"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          className="sun-arm"
          d="M83 146c-30 5-38-17-35-29"
          stroke="#9A633A"
          strokeWidth="8"
          strokeLinecap="round"
          style={{ transformOrigin: "83px 146px" }}
        />
        <path
          className="sun-arm"
          d="M237 146c30 5 38-17 35-29"
          stroke="#9A633A"
          strokeWidth="8"
          strokeLinecap="round"
          style={{ transformOrigin: "237px 146px" }}
        />
        <path
          d="M160 32c15 0 20 13 30 17 10 4 24-2 34 8 10 10 4 24 8 34 4 10 18 16 18 31s-12 23-14 34c-2 11 3 25-7 35-10 10-25 6-36 11-10 5-18 17-33 17s-23-12-33-17c-11-5-26-1-36-11-10-10-5-24-7-35-2-11-14-19-14-34s14-21 18-31c4-10-2-24 8-34 10-10 24-4 34-8 10-4 15-17 30-17Z"
          fill="#EDBA69"
        />
        <ellipse
          cx="112"
          cy="145"
          rx="13"
          ry="8"
          fill="#DB8E68"
          opacity=".55"
        />
        <ellipse
          cx="208"
          cy="145"
          rx="13"
          ry="8"
          fill="#DB8E68"
          opacity=".55"
        />
        <g stroke="#694D35" strokeWidth="4.5" strokeLinecap="round">
          <path d="M117 126q9-12 18 0m50 0q9-12 18 0" />
          <path d="M145 148q15 19 30 0" />
        </g>
      </g>
      <path
        d="M72 239c-1-21-16-26-26-24 2 16 12 23 26 24Zm191 2c-1-21 10-30 22-30 2 17-8 27-22 30Z"
        fill="#7F9A7C"
      />
    </svg>
  );
}

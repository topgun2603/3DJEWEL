"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { ENGRAVING_FONTS, type EngravingFontId } from "@/lib/fonts";

interface Options {
  width: number;
  height: number;
  /** Rotate the text 90° so it runs down a vertical face. */
  vertical?: boolean;
  /** Fraction of the canvas' short side used for the glyph height. */
  size?: number;
  flipY?: boolean;
}

/** Text rendered to a canvas and used as an alpha mask for an engraved surface. */
export function useEngravingTexture(text: string, fontId: EngravingFontId, opts: Options) {
  const { width, height, vertical = false, size = 0.62, flipY = true } = opts;
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    texture.flipY = flipY;
    return { canvas, texture };
  }, [width, height, flipY]);

  useEffect(() => {
    let cancelled = false;
    const font = ENGRAVING_FONTS[fontId];
    const short = vertical ? width : height;
    const long = vertical ? height : width;
    const px = Math.round(short * size * font.scale);
    const css = `${font.weight} ${px}px ${font.family}`;

    const draw = () => {
      if (cancelled) return;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      if (vertical) ctx.rotate(Math.PI / 2);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = css;
      // Shrink long inscriptions to fit the available face.
      const measured = ctx.measureText(text).width;
      const max = long * 0.92;
      if (measured > max) ctx.font = `${font.weight} ${Math.floor((px * max) / measured)}px ${font.family}`;
      ctx.fillText(text, 0, px * 0.04);
      ctx.restore();
      texture.needsUpdate = true;
    };

    draw();
    document.fonts?.load(css).then(draw).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [text, fontId, canvas, texture, width, height, vertical, size]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

"use client";

import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import type { WebGLRenderer } from "three";
import type { GLTFLoader } from "three-stdlib";
import { KTX2Loader } from "three-stdlib";

const DRACO_PATH = "/decoders/draco/";
const BASIS_PATH = "/decoders/basis/";

let ktx2Singleton: KTX2Loader | null = null;

function getKTX2(gl: WebGLRenderer): KTX2Loader {
  if (ktx2Singleton) {
    ktx2Singleton.detectSupport(gl);
    return ktx2Singleton;
  }
  const loader = new KTX2Loader();
  loader.setTranscoderPath(BASIS_PATH);
  loader.detectSupport(gl);
  ktx2Singleton = loader;
  return loader;
}

/**
 * Loads a compressed GLB from /models/optimized/ with draco + meshopt + KTX2
 * decoders wired to the same-origin /decoders/ blobs.
 *
 * Path is relative to /models/optimized/ (e.g. "agent-suit.glb"). Suspense
 * is required upstream — keep callers inside <Suspense> with a fallback.
 */
export function useModel(file: string) {
  const url = `/models/optimized/${file}`;
  const gl = useThree(({ gl }) => gl);
  const extendLoader = useMemo(() => {
    const ktx2 = getKTX2(gl);
    return (loader: GLTFLoader) => {
      loader.setKTX2Loader(ktx2);
    };
  }, [gl]);
  return useGLTF(url, DRACO_PATH, true, extendLoader);
}

/** Preload outside Suspense (call at module top-level or in an effect). */
useModel.preload = (file: string): void => {
  useGLTF.preload(`/models/optimized/${file}`, DRACO_PATH, true);
};

/** Drop a model from the cache (testing / hot-reload). */
useModel.clear = (file: string): void => {
  useGLTF.clear(`/models/optimized/${file}`);
};

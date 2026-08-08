import {
  Canvas,
  ColorMatrix,
  Group,
  Image as SkiaImage,
  Skia,
  type SkImage,
  useImage,
} from '@shopify/react-native-skia';
import { File } from 'expo-file-system';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

/**
 * Loads an `SkImage` from a local `file://` URI by reading the bytes ourselves.
 * Skia's own URI loader (`useImage`/`Data.fromURI`) can't read app-container
 * file URIs on iOS ("Could not load data"), even though the file is readable —
 * so we pull the bytes via expo-file-system and decode them directly. Remote
 * (`http(s)://`) and bundled (`require`) sources fall back to Skia's `useImage`.
 *
 * Note: Skia has no HEIC codec, so photos must already be JPEG/PNG. The pickers
 * request `Compatible` representation so iOS delivers JPEG (not HEIC).
 */
function useLocalSkiaImage(uri: string): SkImage | null {
  const isLocalFile = uri?.startsWith('file://');
  const remote = useImage(isLocalFile ? undefined : uri);
  const [local, setLocal] = useState<SkImage | null>(null);

  useEffect(() => {
    if (!isLocalFile) {
      setLocal(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const buffer = await new File(uri).arrayBuffer();
        if (!alive) return;
        const data = Skia.Data.fromBytes(new Uint8Array(buffer));
        setLocal(Skia.Image.MakeImageFromEncoded(data));
      } catch {
        if (alive) setLocal(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [uri, isLocalFile]);

  return isLocalFile ? local : remote;
}

/**
 * The builder's photo canvas, rendered with Skia so the Effects/Adjust color
 * matrix applies live (and the same pipeline can render the full-res print).
 * `fit` handles contain/cover; `rotated` spins it 90° about the center.
 */
export function SkiaPhoto({
  uri,
  fit,
  rotated,
  matrix,
}: {
  uri: string;
  fit: 'contain' | 'cover';
  rotated: boolean;
  matrix: number[];
}) {
  const image = useLocalSkiaImage(uri);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const ready = image && size.w > 0 && size.h > 0;

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <Canvas style={StyleSheet.absoluteFill}>
        {ready && (
          <Group
            origin={{ x: size.w / 2, y: size.h / 2 }}
            transform={rotated ? [{ rotate: Math.PI / 2 }] : undefined}>
            <SkiaImage image={image} fit={fit} x={0} y={0} width={size.w} height={size.h}>
              <ColorMatrix matrix={matrix} />
            </SkiaImage>
          </Group>
        )}
      </Canvas>
    </View>
  );
}

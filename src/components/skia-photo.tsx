import {
  Canvas,
  ColorMatrix,
  Group,
  Image as SkiaImage,
  useImage,
} from '@shopify/react-native-skia';
import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

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
  const image = useImage(uri);
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

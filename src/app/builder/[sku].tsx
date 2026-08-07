import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { PhotoCanvasBackground } from '@/components/photo-canvas-background';
import {
  CHEVRON_DOWN,
  CHEVRON_LEFT,
  CHEVRON_UP,
  DELETE_ICON,
  FILL_ICON,
  FILTER_ICON,
  FIT_ICON,
  PLUS_ICON,
  ROTATE_LANDSCAPE_ICON,
  ROTATE_PORTRAIT_ICON,
} from '@/constants/builder-icons';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A photo picked on the PDP and passed to the builder. */
type PickedPhoto = { uri: string; width?: number; height?: number };

/** Format a USD amount, e.g. 1350 → "$1,350.00". */
function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Header Back — a labeled "Back" matching the browse screens (over the native
 *  back button that the push would otherwise show). */
function HeaderBack() {
  const theme = useTheme();
  return (
    <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
      <SvgXml xml={CHEVRON_LEFT} width={24} height={24} color={theme.text} />
      <Text style={[styles.backLabel, { color: theme.text }]}>Back</Text>
    </Pressable>
  );
}

/**
 * Product builder — the photo editor. Reached from the PDP once a size and
 * photos are chosen (see `docs/photo-flow.md`). Lives at the root of the
 * navigation tree (a sibling of the `(tabs)` group), so it pushes OVER the tab
 * bar with a natural right-to-left slide; a header carries the title + a Back.
 *
 * Shows the active photo on a dot-grid canvas with the fit/fill, rotate, and
 * (todo) filter controls, a size selector, a scrollable thumbnail strip of the
 * chosen photos, and the Quantity/total + Add-to-Cart bar.
 */
export default function BuilderScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // Passed from the PDP so we can use them without refetching: the chosen size
  // ("11x14 in"), its unit price ("60.00"), and the picked photos.
  const { size, price, photos: photosParam } = useLocalSearchParams<{
    size?: string;
    price?: string;
    photos?: string;
  }>();

  // Seed the picked photos from the route param into local state so the delete
  // control can remove them. The count is the number of prints (drives the
  // "Add N to Cart" label); each photo's dimensions set the default rotation.
  const [photos, setPhotos] = useState<PickedPhoto[]>(() => {
    try {
      return photosParam ? (JSON.parse(photosParam) as PickedPhoto[]) : [];
    } catch {
      return [];
    }
  });
  const photoCount = Math.max(1, photos.length);

  // Total = the selected size's unit price × number of photos.
  // TODO: recompute the unit price when the in-builder size picker is wired.
  const totalLabel = formatUSD((Number(price) || 0) * photoCount);

  // Canvas-control state.
  const [fillMode, setFillMode] = useState<'fit' | 'fill'>('fit'); // contain vs cover
  const [rotated, setRotated] = useState(false); // 90° off the photo's natural orientation
  const [sizeOpen, setSizeOpen] = useState(false); // size picker open (chevron flips)
  const [activeThumb, setActiveThumb] = useState(0); // selected photo — first is selected on load
  const [dockHeight, setDockHeight] = useState(0); // measured; photo area sits 32 above the strip

  // The photo on the canvas — the selected thumbnail (first by default).
  const shown = photos[activeThumb];
  const shownNaturalLandscape = !!(shown?.width && shown?.height && shown.width > shown.height);
  // The rotate icon reflects the orientation the photo is currently displayed in
  // (portrait → offer rotate-to-landscape, and vice versa).
  const displayedLandscape = shownNaturalLandscape !== rotated;

  // Delete: confirm, then remove the active photo. Removing the last one leaves
  // nothing to build, so go back; otherwise keep focus on the slot (the next
  // photo shifts into it), clamping when the last photo was the one removed.
  const confirmRemove = () => {
    if (photos.length <= 1) {
      router.back();
      return;
    }
    const removeAt = activeThumb;
    setPhotos((prev) => prev.filter((_, i) => i !== removeAt));
    setActiveThumb((i) => Math.min(i, photos.length - 2));
  };

  const onDeletePress = () => {
    Alert.alert('Remove this photo?', 'It’ll be taken out of your order — you can add it back anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: confirmRemove },
    ]);
  };

  // Add more photos: a fresh unlimited multi-select picker, appended to the list.
  const onAddPhotos = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 0,
      quality: 1,
    });
    if (picked.canceled || picked.assets.length === 0) return;
    const added = picked.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
    setPhotos((prev) => [...prev, ...added]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Customize',
          headerLeft: () => <HeaderBack />,
        }}
      />
      <PhotoCanvasBackground />

      {/* The photo being edited: 32 below the action row, 32 above the strip,
          16 inset L/R. fit/fill → contain/cover; rotate → 90° transform. */}
      {shown?.uri && (
        <View style={[styles.photoArea, { bottom: dockHeight + 32 }]}>
          <Image
            source={{ uri: shown.uri }}
            style={[styles.photo, rotated && styles.photoRotated]}
            contentFit={fillMode === 'fill' ? 'cover' : 'contain'}
          />
        </View>
      )}

      {/* Delete the active photo (confirms first). */}
      <Pressable
        onPress={onDeletePress}
        style={[
          styles.deleteButton,
          { borderColor: theme.deleteBorder, backgroundColor: theme.background },
        ]}>
        <SvgXml xml={DELETE_ICON} width={24} height={24} />
      </Pressable>

      {/* Connected controls: fit/fill · rotate · filter. */}
      <View
        style={[
          styles.toolbar,
          { borderColor: theme.borderStrong, backgroundColor: theme.background },
        ]}>
        <Pressable
          style={styles.toolButton}
          onPress={() => setFillMode((m) => (m === 'fit' ? 'fill' : 'fit'))}>
          <SvgXml
            xml={fillMode === 'fill' ? FILL_ICON : FIT_ICON}
            width={24}
            height={24}
            color={theme.text}
          />
        </Pressable>
        <Pressable
          style={[styles.toolButton, styles.toolDivider, { borderLeftColor: theme.borderStrong }]}
          onPress={() => setRotated((r) => !r)}>
          <SvgXml
            xml={displayedLandscape ? ROTATE_PORTRAIT_ICON : ROTATE_LANDSCAPE_ICON}
            width={24}
            height={24}
            color={theme.text}
          />
        </Pressable>
        {/* TODO: filter tap behavior (to be defined). */}
        <Pressable
          style={[styles.toolButton, styles.toolDivider, { borderLeftColor: theme.borderStrong }]}>
          <SvgXml xml={FILTER_ICON} width={24} height={24} color={theme.text} />
        </Pressable>
      </View>

      {/* Size selector — top-right. Reflects the size chosen on the PDP. */}
      {/* TODO: wire the size changer/picker (for now the tap just flips the chevron). */}
      <Pressable
        onPress={() => setSizeOpen((o) => !o)}
        style={[
          styles.sizeSelector,
          { borderColor: theme.text, backgroundColor: theme.background },
        ]}>
        <Text style={[styles.sizeSelectorText, { color: theme.text }]}>{size}</Text>
        <SvgXml
          xml={sizeOpen ? CHEVRON_DOWN : CHEVRON_UP}
          width={20}
          height={20}
          color={theme.text}
        />
      </Pressable>

      {/* Bottom dock: a transparent thumbnail strip 16 above the white bar. */}
      <View
        style={styles.bottomDock}
        onLayout={(e) => setDockHeight(e.nativeEvent.layout.height)}>
        {/* Selected-photos strip — transparent, 16 inset, horizontally scrollable.
            Tapping a thumb marks it active (2px Primary/600 border). */}
        <View style={styles.thumbStrip}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbContent}>
            {photos.map((photo, i) => (
              <Pressable
                key={`${photo.uri}-${i}`}
                onPress={() => setActiveThumb(i)}
                style={[
                  styles.thumb,
                  i > 0 && styles.thumbGap,
                  activeThumb === i && { borderWidth: 2, borderColor: theme.deleteBorder },
                ]}>
                <Image source={{ uri: photo.uri }} style={styles.thumbImage} contentFit="cover" />
              </Pressable>
            ))}
            {/* Add-photo tile — opens a fresh picker to append more photos. */}
            <Pressable
              onPress={onAddPhotos}
              style={[
                styles.addTile,
                { borderColor: theme.borderStrong, backgroundColor: theme.background },
              ]}>
              <SvgXml xml={PLUS_ICON} width={24} height={24} color={theme.text} />
            </Pressable>
          </ScrollView>
        </View>

        {/* White bar — holds Quantity + total and the Add to Cart CTA. The CTA
            sits 12 above the home indicator (this screen pushes over the tabs
            from the root stack, so insets.bottom is the true safe-area inset). */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.background,
              paddingBottom: 12 + insets.bottom,
            },
          ]}>
          {/* Quantity + total, stacked, left-aligned. */}
          <View style={styles.priceBlock}>
            <Text style={[styles.quantityLabel, { color: theme.textTertiary }]}>
              Quantity: {photoCount}
            </Text>
            <Text style={[styles.priceLabel, { color: theme.text }]}>{totalLabel}</Text>
          </View>

          {/* TODO: wire Add to Cart (add the built print × photoCount to the cart). */}
          <Pressable style={[styles.addButton, { backgroundColor: theme.primary }]}>
            <Text style={[styles.addLabel, { color: theme.onPrimary }]}>
              Add {photoCount} to Cart
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  photoArea: {
    position: 'absolute',
    top: 96, // 32 below the 48-tall action row at top:16 (16 + 48 + 32)
    left: 16, // 16 leading
    right: 16, // 16 trailing
    // bottom = dockHeight + 32 (32 above the strip) is applied inline.
    overflow: 'hidden', // crop 'cover' / a rotated photo to the frame
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoRotated: {
    transform: [{ rotate: '90deg' }],
  },
  deleteButton: {
    position: 'absolute',
    top: 16, // 16 below the nav bar
    left: 16, // 16 from the left edge
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    position: 'absolute',
    top: 16, // aligned with the delete button
    left: 76, // 12 to the right of the delete button (16 + 48 + 12)
    flexDirection: 'row',
    height: 48,
    borderWidth: 1,
    borderRadius: 8, // rounds the outer (left + right) corners of the group
    overflow: 'hidden',
  },
  toolButton: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolDivider: {
    borderLeftWidth: 1, // separates each square from the previous one
  },
  sizeSelector: {
    position: 'absolute',
    top: 16, // 16 below the nav bar
    right: 16, // 16 from the trailing edge
    height: 48,
    flexDirection: 'row',
    alignItems: 'center', // centers the size text vertically (12 top/bottom)
    borderRadius: 8,
    borderWidth: 1,
    paddingLeft: 16, // size text 16 from the leading edge
    paddingRight: 16,
  },
  sizeSelectorText: {
    fontFamily: FontFamily.bodyMedium, // Body1 / Medium
    fontSize: 16,
    lineHeight: 24,
    marginRight: 4, // 4 to the chevron
  },
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // transparent — the canvas shows through the strip and the 16 gap.
  },
  thumbStrip: {
    height: 48,
    marginHorizontal: 16, // 16 leading/trailing on the page
    marginBottom: 16, // 16 above the white bar
  },
  thumbContent: {
    flexGrow: 1, // fill the strip so few thumbs can center
    justifyContent: 'center', // center the group when it doesn't overflow
    alignItems: 'center',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumbGap: {
    marginLeft: 8, // 8 between thumbnails
  },
  addTile: {
    width: 48,
    height: 48,
    marginLeft: 8, // 8 after the last photo
    borderRadius: 8,
    borderWidth: 2, // Gray/300
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center', // vertically center the price block against the button
    justifyContent: 'space-between',
    paddingTop: 12, // top gap unspecified — mirror the 12 bottom gap
    paddingLeft: 16, // price block 16 from the leading edge
    paddingRight: 16, // button 16 from the trailing edge
    // paddingBottom (12 + safe-area inset) is applied inline.
  },
  priceBlock: {
    flexShrink: 1, // yield to the fixed-width button if space is tight
  },
  quantityLabel: {
    fontFamily: FontFamily.body, // Caption / Regular
    fontSize: 12,
    lineHeight: 18,
  },
  priceLabel: {
    fontFamily: FontFamily.bodySemiBold, // SemiBold
    fontSize: 20,
    lineHeight: 26,
  },
  addButton: {
    width: 250,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontFamily: FontFamily.bodySemiBold, // Body / SemiBold (matches the PDP Select CTA)
    fontSize: 16,
    lineHeight: 24,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 17,
  },
});

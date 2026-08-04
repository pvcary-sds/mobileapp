import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  uri?: string;
  /** Fixed image height in px. */
  height: number;
  /** Extra styling on the image container (e.g. a border radius). */
  style?: StyleProp<ViewStyle>;
};

/**
 * A catalog image area (shared by tier1 / tier2 cards). Shows a native spinner
 * while the image loads, and an icon placeholder when there's no image or the
 * load fails. Fills its parent's width at the given height.
 */
export function CatalogImage({ uri, height, style }: Props) {
  const theme = useTheme();
  const [loading, setLoading] = useState(Boolean(uri));
  const [failed, setFailed] = useState(false);

  const showImage = Boolean(uri) && !failed;
  const showPlaceholder = !uri || failed;

  return (
    <View style={[styles.image, { height, backgroundColor: theme.backgroundElement }, style]}>
      {showImage && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
        />
      )}
      {showImage && loading && (
        <View style={styles.overlay}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      )}
      {showPlaceholder && (
        <View style={styles.overlay}>
          <Ionicons name="image-outline" size={40} color={theme.textMuted} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

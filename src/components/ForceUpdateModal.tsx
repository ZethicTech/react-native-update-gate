import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
  type ViewStyle,
} from 'react-native';
import { presentUpdate } from '../present';
import type { ThemingProps, UpdateGateTheme } from '../types';
import { useTheme, withAlpha } from './theme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let BlurView: React.ComponentType<any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  BlurView = require('@react-native-community/blur').BlurView;
} catch {
  // optional peer dep
}

export interface ForceUpdateModalProps extends ThemingProps {
  /** Whether the blocking modal is visible. Typically `verdict === 'force'`. */
  visible: boolean;

  /** Headline shown above the body. */
  title?: string;
  /** Body copy explaining why the update is required. */
  message?: string;
  /** Label for the single CTA button. */
  buttonText?: string;
  /** Optional inline label, e.g. `"v1.5.0 → v1.6.0"`. Rendered as a tinted pill. */
  versionLabel?: string;

  /** Override the default CTA behaviour. By default, tapping the button calls `presentUpdate('force' on Android, 'suggest' on iOS)`. */
  onPressUpdate?: () => void;

  /** Accessibility label for the CTA button. */
  buttonAccessibilityLabel?: string;
  /** Accessibility hint for the CTA button. */
  buttonAccessibilityHint?: string;
}

const ANIM_DURATION = 260;
const ICON_BOB_DISTANCE = 3;

export const ForceUpdateModal: React.FC<ForceUpdateModalProps> = ({
  visible,
  title = 'Update Required',
  message = 'A new version of this app is available. Please update to continue.',
  buttonText = 'Update Now',
  versionLabel,
  icon,
  accent,
  theme: themeOverride,
  onPressUpdate,
  buttonAccessibilityLabel,
  buttonAccessibilityHint,
}) => {
  const theme = useTheme(themeOverride, accent);
  const styles = useStyles(theme);

  const [mounted, setMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(40)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const iconBob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIM_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: ANIM_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslate, {
          toValue: 0,
          duration: ANIM_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      if (!icon) {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(iconBob, {
              toValue: -ICON_BOB_DISTANCE,
              duration: 800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(iconBob, {
              toValue: 0,
              duration: 800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        );
        loop.start();
        return () => loop.stop();
      }
      return undefined;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIM_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: ANIM_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslate, {
        toValue: 40,
        duration: ANIM_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
    return undefined;
  }, [visible, backdropOpacity, cardOpacity, cardTranslate, iconBob, icon]);

  const handlePressIn = (): void => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = (): void => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 10,
    }).start();
  };

  const handlePress = (): void => {
    Vibration.vibrate(10);
    if (onPressUpdate) {
      onPressUpdate();
      return;
    }
    const mode = Platform.OS === 'android' ? 'force' : 'suggest';
    presentUpdate(mode).catch(() => undefined);
  };

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={noop}
      accessibilityViewIsModal
    >
      {BlurView && Platform.OS === 'ios' ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
          pointerEvents="none"
        >
          <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={12} />
        </Animated.View>
      ) : null}

      <Animated.View
        style={[
          styles.backdrop,
          { backgroundColor: theme.background, opacity: backdropOpacity },
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslate }],
            },
          ]}
        >
          <Animated.View
            style={[styles.iconSlot, { transform: [{ translateY: iconBob }] }]}
          >
            {icon ?? <DefaultDownloadIcon accent={theme.primary} />}
          </Animated.View>

          <View style={styles.accentBar} />

          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>

          {versionLabel ? (
            <View style={styles.versionPill}>
              <Text style={styles.versionPillText}>{versionLabel}</Text>
            </View>
          ) : null}

          <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
            <Pressable
              onPress={handlePress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel={buttonAccessibilityLabel ?? buttonText}
              accessibilityHint={
                buttonAccessibilityHint ??
                'Opens the app store so you can install the latest version'
              }
              hitSlop={8}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const DefaultDownloadIcon: React.FC<{ accent: string }> = ({ accent }) => (
  <View
    style={{
      width: 72,
      height: 72,
      borderRadius: 22,
      backgroundColor: withAlpha(accent, 0.12),
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text
      style={{
        fontSize: 38,
        fontWeight: '700',
        color: accent,
        lineHeight: 42,
      }}
    >
      ↓
    </Text>
  </View>
);

const noop = (): void => undefined;

const useStyles = (t: UpdateGateTheme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    } as ViewStyle,
    card: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: t.surface,
      borderRadius: t.radius,
      padding: 28,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: t.shadow,
          shadowOpacity: 0.12,
          shadowRadius: 32,
          shadowOffset: { width: 0, height: 16 },
        },
        android: {
          elevation: 12,
        },
        default: {},
      }),
    } as ViewStyle,
    iconSlot: {
      marginBottom: 18,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    accentBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: withAlpha(t.primary, 0.4),
      marginBottom: 14,
    } as ViewStyle,
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: t.text,
      textAlign: 'center',
      marginBottom: 10,
      letterSpacing: -0.4,
    },
    message: {
      fontSize: 15,
      lineHeight: 22,
      color: t.textMuted,
      textAlign: 'center',
      marginBottom: 6,
    },
    versionPill: {
      marginTop: 10,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: withAlpha(t.primary, 0.1),
    } as ViewStyle,
    versionPillText: {
      color: t.primary,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      fontVariant: ['tabular-nums'],
    },
    button: {
      backgroundColor: t.primary,
      borderRadius: 999,
      paddingVertical: 16,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 22,
      minHeight: 56,
      width: '100%',
    } as ViewStyle,
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: t.onPrimary,
      letterSpacing: 0.2,
    },
  });

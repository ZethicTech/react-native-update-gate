import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { presentUpdate } from '../present';
import type { ThemingProps, UpdateGateTheme } from '../types';
import { useTheme, withAlpha } from './theme';

export interface SuggestUpdateBannerProps extends ThemingProps {
  visible: boolean;
  title?: string;
  message?: string;
  actionText?: string;

  /** Where the banner anchors. Default `'top'`. */
  position?: 'top' | 'bottom';

  /** Auto-dismiss after N milliseconds without user interaction. */
  autoHideAfter?: number;

  /** Optional callback fired AFTER dismissal completes (close tap, action tap, swipe, or autoHide). */
  onDismiss?: () => void;

  /** Override the default tap behaviour. Defaults to `presentUpdate('suggest')`. */
  onPressAction?: () => void;

  /** Allow swipe-to-dismiss (swipe up for top, swipe down for bottom). Default `true`. */
  swipeToDismiss?: boolean;
}

const ANIM_DURATION = 300;
const SWIPE_DISMISS_THRESHOLD = 40;

export const SuggestUpdateBanner: React.FC<SuggestUpdateBannerProps> = ({
  visible,
  title = 'Update available',
  message = 'A new version with improvements is ready to install.',
  actionText = 'Update',
  position = 'top',
  autoHideAfter,
  onDismiss,
  onPressAction,
  swipeToDismiss = true,
  icon,
  accent,
  theme: themeOverride,
}) => {
  const theme = useTheme(themeOverride, accent);
  const styles = useStyles(theme, position);

  const [userDismissed, setUserDismissed] = useState(false);
  const effectiveVisible = visible && !userDismissed;

  const previousVisible = useRef(visible);

  const [mounted, setMounted] = useState(effectiveVisible);
  const translate = useRef(new Animated.Value(position === 'top' ? -120 : 120)).current;
  const dragOffset = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const composedTranslate = useMemo(
    () => Animated.add(translate, dragOffset),
    [translate, dragOffset],
  );

  // Reset when the parent re-enters a suggest cycle.
  useEffect(() => {
    if (!previousVisible.current && visible) setUserDismissed(false);
    previousVisible.current = visible;
  }, [visible]);

  const dismiss = useCallback(() => {
    setUserDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          swipeToDismiss && Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          if (position === 'top' && g.dy < 0) dragOffset.setValue(g.dy);
          if (position === 'bottom' && g.dy > 0) dragOffset.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          const past = position === 'top' ? g.dy < -SWIPE_DISMISS_THRESHOLD : g.dy > SWIPE_DISMISS_THRESHOLD;
          if (past) {
            dismiss();
            dragOffset.setValue(0);
          } else {
            Animated.spring(dragOffset, {
              toValue: 0,
              useNativeDriver: true,
              speed: 30,
              bounciness: 6,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragOffset, {
            toValue: 0,
            useNativeDriver: true,
            speed: 30,
            bounciness: 6,
          }).start();
        },
      }),
    [swipeToDismiss, position, dragOffset, dismiss],
  );

  useEffect(() => {
    if (effectiveVisible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translate, {
          toValue: 0,
          duration: ANIM_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(translate, {
        toValue: position === 'top' ? -120 : 120,
        duration: ANIM_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [effectiveVisible, translate, opacity, position]);

  useEffect(() => {
    if (!effectiveVisible || !autoHideAfter || autoHideAfter <= 0) return undefined;
    const handle = setTimeout(() => dismiss(), autoHideAfter);
    return () => clearTimeout(handle);
  }, [effectiveVisible, autoHideAfter, dismiss]);

  if (!mounted) return null;

  const handleAction = (): void => {
    if (onPressAction) onPressAction();
    else presentUpdate('suggest').catch(() => undefined);
    dismiss();
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { transform: [{ translateY: composedTranslate }], opacity },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      {...panResponder.panHandlers}
    >
      <View style={styles.card}>
        <View style={styles.accentBar} />

        <View style={styles.iconSlot}>
          {icon ?? <DefaultUpIcon accent={theme.primary} />}
        </View>

        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>

        <Pressable
          onPress={handleAction}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionPressed]}
          accessibilityRole="button"
          accessibilityLabel={actionText}
          hitSlop={6}
        >
          <Text style={styles.actionText}>{actionText}</Text>
        </Pressable>

        <Pressable
          onPress={dismiss}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closePressed]}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={12}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const DefaultUpIcon: React.FC<{ accent: string }> = ({ accent }) => (
  <View
    style={{
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: withAlpha(accent, 0.12),
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text style={{ fontSize: 18, fontWeight: '700', color: accent, lineHeight: 20 }}>↑</Text>
  </View>
);

const useStyles = (t: UpdateGateTheme, position: 'top' | 'bottom') =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      ...(position === 'top'
        ? { top: Platform.OS === 'ios' ? 56 : 24 }
        : { bottom: Platform.OS === 'ios' ? 40 : 24 }),
    } as ViewStyle,
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surface,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      paddingLeft: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: t.shadow,
          shadowOpacity: 0.1,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
        },
        android: {
          elevation: 6,
        },
        default: {},
      }),
    } as ViewStyle,
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: t.primary,
    } as ViewStyle,
    iconSlot: {
      marginRight: 12,
      marginLeft: 4,
    } as ViewStyle,
    textCol: {
      flex: 1,
      marginRight: 10,
    } as ViewStyle,
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: t.text,
      marginBottom: 2,
      letterSpacing: -0.1,
    },
    message: {
      fontSize: 13,
      color: t.textMuted,
      lineHeight: 17,
    },
    actionBtn: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: t.primary,
      borderRadius: 999,
      marginRight: 4,
    } as ViewStyle,
    actionPressed: {
      opacity: 0.85,
    } as ViewStyle,
    actionText: {
      color: t.onPrimary,
      fontSize: 13,
      fontWeight: '600',
    },
    closeBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    closePressed: {
      opacity: 0.5,
    } as ViewStyle,
    closeText: {
      color: t.textMuted,
      fontSize: 22,
      lineHeight: 24,
      fontWeight: '400',
    },
  });

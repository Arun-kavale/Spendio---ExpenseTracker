/**
 * Toast Component
 * 
 * A beautiful, animated toast notification system for user feedback.
 * Supports success, error, warning, and info types.
 */

import React, {
  memo,
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {View, Text, StyleSheet, Dimensions, Pressable} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/hooks';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  showToast: (config: Omit<ToastConfig, 'id'>) => void;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem = memo<ToastConfig & {onHide: (id: string) => void}>(
  ({id, type, title, message, duration = 3000, action, onHide}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const progress = useSharedValue(1);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const iconConfig = {
      success: {name: 'check-circle', color: theme.colors.success},
      error: {name: 'alert-circle', color: theme.colors.error},
      warning: {name: 'alert', color: theme.colors.warning},
      info: {name: 'information', color: theme.colors.info},
    };
    
    const config = iconConfig[type];
    
    useEffect(() => {
      // Start progress animation
      progress.value = withTiming(0, {duration});
      
      // Auto dismiss
      timeoutRef.current = setTimeout(() => {
        onHide(id);
      }, duration);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [duration, id, onHide, progress]);
    
    const progressStyle = useAnimatedStyle(() => ({
      width: `${progress.value * 100}%`,
    }));
    
    return (
      <Animated.View
        entering={SlideInUp.springify().damping(15).stiffness(150)}
        exiting={SlideOutUp.springify().damping(15).stiffness(150)}
        style={[
          styles.toastContainer,
          {
            backgroundColor: theme.colors.card,
            borderColor: config.color + '30',
            marginTop: insets.top + 8,
            shadowColor: theme.colors.shadowLarge,
          },
        ]}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            {backgroundColor: config.color + '15'},
          ]}>
          <Icon name={config.name} size={20} color={config.color} />
        </View>
        
        {/* Content */}
        <View style={styles.contentContainer}>
          <Text
            style={[styles.title, {color: theme.colors.text}]}
            numberOfLines={1}>
            {title}
          </Text>
          {message && (
            <Text
              style={[styles.message, {color: theme.colors.textSecondary}]}
              numberOfLines={2}>
              {message}
            </Text>
          )}
        </View>
        
        {/* Action or Close */}
        {action ? (
          <Pressable
            onPress={() => {
              action.onPress();
              onHide(id);
            }}
            style={styles.actionButton}>
            <Text style={[styles.actionText, {color: theme.colors.primary}]}>
              {action.label}
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => onHide(id)} style={styles.closeButton}>
            <Icon name="close" size={18} color={theme.colors.textMuted} />
          </Pressable>
        )}
        
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {backgroundColor: config.color},
              progressStyle,
            ]}
          />
        </View>
      </Animated.View>
    );
  },
);

export const ToastProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);
  
  const showToast = useCallback((config: Omit<ToastConfig, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, {...config, id}]);
  }, []);
  
  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);
  
  return (
    <ToastContext.Provider value={{showToast, hideToast, hideAllToasts}}>
      {children}
      <View style={styles.toastWrapper} pointerEvents="box-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} {...toast} onHide={hideToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SCREEN_WIDTH - 32,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  message: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    marginLeft: 4,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'transparent',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});

export default ToastProvider;

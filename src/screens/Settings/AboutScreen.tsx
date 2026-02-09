/**
 * About Screen
 * 
 * App information and credits.
 */

import React, {memo} from 'react';
import {View, Text, StyleSheet, ScrollView, Image, Linking, Pressable} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '@/hooks';
import {Card, AdvancedHeader} from '@/components/common';
import {SpendioLogo} from '@/assets';

export const AboutScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <AdvancedHeader
        title="About"
        showBack
        onBack={() => navigation.goBack()}
        variant="elevated"
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 24}]}
        showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.logoContainer}>
          <Image
            source={SpendioLogo}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityLabel="Spendio logo"
          />
          <Text style={[styles.version, {color: theme.colors.textSecondary}]}>
            Version 1.0.0
          </Text>
        </Animated.View>
        
        {/* Description */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Card padding="large" style={styles.card}>
            <Text style={[styles.description, {color: theme.colors.textSecondary}]}>
              Spendio is a beautiful and intuitive personal finance app designed to help you
              take control of your finances. Track spending, analyze patterns, and
              make smarter financial decisions.
            </Text>
          </Card>
        </Animated.View>
        
        {/* Features */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card padding="large" style={styles.card}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              Key Features
            </Text>
            
            {[
              {icon: 'chart-arc', text: 'Beautiful analytics dashboard'},
              {icon: 'cloud-sync', text: 'Optional Google Drive backup'},
              {icon: 'shape-outline', text: 'Customizable categories'},
              {icon: 'theme-light-dark', text: 'Dark & light mode'},
              {icon: 'export', text: 'Export to CSV/JSON'},
              {icon: 'shield-lock', text: '100% offline & private'},
            ].map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Icon
                  name={feature.icon}
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={[styles.featureText, {color: theme.colors.text}]}>
                  {feature.text}
                </Text>
              </View>
            ))}
          </Card>
        </Animated.View>
        
        {/* Privacy */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Card padding="large" style={styles.card}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              Privacy First
            </Text>
            <Text style={[styles.description, {color: theme.colors.textSecondary}]}>
              Your financial data stays on your device. We don't collect, store,
              or have access to any of your expense information. Cloud backup is
              optional and goes directly to your personal Google Drive.
            </Text>
          </Card>
        </Animated.View>

        {/* Developer */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Card padding="large" style={styles.card}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              Developer
            </Text>
            <Text style={[styles.developerName, {color: theme.colors.text}]}>
              Arun Kawale
            </Text>
            <Pressable
              onPress={() => Linking.openURL('mailto:arun.kavale@gmail.com')}
              style={({pressed}) => [{opacity: pressed ? 0.7 : 1}]}>
              <Text style={[styles.developerEmail, {color: theme.colors.primary}]}>
                arun.kavale@gmail.com
              </Text>
            </Pressable>
          </Card>
        </Animated.View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, {color: theme.colors.textMuted}]}>
            Built with React Native
          </Text>
        </View>
      </ScrollView>
    </View>
  );
});

AboutScreen.displayName = 'AboutScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoImage: {
    width: 180,
    height: 56,
  },
  version: {
    fontSize: 14,
    marginTop: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    marginLeft: 12,
  },
  developerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  developerEmail: {
    fontSize: 15,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 13,
  },
});

export default AboutScreen;

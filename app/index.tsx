import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassView } from '../src/components/glass';
import { hasWebSignup, openWebSignup } from '../src/lib/web-app';
import { useAuth } from '../src/providers/auth-provider';

const BACKGROUND_BOTTOM = '#010e29';

type IconName = keyof typeof Ionicons.glyphMap;

const featureCards: Array<{ icon: IconName; title: string; detail: string }> = [
  { icon: 'document-text-outline', title: 'Tenders', detail: 'Discover opportunities' },
  { icon: 'bar-chart-outline', title: 'Analyse', detail: 'Smarter decisions' },
  { icon: 'shield-checkmark-outline', title: 'Compliance', detail: 'Stay compliant' },
  { icon: 'locate-outline', title: 'Opportunities', detail: 'Find your next bid' },
];

const slides = [
  { kicker: 'Meet', title: 'NOVA', body: 'Your procurement intelligence, wherever business takes you.' },
  { kicker: 'Never miss a', title: 'Deadline', body: 'Closing dates and briefings from your TenderPilot workspace, in your pocket.' },
  { kicker: 'Stay', title: 'Compliant', body: 'NOVA reminds you what still needs attention before you submit.' },
  { kicker: 'Always', title: 'In sync', body: 'Work on your PC or your phone. TenderPilot AI keeps both up to date.' },
];

export default function LandingScreen() {
  const { session, isLoading } = useAuth();
  const { width } = useWindowDimensions();
  const [activeSlide, setActiveSlide] = useState(0);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#00d6ff" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/home" />;
  }

  const onSlideScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveSlide(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Anchored left so the logo and NOVA stay in view when a tall screen crops the sides. */}
      <Image
        source={require('../assets/landing-background.jpg')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="left"
      />
      {/* Only the lower part darkens, so the text and buttons read clearly over the picture. */}
      <LinearGradient
        colors={['transparent', 'rgba(1, 14, 41, 0.55)', 'rgba(1, 14, 41, 0.92)']}
        locations={[0.45, 0.62, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.fill}>
        <View style={styles.cards}>
          {featureCards.map((card) => (
            <GlassView key={card.title} intensity={30} style={styles.card}>
              <Ionicons name={card.icon} size={22} color="#9ee9ff" />
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit>
                  {card.title.toUpperCase()}
                </Text>
                <Text style={styles.cardDetail} numberOfLines={1}>
                  {card.detail}
                </Text>
              </View>
            </GlassView>
          ))}
        </View>

        <View style={styles.bottom}>
          <FlatList
            style={styles.slides}
            data={slides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(slide) => slide.title}
            onMomentumScrollEnd={onSlideScroll}
            renderItem={({ item }) => (
              <View style={[styles.slide, { width }]}>
                <Text style={styles.kicker}>{item.kicker}</Text>
                <Text style={styles.title} adjustsFontSizeToFit numberOfLines={1}>
                  {item.title}
                  <Text style={styles.titleDot}>.</Text>
                </Text>
                <Text style={styles.body}>{item.body}</Text>
              </View>
            )}
          />

          <View style={styles.dots}>
            {slides.map((slide, index) => (
              <View key={slide.title} style={[styles.dot, index === activeSlide && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => (hasWebSignup ? openWebSignup() : router.push('/login'))}
              style={({ pressed }) => [styles.primaryShadow, pressed && styles.pressed]}
            >
              <LinearGradient
                colors={['#22e0ff', '#1aa8ff']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#04213a" />
              </LinearGradient>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/login')}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <GlassView intensity={25} style={styles.secondaryButton}>
                <Text style={styles.secondaryText}>Sign In</Text>
              </GlassView>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND_BOTTOM,
  },
  // Must stay transparent: it sits on top of the background picture.
  fill: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BACKGROUND_BOTTOM,
  },
  cards: {
    position: 'absolute',
    top: '12%',
    right: 14,
    width: 168,
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderColor: 'rgba(125, 220, 255, 0.4)',
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardDetail: {
    color: '#c7dcf0',
    fontSize: 11,
    marginTop: 2,
  },
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  // Without flexGrow: 0 the horizontal list stretches to fill the screen and pushes the text to the top.
  slides: {
    flexGrow: 0,
  },
  slide: {
    paddingHorizontal: 28,
  },
  kicker: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '400',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowRadius: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 64,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowRadius: 16,
  },
  titleDot: {
    color: '#00d6ff',
  },
  body: {
    color: '#e3ecf7',
    fontSize: 17,
    lineHeight: 24,
    marginTop: 8,
    minHeight: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowRadius: 8,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 22,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(160, 180, 205, 0.45)',
  },
  dotActive: {
    width: 26,
    backgroundColor: '#00d6ff',
  },
  actions: {
    paddingHorizontal: 24,
    gap: 14,
  },
  primaryShadow: {
    borderRadius: 30,
    shadowColor: '#00d6ff',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  primaryButton: {
    height: 58,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    color: '#04213a',
    fontSize: 19,
    fontWeight: '800',
  },
  secondaryButton: {
    height: 58,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 214, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.85,
  },
});

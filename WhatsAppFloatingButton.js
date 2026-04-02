import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const WhatsAppFloatingButton = () => {
  const pan = useRef(new Animated.ValueXY({ x: 20, y: height - 180 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
onPanResponderRelease: () => {
  pan.flattenOffset();

  // Get current values
  const currentX = pan.x._value;
  const currentY = pan.y._value;

  // Width and height of the button (estimated)
  const BUTTON_WIDTH = 60;
  const BUTTON_HEIGHT = 60;

  // Clamp within screen bounds
  const clampedX = Math.max(0, Math.min(currentX, width - BUTTON_WIDTH));
  const clampedY = Math.max(0, Math.min(currentY, height - BUTTON_HEIGHT - 20)); // 20 for margin

  // Animate to clamped position
  Animated.spring(pan, {
    toValue: { x: clampedX, y: clampedY },
    useNativeDriver: false,
  }).start();
},
    })
  ).current;

  const openWhatsApp = () => {
    const phoneNumber = '+918483062624';
    const message = 'Hi, I need astrology help.';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      alert('Make sure WhatsApp is installed');
    });
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.container, pan.getLayout()]}
    >
      <TouchableOpacity style={styles.button} onPress={openWhatsApp}>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/124/124034.png' }}
          style={styles.icon}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
    elevation: 10,
  },
button: {
  backgroundColor: '#25D366',
  borderRadius: 20,
  padding: 6,
},
icon: {
  width: 40,
  height: 40,
},
});

export default WhatsAppFloatingButton;

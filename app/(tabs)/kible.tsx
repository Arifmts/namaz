import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Kabe koordinatları
const MECCA_LAT = 21.4225;
const MECCA_LNG = 39.8262;

export default function KibleScreen() {
  const [subscription, setSubscription] = useState<any>(null);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const setupCompass = async () => {
      const isSensorAvailable = await Magnetometer.isAvailableAsync();
      if (!isSensorAvailable) {
        setErrorMsg('Cihazınızda pusula sensörü bulunmuyor.');
        return;
      }

      let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        setErrorMsg('Kıble yönünü bulmak için konum izni gereklidir.');
        return;
      }

      try {
        const location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          setErrorMsg("Konum alınamadı. Lütfen GPS'i açıp tekrar deneyin.");
          return;
        }

        const { latitude, longitude } = location.coords;

        const toRad = (deg: number) => deg * (Math.PI / 180);
        const toDeg = (rad: number) => rad * (180 / Math.PI);

        const lat1 = toRad(latitude);
        const lon1 = toRad(longitude);
        const lat2 = toRad(MECCA_LAT);
        const lon2 = toRad(MECCA_LNG);

        const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
        const bearingRad = Math.atan2(y, x);
        const qiblaBearing = (toDeg(bearingRad) + 360) % 360;

        const sub = Magnetometer.addListener(data => {
          const { x, y } = data;
          let angle = Math.atan2(y, x);
          let degree = toDeg(angle);
          degree = (degree + 360) % 360;
          
          const heading = Math.round((degree + 360) % 360);
          setQiblaDirection(heading - qiblaBearing);
        });

        setSubscription(sub);
        setIsReady(true);
      } catch (e) {
        setErrorMsg('Konum veya sensör verisi alınırken bir hata oluştu.');
      }
    };

    setupCompass();

    return () => {
      if (subscription) {
        subscription.remove();
        setSubscription(null);
      }
    };
  }, []);

  const renderContent = () => {
    if (errorMsg) {
      return <Text style={styles.errorText}>{errorMsg}</Text>;
    }

    if (!isReady) {
      return (
        <>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.infoText}>Pusula ayarlanıyor...</Text>
        </>
      );
    }

    return (
      <>
        <Text style={styles.directionText}>Kıble</Text>
        <View style={styles.compassContainer}>
          <View style={[styles.compass, { transform: [{ rotate: `${qiblaDirection}deg` }] }]}>
            <Navigation size={150} color="#fff" strokeWidth={1.5} />
          </View>
          <View style={styles.marker} />
        </View>
        <Text style={styles.infoText}>
          Cihazı, ok işareti yeşil çizgiyi gösterene kadar döndürün.
        </Text>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
       <LinearGradient
        colors={['#1a5f4f', '#2d8a6e', '#3ea87d']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
         <Text style={styles.headerTitle}>Kıble Pusulası</Text>
      </View>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a5f4f',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ffcdd2',
    textAlign: 'center',
    padding: 20,
  },
  infoText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 20,
  },
  directionText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    fontFamily: 'Inter_700Bold',
  },
compassContainer: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  compass: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    position: 'absolute',
    top: -10,
    width: 4,
    height: 35,
    backgroundColor: '#34d399',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

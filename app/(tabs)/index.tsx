import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Moon, Sunrise, Sunset, CloudSun } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as Location from 'expo-location';

interface PrayerTime {
  name: string;
  time: string;
  icon: any;
}

const hijriMonthsTr: { [key: string]: string } = {
  "Muḥarram": "Muharrem", "Ṣafar": "Safer", "Rabīʿ al-awwal": "Rebiülevvel", "Rabīʿ al-thānī": "Rebiülahir",
  "Jumādá al-ūlá": "Cemaziyelevvel", "Jumādá al-ākhirah": "Cemaziyelahir", "Rajab": "Recep", "Shaʿbān": "Şaban",
  "Ramaḍān": "Ramazan", "Shawwāl": "Şevval", "Dhū al-Qaʿdah": "Zilkade", "Dhū al-Ḥijjah": "Zilhicce"
};

export default function PrayerTimesScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [hijriDate, setHijriDate] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('Konum alınıyor...');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Konum izni reddedildi. Doğru vakitler için lütfen ayarlardan izin verin.');
        setLocationName('İzin Gerekli');
        fetchPrayerTimes(41.0082, 28.9784); 
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync(location.coords);
        if (address && address.length > 0) {
          setLocationName(`${address[0].city || 'Bilinmeyen'}, ${address[0].country || ''}`);
        }
        fetchPrayerTimes(location.coords.latitude, location.coords.longitude);
      } catch (e) {
        setErrorMsg("Konum alınamadı. Varsayılan konum için vakitler gösteriliyor.");
        setLocationName('İstanbul, Türkiye');
        fetchPrayerTimes(41.0082, 28.9784);
      }
    })();
  }, []);

  const fetchPrayerTimes = async (latitude: number, longitude: number) => {
    try {
      const date = new Date();
      const response = await fetch(`https://api.aladhan.com/v1/timings/${Math.floor(date.getTime() / 1000)}?latitude=${latitude}&longitude=${longitude}&method=3`);
      const data = await response.json();
      
      if (data.code === 200) {
        const timings = data.data.timings;
        const formattedPrayerTimes: PrayerTime[] = [
          { name: 'İmsak', time: timings.Fajr, icon: Moon },
          { name: 'Güneş', time: timings.Sunrise, icon: Sunrise },
          { name: 'Öğle', time: timings.Dhuhr, icon: Sun },
          { name: 'İkindi', time: timings.Asr, icon: CloudSun },
          { name: 'Akşam', time: timings.Maghrib, icon: Sunset },
          { name: 'Yatsı', time: timings.Isha, icon: Moon },
        ];
        setPrayerTimes(formattedPrayerTimes);
        
        const hijriApiMonth = data.data.date.hijri.month.en;
        const hijriMonthTr = hijriMonthsTr[hijriApiMonth] || hijriApiMonth;
        setHijriDate(`${data.data.date.hijri.day} ${hijriMonthTr} ${data.data.date.hijri.year}`);
      } else {
        setErrorMsg('Namaz vakitleri alınamadı.');
      }
    } catch (error) {
      setErrorMsg('Bir hata oluştu. İnternet bağlantınızı kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const getNextPrayer = () => {
    if (prayerTimes.length === 0) {
      return { name: '...', time: '...', remaining: 'Vakitler yükleniyor...' };
    }

    const current = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    for (let i = 0; i < prayerTimes.length; i++) {
      const [hours, minutes] = prayerTimes[i].time.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;
      
      if (current < prayerMinutes) {
        const diff = prayerMinutes - current;
        const hoursLeft = Math.floor(diff / 60);
        const minutesLeft = diff % 60;
        return {
          name: prayerTimes[i].name,
          time: prayerTimes[i].time,
          remaining: `${hoursLeft} sa ${minutesLeft} dk`,
        };
      }
    }
    
    const [fajrHours, fajrMinutes] = prayerTimes[0].time.split(':').map(Number);
    const fajrTotalMinutes = fajrHours * 60 + fajrMinutes;
    const diff = (24 * 60 - current) + fajrTotalMinutes;
    const hoursLeft = Math.floor(diff / 60);
    const minutesLeft = diff % 60;

    return {
      name: prayerTimes[0].name,
      time: prayerTimes[0].time,
      remaining: `${hoursLeft} sa ${minutesLeft} dk`,
    };
  };

  const nextPrayer = getNextPrayer();

  if (isLoading) {
    return (
      <LinearGradient colors={['#1a5f4f', '#2d8a6e']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Konum ve vakitler alınıyor...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#1a5f4f', '#2d8a6e', '#3ea87d']}
        style={styles.gradient}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Namaz Vakitleri</Text>
              <Text style={styles.headerSubtitle}>
                {format(currentTime, 'd MMMM yyyy, EEEE', { locale: tr })}
              </Text>
              <Text style={styles.hijriDate}>{hijriDate}</Text>
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.currentTime}>
                {format(currentTime, 'HH:mm')}
              </Text>
              <Text style={styles.seconds}>
                {format(currentTime, 'ss')}
              </Text>
            </View>
          </View>

          <View style={styles.nextPrayerCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
              style={styles.nextPrayerGradient}
            >
              <Text style={styles.nextPrayerLabel}>Bir Sonraki Vakit</Text>
              <Text style={styles.nextPrayerName}>{nextPrayer.name}</Text>
              <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text>
              <View style={styles.remainingContainer}>
                <Text style={styles.remainingText}>Kalan Süre</Text>
                <Text style={styles.remainingTime}>{nextPrayer.remaining}</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.prayersList}>
            <Text style={styles.listTitle}>Tüm Vakitler</Text>
            {prayerTimes.map((prayer, index) => {
              const Icon = prayer.icon;
              const isNext = prayer.name === nextPrayer.name;
              
              return (
                <View
                  key={index}
                  style={[
                    styles.prayerItem,
                    isNext && styles.prayerItemActive,
                  ]}
                >
                  <View style={styles.prayerItemLeft}>
                    <View style={[styles.iconContainer, isNext && styles.iconContainerActive]}>
                      <Icon 
                        size={24} 
                        color={isNext ? '#1a5f4f' : '#fff'} 
                        strokeWidth={2}
                      />
                    </View>
                    <Text style={[styles.prayerName, isNext && styles.prayerNameActive]}>
                      {prayer.name}
                    </Text>
                  </View>
                  <Text style={[styles.prayerTime, isNext && styles.prayerTimeActive]}>
                    {prayer.time}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>📍 {locationName}</Text>
            <Text style={styles.locationSubtext}>{errorMsg ? errorMsg : 'Vakitler bu konuma göre hesaplanmıştır'}</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a5f4f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  hijriDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontStyle: 'italic',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  currentTime: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  seconds: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: -4,
  },
  nextPrayerCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextPrayerGradient: {
    padding: 24,
    alignItems: 'center',
  },
  nextPrayerLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  nextPrayerName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a5f4f',
    marginBottom: 4,
  },
  nextPrayerTime: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2d8a6e',
    letterSpacing: 2,
  },
  remainingContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    width: '100%',
  },
  remainingText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  remainingTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a5f4f',
  },
  prayersList: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  prayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  prayerItemActive: {
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  prayerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(26,95,79,0.1)',
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  prayerNameActive: {
    color: '#1a5f4f',
  },
  prayerTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  prayerTimeActive: {
    color: '#2d8a6e',
  },
  locationContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  locationText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

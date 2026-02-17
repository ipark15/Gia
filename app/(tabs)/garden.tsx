import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GardenScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Garden</Text>
        <Text style={styles.subtitle}>
          Your garden will grow here as you complete your routines.
        </Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            🌱 Your garden will appear here
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#5A7A6B',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7370',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  placeholder: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#8A9088',
    textAlign: 'center',
  },
});

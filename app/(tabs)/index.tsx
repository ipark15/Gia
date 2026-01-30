import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Welcome to Gia!</Text>
        <Text style={styles.subtitle}>
          You've completed your setup. Your personalized skincare journey starts here.
        </Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            🌱 Your routine dashboard will appear here
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
  greeting: {
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

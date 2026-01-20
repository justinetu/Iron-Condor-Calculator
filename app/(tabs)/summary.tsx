import { StyleSheet, Text, View } from 'react-native';

export default function Summary() {
  return (
    <View style={styles.container}>
      <Text style={{color: '#fff'}}>This is the Summary Screen!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0B0D10'
  }
});
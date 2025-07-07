import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';

const SettingsScreen = ({ navigation, route }) => {
  const { settings, setSettings } = route.params;

  const toggleMusic = () => setSettings(prev => ({ ...prev, music: !prev.music }));
  const toggleSounds = () => setSettings(prev => ({ ...prev, sounds: !prev.sounds }));

  return (
    <View style={styles.container}>
      <View style={styles.settingRow}>
        <Text style={styles.settingText}>Music</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={settings.music ? "#f5dd4b" : "#f4f3f4"}
          onValueChange={toggleMusic}
          value={settings.music}
        />
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.settingText}>Sound Effects</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={settings.sounds ? "#f5dd4b" : "#f4f3f4"}
          onValueChange={toggleSounds}
          value={settings.sounds}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#667eea',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingText: {
    color: '#FFF',
    fontSize: 18,
  },
});

export default SettingsScreen;
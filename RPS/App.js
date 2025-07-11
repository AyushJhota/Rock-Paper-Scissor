import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

// --- Game Logic ---
const initialGameState = {
  opponent_history: [],
  player_score: 0,
  opponent_score: 0,
  tie_score: 0,
  is_paused: false,
  last_result: '',
  last_player_move: '',
  last_opponent_move: ''
};

const player_ai = (opponent_history) => {
  const counter_moves = { "R": "P", "P": "S", "S": "R" };

  if (opponent_history.length === 0) {
    return "R";
  }

  const move_counts = { "R": 0, "P": 0, "S": 0 };
  for (const move of opponent_history) {
    if (move in move_counts) {
      move_counts[move] += 1;
    }
  }

  const predict_next_move = (history, n) => {
    if (history.length < n) {
      return ["R", "P", "S"][Math.floor(Math.random() * 3)];
    }
    const patterns = {};
    for (let i = 0; i < history.length - n; i++) {
      const pattern = history.slice(i, i + n).join('');
      const next_move = history[i + n];
      if (!patterns[pattern]) {
        patterns[pattern] = { "R": 0, "P": 0, "S": 0 };
      }
      patterns[pattern][next_move] += 1;
    }
    const last_pattern = history.slice(-n).join('');
    if (patterns[last_pattern]) {
      return Object.keys(patterns[last_pattern]).reduce((a, b) => patterns[last_pattern][a] > patterns[last_pattern][b] ? a : b);
    }
    return ["R", "P", "S"][Math.floor(Math.random() * 3)];
  };

  const predicted_move = predict_next_move(opponent_history, 5);
  return counter_moves[predicted_move];
};

export default function App() {
  const [gameState, setGameState] = useState(initialGameState);
  const [isLoading, setIsLoading] = useState(false);
  const [animationValue] = useState(new Animated.Value(0));
  const [scaleValues] = useState({
    rock: new Animated.Value(1),
    paper: new Animated.Value(1),
    scissors: new Animated.Value(1)
  });
  const [sound, setSound] = useState();
  const backgroundMusic = useRef(new Audio.Sound());

  useEffect(() => {
    const loadAndPlayMusic = async () => {
      try {
        await backgroundMusic.current.loadAsync(
          require('./assets/game_music.mp3'),
          { shouldPlay: true, isLooping: true, volume: 0.8}
        );
      } catch (error) {
        console.log('Error loading background music:', error);
      }
    };
    loadAndPlayMusic();

    return () => {
      backgroundMusic.current.unloadAsync();
    };
  }, []);

  async function playSound(soundFile, volume = 1.0) {
    const { sound } = await Audio.Sound.createAsync(soundFile, { volume });
    setSound(sound);
    await sound.playAsync();
  }

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const animateButton = (choice) => {
    const choiceMap = { r: 'rock', p: 'paper', s: 'scissors' };
    const fullChoice = choiceMap[choice.toLowerCase()];
    if (!fullChoice) return;

    Animated.sequence([
      Animated.timing(scaleValues[fullChoice], {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(scaleValues[fullChoice], {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animateResult = () => {
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const playRound = async (user_choice) => {
    if (gameState.is_paused || isLoading) return;

    setIsLoading(true);
    animateButton(user_choice);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const opponent_move = player_ai(gameState.opponent_history);
    const new_history = [...gameState.opponent_history, user_choice];

    let result = '';
    let new_player_score = gameState.player_score;
    let new_opponent_score = gameState.opponent_score;
    let new_tie_score = gameState.tie_score;

    if (user_choice === opponent_move) {
      result = "tie";
      new_tie_score += 1;
      playSound(require('./assets/tie.mp3'), 0.2);
    } else if (
      (user_choice === "R" && opponent_move === "S") ||
      (user_choice === "P" && opponent_move === "R") ||
      (user_choice === "S" && opponent_move === "P")
    ) {
      result = "win";
      new_player_score += 1;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      playSound(require('./assets/win.mp3'), 0.2);
    } else {
      result = "lose";
      new_opponent_score += 1;
      Vibration.vibrate(100);
      playSound(require('./assets/lose.mp3'), 0.2);
    }

    setGameState({
      ...gameState,
      player_score: new_player_score,
      opponent_score: new_opponent_score,
      tie_score: new_tie_score,
      opponent_history: new_history,
      last_result: result,
      last_player_move: user_choice,
      last_opponent_move: opponent_move,
    });

    animateResult();
    setIsLoading(false);
  };

  const pauseGame = () => {
    setGameState(prev => ({ ...prev, is_paused: true }));
    backgroundMusic.current?.pauseAsync();
  };

  const resumeGame = () => {
    setGameState(prev => ({ ...prev, is_paused: false }));
    backgroundMusic.current?.playAsync();
  };

  const resetGame = () => {
    setGameState(initialGameState);
  };

  const getResultText = () => {
    switch (gameState.last_result) {
      case 'win': return '🎉 You Win!';
      case 'lose': return '😅 You Lose!';
      case 'tie': return '🤝 It\'s a Tie!';
      default: return 'Choose your move!';
    }
  };

  const getResultColor = () => {
    switch (gameState.last_result) {
      case 'win': return '#4CAF50';
      case 'lose': return '#F44336';
      case 'tie': return '#FF9800';
      default: return '#FFF';
    }
  };

  const getMoveEmoji = (move) => {
    switch (move) {
      case 'R': return '🪨';
      case 'P': return '📄';
      case 'S': return '✂️';
      default: return '❓';
    }
  };

  const getScoreColor = (playerScore, opponentScore) => {
    if (playerScore > opponentScore) return '#4CAF50';
    if (playerScore < opponentScore) return '#F44336';
    return '#FF9800';
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Rock Paper Scissors</Text>
        <Text style={styles.subtitle}>Battle of Minds</Text>
      </View>

      <View style={styles.scoreBoard}>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreLabel, { color: getScoreColor(gameState.player_score, gameState.opponent_score) }]}>
            You
          </Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(gameState.player_score, gameState.opponent_score) }]}>
            {gameState.player_score}
          </Text>
        </View><View style={styles.scoreItem}>
          <Text style={[styles.scoreLabel, { color: '#FF9800' }]}>Ties</Text>
          <Text style={[styles.scoreValue, { color: '#FF9800' }]}>
            {gameState.tie_score}
          </Text>
        </View><View style={styles.scoreItem}>
          <Text style={[styles.scoreLabel, { color: getScoreColor(gameState.opponent_score, gameState.player_score) }]}>
            Bot
          </Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(gameState.opponent_score, gameState.player_score) }]}>
            {gameState.opponent_score}
          </Text>
        </View>
      </View>

      {gameState.last_player_move && (
        <View style={styles.lastMoveContainer}>
          <Text style={styles.lastMoveText}>
            {getMoveEmoji(gameState.last_player_move)} vs {getMoveEmoji(gameState.last_opponent_move)}
          </Text>
        </View>
      )}

      <Animated.View 
        style={[
          styles.resultContainer,
          {
            transform: [{ scale: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.2]
            }) }]
          }
        ]}
      >
        <Text style={[styles.resultText, { color: getResultColor() }]}>
          {getResultText()}
        </Text>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <Animated.View style={{ transform: [{ scale: scaleValues.rock }] }}>
          <TouchableOpacity
            style={[styles.gameButton, { backgroundColor: '#FF6B6B' }]}
            onPress={() => playRound('R')}
            disabled={gameState.is_paused || isLoading}
          >
            <Text style={styles.buttonEmoji}>🪨</Text>
            <Text style={styles.buttonText}>Rock</Text>
          </TouchableOpacity>
        </Animated.View><Animated.View style={{ transform: [{ scale: scaleValues.paper }] }}>
          <TouchableOpacity
            style={[styles.gameButton, { backgroundColor: '#4ECDC4' }]}
            onPress={() => playRound('P')}
            disabled={gameState.is_paused || isLoading}
          >
            <Text style={styles.buttonEmoji}>📄</Text>
            <Text style={styles.buttonText}>Paper</Text>
          </TouchableOpacity>
        </Animated.View><Animated.View style={{ transform: [{ scale: scaleValues.scissors }] }}>
          <TouchableOpacity
            style={[styles.gameButton, { backgroundColor: '#45B7D1' }]}
            onPress={() => playRound('S')}
            disabled={gameState.is_paused || isLoading}
          >
            <Text style={styles.buttonEmoji}>✂️</Text>
            <Text style={styles.buttonText}>Scissors</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.controlContainer}>
        {!gameState.is_paused && (
          <View style={styles.controlButtonRow}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: '#FFC107' }]}
              onPress={pauseGame}
            >
              <Text style={styles.controlButtonText}>Pause</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: '#9C27B0' }]}
              onPress={resetGame}
            >
              <Text style={styles.controlButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {gameState.is_paused && (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseText}>Game Paused</Text>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: '#4CAF50', marginTop: 20 }]}
            onPress={resumeGame}
          >
            <Text style={styles.controlButtonText}>Resume</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    marginTop: 5,
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  scoreItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    minWidth: 80,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  lastMoveContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  lastMoveText: {
    fontSize: 32,
    color: '#FFF',
  },
  resultContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  gameButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonEmoji: {
    fontSize: 32,
    marginBottom: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controlContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
    marginTop: 30,
  },
  controlButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  controlButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  controlButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseText: {
    fontSize: 36,
    color: '#FFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
});

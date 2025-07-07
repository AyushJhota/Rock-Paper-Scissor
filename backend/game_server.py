from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

# Game state
game_state = {
    'opponent_history': [],
    'player_score': 0,
    'opponent_score': 0,
    'tie_score': 0,
    'is_paused': False,
    'last_result': '',
    'last_player_move': '',
    'last_opponent_move': ''
}

def player_ai(prev_play, opponent_history):
    """AI player logic"""
    if prev_play != "":
        opponent_history.append(prev_play)

    counter_moves = {"R": "P", "P": "S", "S": "R"}

    if len(opponent_history) == 0:
        return "R"

    move_counts = {"R": 0, "P": 0, "S": 0}
    for move in opponent_history:
        if move in move_counts:
            move_counts[move] += 1

    most_common_move = max(move_counts, key=move_counts.get)
    counter_to_common = counter_moves[most_common_move]

    def predict_next_move(history, n):
        if len(history) < n:
            return random.choice(["R", "P", "S"])
        patterns = {}
        for i in range(len(history) - n):
            pattern = tuple(history[i:i + n])
            next_move = history[i + n]
            if pattern not in patterns:
                patterns[pattern] = {"R": 0, "P": 0, "S": 0}
            patterns[pattern][next_move] += 1
        last_pattern = tuple(history[-n:])
        if last_pattern in patterns:
            return max(patterns[last_pattern], key=patterns[last_pattern].get)
        return random.choice(["R", "P", "S"])

    predicted_move = predict_next_move(opponent_history, 5)
    counter_to_predicted = counter_moves[predicted_move]

    return counter_to_predicted

@app.route('/play', methods=['POST'])
def play_round():
    """Handle a game round"""
    global game_state
    
    if game_state['is_paused']:
        return jsonify({
            'error': 'Game is paused',
            'game_state': game_state
        }), 400
    
    data = request.json
    user_choice = data.get('choice')
    
    if user_choice not in ['R', 'P', 'S']:
        return jsonify({'error': 'Invalid choice'}), 400
    
    # Get AI move
    player_move = player_ai(
        game_state['opponent_history'][-1] if game_state['opponent_history'] else "",
        game_state['opponent_history']
    )
    
    # Add user choice to history
    game_state['opponent_history'].append(user_choice)
    
    # Determine result
    if user_choice == player_move:
        result = "tie"
        game_state['tie_score'] += 1
    elif (user_choice == "R" and player_move == "S") or \
         (user_choice == "P" and player_move == "R") or \
         (user_choice == "S" and player_move == "P"):
        result = "win"
        game_state['player_score'] += 1
    else:
        result = "lose"
        game_state['opponent_score'] += 1
    
    # Update game state
    game_state['last_result'] = result
    game_state['last_player_move'] = user_choice
    game_state['last_opponent_move'] = player_move
    
    return jsonify({
        'result': result,
        'player_move': user_choice,
        'opponent_move': player_move,
        'game_state': game_state
    })

@app.route('/pause', methods=['POST'])
def pause_game():
    """Pause the game"""
    global game_state
    game_state['is_paused'] = True
    return jsonify({'message': 'Game paused', 'game_state': game_state})

@app.route('/resume', methods=['POST'])
def resume_game():
    """Resume the game"""
    global game_state
    game_state['is_paused'] = False
    return jsonify({'message': 'Game resumed', 'game_state': game_state})

@app.route('/reset', methods=['POST'])
def reset_game():
    """Reset the game"""
    global game_state
    game_state = {
        'opponent_history': [],
        'player_score': 0,
        'opponent_score': 0,
        'tie_score': 0,
        'is_paused': False,
        'last_result': '',
        'last_player_move': '',
        'last_opponent_move': ''
    }
    return jsonify({'message': 'Game reset', 'game_state': game_state})

@app.route('/status', methods=['GET'])
def get_status():
    """Get current game status"""
    return jsonify({'game_state': game_state})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
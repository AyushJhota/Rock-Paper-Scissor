import tkinter as tk
import random

# Function for the AI player
def player(prev_play, opponent_history=[]):
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

# Function to handle button click
def play_round(user_choice):
    global opponent_history, player_score, opponent_score, tie_score, is_paused

    if is_paused:
        return

    player_move = player(opponent_history[-1] if opponent_history else "", opponent_history)
    opponent_history.append(user_choice)

    result = ""
    if user_choice == player_move:
        result = "It's a tie!"
        tie_score += 1
    elif (user_choice == "R" and player_move == "S") or (user_choice == "P" and player_move == "R") or (user_choice == "S" and player_move == "P"):
        result = "You win!"
        player_score += 1
    else:
        result = "You lose!"
        opponent_score += 1

    result_label.config(text=result)
    update_score_card()

# Function to update score card colors
def update_score_card():
    if player_score < opponent_score:
        player_score_color = "red"
        opponent_score_color = "green"
    elif player_score > opponent_score:
        player_score_color = "green"
        opponent_score_color = "red"
    else: 
        player_score_color = "yellow"
        opponent_score_color = "yellow"

    player_score_label.config(text=f"You: {player_score}", fg=player_score_color)
    opponent_score_label.config(text=f"Bot: {opponent_score}", fg=opponent_score_color)
    score_label.config(text=f"Ties: {tie_score}", fg="orange")

# Functions for control buttons
def pause_game():
    global is_paused
    is_paused = True
    result_label.config(text="Game Paused", fg="red")

def resume_game():
    global is_paused
    is_paused = False
    result_label.config(text="Game Resumed", fg="green")

def stop_game():
    window.destroy()

# Initialize Tkinter window
window = tk.Tk()
window.title("Rock, Paper, Scissors")

# Set window size and position
window.geometry("600x400")
window.update_idletasks()  # Update window size to get correct dimensions
window_width = window.winfo_width()
window_height = window.winfo_height()
screen_width = window.winfo_screenwidth()
screen_height = window.winfo_screenheight()
x = (screen_width // 2) - (window_width // 2)
y = (screen_height // 2) - (window_height // 2)
window.geometry(f'{window_width}x{window_height}+{x}+{y}')

# Color and Font Customization
background_color = "#2E2E2E"  # Dark background color
button_color = "Dark Blue"    # Darker button color
button_text_color = "White"  # Button text color
label_color = "Magenta"      # Label text color
font_type = "Comic Sans MS" # Font type
font_size = 14              # Font size

# Apply styles
window.configure(bg=background_color)

# Create frames for layout
header_frame = tk.Frame(window, bg=background_color)
header_frame.pack(pady=10)

button_frame = tk.Frame(window, bg=background_color)
button_frame.pack(pady=20)

score_frame = tk.Frame(window, bg=background_color)
score_frame.pack(pady=20)

control_frame = tk.Frame(window, bg=background_color)
control_frame.pack(side=tk.BOTTOM, pady=10)

# Create and place the main label
tk.Label(header_frame, text="Rock, Paper, Scissors", font=(font_type, 16), bg=background_color, fg="orange").pack()

# Create buttons
tk.Button(button_frame, text="Rock", command=lambda: play_round("R"), bg=button_color, fg=button_text_color, font=(font_type, font_size)).pack(side=tk.LEFT, padx=10)
tk.Button(button_frame, text="Paper", command=lambda: play_round("P"), bg=button_color, fg=button_text_color, font=(font_type, font_size)).pack(side=tk.LEFT, padx=10)
tk.Button(button_frame, text="Scissors", command=lambda: play_round("S"), bg=button_color, fg=button_text_color, font=(font_type, font_size)).pack(side=tk.LEFT, padx=10)

# Create labels for result and score
result_label = tk.Label(window, text="", font=(font_type, 14), bg=background_color, fg="orange")
result_label.pack(pady=10)

player_score_label = tk.Label(score_frame, text="You: 0", font=(font_type, font_size), bg=background_color, fg="white")
player_score_label.pack(side=tk.LEFT, padx=10)

opponent_score_label = tk.Label(score_frame, text="Bot: 0", font=(font_type, font_size), bg=background_color, fg="white")
opponent_score_label.pack(side=tk.LEFT, padx=10)

score_label = tk.Label(score_frame, text="Ties: 0", font=(font_type, font_size), bg=background_color, fg="orange")
score_label.pack(side=tk.LEFT, padx=10)

# Create control buttons
tk.Button(control_frame, text="Pause", command=pause_game, bg="yellow", fg="black", font=(font_type, font_size)).pack(side=tk.LEFT, padx=10)
tk.Button(control_frame, text="Resume", command=resume_game, bg="green", fg="white", font=(font_type, font_size)).pack(side=tk.LEFT, padx=10)
tk.Button(control_frame, text="Stop", command=stop_game, bg="red", fg="white", font=(font_type, font_size)).pack(side=tk.LEFT, padx=10)

# Initialize scores
opponent_history = []
player_score = 0
opponent_score = 0
tie_score = 0
is_paused = False

# Run the Tkinter event loop
window.mainloop()

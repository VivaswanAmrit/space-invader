import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
// Initialize Supabase client
const supabaseUrl = 'https://iqtzfidmpzleruptseve.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxdHpmaWRtcHpsZXJ1cHRzZXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NDA3NTcsImV4cCI6MjA1NzAxNjc1N30.0PxogDB984qnypk-rfTIVco77AbChHaVsKAKQ0RKJfk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to store user data
async function storeUserData(name, mode, score) {
    // Convert name to uppercase before any database operations
    const upperName = name.toUpperCase();
    
    // First, check if player exists or create them
    let playerId;
    const { data: existingPlayer, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('name', upperName)
        .single();

    if (playerError && playerError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error('Error checking for existing player:', playerError);
        return;
    }

    if (existingPlayer) {
        playerId = existingPlayer.id;
    } else {
        // Create new player with uppercase name
        const { data: newPlayer, error: createError } = await supabase
            .from('players')
            .insert({ name: upperName })
            .select('id')
            .single();

        if (createError) {
            console.error('Error creating player:', createError);
            return;
        }
        playerId = newPlayer.id;
    }

    // Then, insert or update score
    const { data: scoreData, error: scoreError } = await supabase
        .from('scores')
        .upsert({ 
            player_id: playerId, 
            high_score: score,
            mode: mode
        }, { 
            onConflict: ['player_id', 'mode'] 
        });

    if (scoreError) {
        console.error('Error storing score data:', scoreError);
    } else {
        console.log('Score data stored:', scoreData);
    }
}

// Function to update user score
async function updateUserScore(name, mode, score, sessionHighScore) {
    // Convert name to uppercase
    const upperName = name.toUpperCase();
    
    // Update session high score immediately if current score is higher
    const newSessionHighScore = Math.max(score, sessionHighScore);
    
    // First, get the player's ID
    const { data: player, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('name', upperName)
        .single();

    if (playerError) {
        console.error('Error finding player:', playerError);
        return newSessionHighScore;
    }

    // Then, check their current score in the database
    const { data: currentScore, error: scoreCheckError } = await supabase
        .from('scores')
        .select('high_score')
        .eq('player_id', player.id)
        .eq('mode', mode)
        .single();

    // Only update if the new score is higher than what's in the database
    if (!scoreCheckError && currentScore && score <= currentScore.high_score) {
        console.log('Current score is not higher than existing high score in database.');
        return newSessionHighScore;
    }

    // Update the score in the database if it's higher
    const { data, error } = await supabase
        .from('scores')
        .upsert({ 
            player_id: player.id, 
            high_score: score,
            mode: mode
        }, { 
            onConflict: ['player_id', 'mode'] 
        });

    if (error) {
        console.error('Error updating score:', error);
    } else {
        console.log('Score updated in database:', data);
    }
    
    return newSessionHighScore;
}

// Add a new function to load the player's high score from the database
async function loadPlayerHighScore(name, mode) {
    // Convert name to uppercase
    const upperName = name.toUpperCase();
    
    // Get the player's ID
    const { data: player, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('name', upperName)
        .single();

    if (playerError) {
        console.error('Error finding player:', playerError);
        return 0; // Return 0 if player not found
    }

    // Get their score for this mode
    const { data: scoreData, error: scoreError } = await supabase
        .from('scores')
        .select('high_score')
        .eq('player_id', player.id)
        .eq('mode', mode)
        .single();

    if (scoreError) {
        console.log('No existing score found for this player and mode');
        return 0; // Return 0 if no score found
    }

    console.log(`Loaded high score for ${name} in ${mode} mode: ${scoreData.high_score}`);
    return scoreData.high_score;
}

// Add this function to create and display a leaderboard UI with retro style
function createLeaderboardUI(leaderboardData, playerInfo) {
    // Remove any existing leaderboard UI
    const existingLeaderboard = document.getElementById('leaderboard-container');
    if (existingLeaderboard) {
        existingLeaderboard.remove();
    }
    
    // Create container
    const container = document.createElement('div');
    container.id = 'leaderboard-container';
    container.style.position = 'fixed';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.backgroundColor = 'white';  // Changed to white
    container.style.padding = '20px';
    container.style.border = '4px solid black';  // Added solid border for retro feel
    container.style.boxShadow = '10px 10px 0px rgba(0, 0, 0, 0.5)';  // Changed to offset shadow for retro look
    container.style.color = 'black';  // Changed to black text
    container.style.fontFamily = 'monospace, "Courier New", Courier';  // Changed to monospace for retro feel
    container.style.zIndex = '1000';
    container.style.maxHeight = '80vh';
    container.style.overflowY = 'auto';
    container.style.width = '400px';
    container.style.textAlign = 'center';
    
    // Create header
    const header = document.createElement('h2');
    header.textContent = 'LEADERBOARD';  // All caps for retro style
    header.style.color = 'black';  // Changed to black
    header.style.borderBottom = '3px double black';  // Double border for retro style
    header.style.paddingBottom = '10px';
    header.style.marginBottom = '20px';
    header.style.fontWeight = 'bold';
    container.appendChild(header);
    
    // Create player rank display if available
    if (playerInfo) {
        const rankDisplay = document.createElement('div');
        rankDisplay.style.backgroundColor = 'black';  // Changed to black
        rankDisplay.style.color = 'white';  // White text on black for contrast
        rankDisplay.style.padding = '10px';
        rankDisplay.style.margin = '0 auto 20px auto';
        rankDisplay.style.width = '80%';
        rankDisplay.style.fontWeight = 'bold';
        rankDisplay.style.letterSpacing = '1px';  // Added letter spacing for retro look
        rankDisplay.textContent = `YOUR RANK: ${playerInfo.rank}`;  // All caps for retro style
        container.appendChild(rankDisplay);
    }
    
    // Create table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.border = '2px solid black';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = 'black';
    
    const headers = ['RANK', 'PLAYER', 'MODE', 'SCORE'];
    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.style.padding = '8px';
        th.style.color = 'white';
        th.style.fontWeight = 'bold';
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');

    // If we have player info, find and show their entry at the top
    if (playerInfo && leaderboardData.length > 0) {
        // Find the player's entry by matching player_id
        const playerEntry = leaderboardData.find(entry => entry.player_id === playerInfo.playerId);
        
        if (playerEntry) {
            // Create player's row at the top
            const playerRow = document.createElement('tr');
            playerRow.style.backgroundColor = '#ffeb3b';
            playerRow.style.fontWeight = 'bold';
            playerRow.style.borderBottom = '2px solid black';
            
            // Add cells for player's row
            const rankCell = document.createElement('td');
            rankCell.textContent = playerInfo.rank;
            rankCell.style.padding = '8px';
            rankCell.style.textAlign = 'center';
            playerRow.appendChild(rankCell);
            
            const nameCell = document.createElement('td');
            nameCell.textContent = playerEntry.actualName;
            nameCell.style.padding = '8px';
            playerRow.appendChild(nameCell);
            
            const modeCell = document.createElement('td');
            modeCell.textContent = playerEntry.mode.toUpperCase();
            modeCell.style.padding = '8px';
            modeCell.style.textAlign = 'center';
            playerRow.appendChild(modeCell);
            
            const scoreCell = document.createElement('td');
            scoreCell.textContent = playerEntry.high_score;
            scoreCell.style.padding = '8px';
            scoreCell.style.textAlign = 'right';
            scoreCell.style.fontFamily = 'monospace';
            scoreCell.style.fontWeight = 'bold';
            playerRow.appendChild(scoreCell);
            
            tbody.appendChild(playerRow);

            // Add separator
            const separatorRow = document.createElement('tr');
            const separatorCell = document.createElement('td');
            separatorCell.colSpan = 4;
            separatorCell.style.padding = '4px';
            separatorCell.style.backgroundColor = '#ddd';
            separatorCell.textContent = '--- FULL LEADERBOARD ---';
            separatorCell.style.fontWeight = 'bold';
            separatorRow.appendChild(separatorCell);
            tbody.appendChild(separatorRow);
        }
    }

    // Add all leaderboard entries
    leaderboardData.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        // Zebra striping for rows
        if (index % 2 === 0) {
            row.style.backgroundColor = '#f0f0f0';
        }
        
        // Highlight the current player's row in the full leaderboard
        if (playerInfo && entry.player_id === playerInfo.playerId) {
            row.style.backgroundColor = '#ffeb3b';
            row.style.fontWeight = 'bold';
        }
        
        // Add cells for rank, name, mode, and score
        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1;
        rankCell.style.padding = '8px';
        rankCell.style.borderBottom = '1px solid black';
        rankCell.style.textAlign = 'center';
        row.appendChild(rankCell);
        
        const nameCell = document.createElement('td');
        nameCell.textContent = entry.playerName;
        nameCell.style.padding = '8px';
        nameCell.style.borderBottom = '1px solid black';
        row.appendChild(nameCell);
        
        const modeCell = document.createElement('td');
        modeCell.textContent = entry.mode.toUpperCase();
        modeCell.style.padding = '8px';
        modeCell.style.borderBottom = '1px solid black';
        modeCell.style.textAlign = 'center';
        row.appendChild(modeCell);
        
        const scoreCell = document.createElement('td');
        scoreCell.textContent = entry.high_score;
        scoreCell.style.padding = '8px';
        scoreCell.style.borderBottom = '1px solid black';
        scoreCell.style.textAlign = 'right';
        scoreCell.style.fontFamily = 'monospace';
        scoreCell.style.fontWeight = 'bold';
        row.appendChild(scoreCell);
        
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'CLOSE';  // All caps for retro style
    closeButton.style.padding = '10px 20px';
    closeButton.style.marginTop = '20px';
    closeButton.style.backgroundColor = 'black';
    closeButton.style.color = 'white';
    closeButton.style.border = '2px solid black';
    closeButton.style.fontFamily = 'monospace, "Courier New", Courier';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.cursor = 'pointer';
    closeButton.style.letterSpacing = '2px';  // Added letter spacing for retro look
    
    // Add hover effect
    closeButton.onmouseover = () => {
        closeButton.style.backgroundColor = 'white';
        closeButton.style.color = 'black';
    };
    closeButton.onmouseout = () => {
        closeButton.style.backgroundColor = 'black';
        closeButton.style.color = 'white';
    };
    
    closeButton.onclick = () => container.remove();
    container.appendChild(closeButton);
    
    // Add to document
    document.body.appendChild(container);
}

// Modify the displayLeaderboard function to show PLAYER_ID instead of names
async function displayLeaderboard(mode = null) {
    let query = supabase
        .from('scores')
        .select('*, players(name)')  // Include the player's name in the query
        .order('high_score', { ascending: false });
        
    if (mode) {
        query = query.eq('mode', mode);
    }
    
    const { data, error } = await query;

    if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    } else {
        const leaderboardData = [];
        
        if (data && data.length > 0) {
            for (let i = 0; i < data.length; i++) {
                const entry = data[i];
                leaderboardData.push({
                    playerName: `PLAYER_${entry.player_id}`, // Anonymous display name
                    actualName: entry.players.name, // Store actual name for personal display
                    mode: entry.mode,
                    high_score: entry.high_score,
                    player_id: entry.player_id
                });
            }
        }
        
        return leaderboardData;
    }
}

// Modify the displayPlayerRank function to return the rank
async function displayPlayerRank(name, mode) {
    // Convert name to uppercase to match stored format
    const upperName = name.toUpperCase();
    
    // First get the player ID
    const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('name', upperName)
        .single();
        
    if (playerError) {
        console.error('Error finding player:', playerError);
        return null;
    }
    
    if (!playerData) {
        console.log(`Player ${upperName} not found.`);
        return null;
    }
    
    // Get all scores for this mode
    const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('mode', mode)
        .order('high_score', { ascending: false });

    if (error) {
        console.error('Error fetching scores:', error);
        return null;
    }
    
    // Find player's position in the sorted scores
    const rank = data.findIndex(entry => entry.player_id === playerData.id) + 1;
    
    if (rank > 0) {
        console.log(`Player ${upperName} is ranked ${rank} in ${mode} mode.`);
        return { rank, playerId: playerData.id };  // Return both rank and playerId
    } else {
        console.log(`Player ${upperName} not found in rankings for ${mode} mode.`);
        return null;
    }
}

// Update the showLeaderboardUI function to pass the mode
async function showLeaderboardUI(playerName, mode) {
    // Get leaderboard data filtered by mode
    const leaderboardData = await displayLeaderboard(mode);
    
    // Get player rank and id if a name is provided
    let playerInfo = null;
    if (playerName && mode) {
        playerInfo = await displayPlayerRank(playerName.toUpperCase(), mode);
    }
    
    // Create and show the UI
    createLeaderboardUI(leaderboardData, playerInfo);
    
    // Add mode to the leaderboard title
    if (mode) {
        const header = document.querySelector('#leaderboard-container h2');
        if (header) {
            header.textContent = `${mode.toUpperCase()} MODE LEADERBOARD`;
        }
    }
}

// Update the leaderboard button event listener to use the new UI
// Event listener for leaderboard button (if this element exists in your HTML)
const leaderboardButton = document.querySelector('#leaderboardButton');
if (leaderboardButton) {
    leaderboardButton.addEventListener('click', async () => {
        const playerName = document.querySelector('input[type="text"]').value;
        const gameMode = 'standard'; // Replace with actual game mode
        await showLeaderboardUI(playerName, gameMode);
    });
}

// Test connection with correct table names
async function testConnection() {
    console.log("Testing basic database connection...");
    
    // Test players table
    const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .limit(3);
    
    console.log("Players table test:", players, playersError);
    
    // Test scores table (changed from score to scores)
    const { data: scores, error: scoresError } = await supabase
        .from('scores')
        .select('*')
        .limit(3);
    
    console.log("Scores table test:", scores, scoresError);
}

// Call the test function to check your connection
testConnection();

// Export the new function
export { storeUserData, updateUserScore, displayLeaderboard, displayPlayerRank, showLeaderboardUI, loadPlayerHighScore };

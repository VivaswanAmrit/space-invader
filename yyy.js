const scoreEt = document.querySelector ('#scoreEt');
const canvas = document.querySelector ('canvas');
const c = canvas.getContext('2d');
const startScreen = document.createElement('div'); // Create start screen element

canvas.width = innerWidth;
canvas.height = innerHeight;


// Start screen styles
startScreen.style.position = 'fixed';
startScreen.style.top = '0';
startScreen.style.left = '0';
startScreen.style.width = '100%';
startScreen.style.height = '100%';
startScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
startScreen.style.display = 'flex';
startScreen.style.justifyContent = 'center';
startScreen.style.alignItems = 'center';
startScreen.style.zIndex = '10';
startScreen.style.flexDirection = 'column';
startScreen.style.gap = '30px';

// Add these lines to append startScreen to document and set initial canvas state
document.body.appendChild(startScreen);
canvas.style.display = 'none';

let game = {
    over: false,
    active: false,
};

// Create instructions element
const instructions = document.createElement('div');
instructions.style.color = 'white';
instructions.style.fontSize = '24px';
instructions.style.fontFamily = 'sans-serif';
instructions.style.textAlign = 'center';
instructions.innerHTML = `
    <h2 style="margin-bottom: 20px;">Controls</h2>
    <p>A - Move Left</p>
    <p>D - Move Right</p>
    <p>SPACE - Shoot</p>
`;

// Create button container for horizontal layout
const buttonContainer = document.createElement('div');
buttonContainer.style.display = 'flex';
buttonContainer.style.gap = '20px';
buttonContainer.style.justifyContent = 'center';

// Add an animation ID variable at the top with other game settings
let animationId = null;

// Add a global variable to store a pending end-screen timeout ID
let endScreenTimeoutId = null;

// Create input element for user name
const nameInput = document.createElement('input');
nameInput.type = 'text';
nameInput.placeholder = 'Enter your name';
nameInput.style.padding = '10px';
nameInput.style.fontSize = '18px';
nameInput.style.border = '2px solid #007bff';
nameInput.style.borderRadius = '5px';
nameInput.style.marginBottom = '20px';

// Add name input to the start screen
startScreen.appendChild(nameInput);

// Modify the createDifficultyButton function
const createDifficultyButton = (text, difficulty) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.padding = '15px 30px';
    button.style.fontSize = '20px';
    button.style.color = 'black';
    button.style.backgroundColor = 'white';
    button.style.border = '2px solid #007bff';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.fontFamily = 'sans-serif';
    button.style.transition = 'all 0.3s ease';
    
    // Hover effects
    button.onmouseover = () => {
        button.style.backgroundColor = '#007bff';
        button.style.color = 'white';
    };
    button.onmouseout = () => {
        button.style.backgroundColor = 'white';
        button.style.color = 'black';
    };
    
    button.addEventListener('click', () => {
        if (nameInput.value.trim() === '') {
            alert('Please enter your name before starting the game.');
            return;
        }
        startGame(difficulty);
    });
    return button;
};

const chillButton = createDifficultyButton('Chill Mode', 'chill');
const standardButton = createDifficultyButton('Standard Mode', 'standard');
const ludicrousButton = createDifficultyButton('Ludicrous Mode', 'ludicrous');

// Clear existing content and add new elements in order
startScreen.innerHTML = '';
startScreen.appendChild(instructions);

// Add name input to the start screen
startScreen.appendChild(nameInput);

startScreen.appendChild(buttonContainer);

// Add buttons to the horizontal container instead of directly to startScreen
buttonContainer.appendChild(chillButton);
buttonContainer.appendChild(standardButton);
buttonContainer.appendChild(ludicrousButton);

// Add game settings object
let gameSettings = {
    mode: 'standard',
    alienSpeed: 3,
    shootersCount: 3,
    alienSpawnInterval: 200,
    continuousShooting: false
};

// Add these variables near the top with other game settings
let lastShotTime = 0;
const SHOT_COOLDOWN = 50; // 100ms between shots for faster firing rate
let sessionHighScore = 0;

// Import necessary functions from leaderboard.js
import { storeUserData, updateUserScore, displayLeaderboard, displayPlayerRank, showLeaderboardUI, loadPlayerHighScore } from './leaderboard.js';

// Modify the start game function
function startGame(difficulty) {
    // Cancel any existing animation frame
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    const playerName = nameInput.value.trim();
    if (!playerName) {
        alert('Please enter your name before starting the game.');
        return;
    }
    
    // Set difficulty settings
    switch(difficulty) {
        case 'chill':
            gameSettings = {
                mode: 'chill',
                alienSpeed: 2,
                shootersCount: 1,
                alienSpawnInterval: 300,
                continuousShooting: true
            };
            break;
        case 'standard':
            gameSettings = {
                mode: 'standard',
                alienSpeed: 3,
                shootersCount: 3,
                alienSpawnInterval: 200,
                continuousShooting: false
            };
            break;
        case 'ludicrous':
            gameSettings = {
                mode: 'ludicrous',
                alienSpeed: 5,
                shootersCount: 4,
                alienSpawnInterval: 150,
                continuousShooting: false
            };
            break;
    }
    
    // Load the player's high score from the database before starting the game
    loadPlayerHighScore(playerName, difficulty).then(highScore => {
        // Set the sessionHighScore to the loaded value from database
        sessionHighScore = highScore;
        console.log(`Loaded previous high score from database: ${sessionHighScore}`);
        
        // Store user data to ensure the player exists in the database
        storeUserData(playerName, difficulty, sessionHighScore);
        
        // Start the game
        startScreen.style.display = 'none';
        canvas.style.display = 'block';
        game.active = true;
        frames = 0;  // Reset frames counter
        animate();
    });
}

game.active= false;
class Player{
    constructor(){
        

        this.velocity = {
            x: 0,
            y:0
        }

        this.rotation = 0;
        this.opacity = 1;
        this.canShoot = true; 

         const image = new Image();
         image.src='./img/mothership.png';
         image.onload = () => {
            const scale = 0.15;
            this.image =  image;
            this.width= image.width*scale;
            this.height = image.height*scale;
            this.position = {
                x: canvas.width/2 - this.width/2,
                y: canvas.height-this.height-20
            };
         };
        
    }

    draw(){
        //  c.fillStyle= 'red'
        //  c.fillRect (this.position.x,this.position.y,this.width,this.height)
        c.save();
        c.globalAlpha = this.opacity
        c.translate(
            player.position.x + player.width/2,
            player.position.y + player.height/2
        );

        c.rotate(this.rotation)

        c.translate(
            -player.position.x - player.width/2,
            -player.position.y - player.height/2
        );

        if(this.image && this.position)
        c.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.width,
        this.height
    );
    c.restore();
    }
    update(){
        if(this.position){
        this.draw();
        this.position.x +=this.velocity.x;
        }
        
    }
}

class Projectile{
    constructor({position,velocity}){
        this.position = position;
        this.velocity = velocity;

        this.radius = 3;
    }

    draw(){
        c.beginPath()
        c.arc(this.position.x,this.position.y,this.radius,0, Math.PI * 2)
        c.fillStyle = 'red';
        c.fill()
        c.closePath()
    }

    update(){
        this.draw()
        this.position.x+=this.velocity.x;
        this.position.y+=this.velocity.y;
    }
}
class Particle{
    constructor({position,velocity,radius,color,fades}){
        this.position = position;
        this.velocity = velocity;

        this.radius = radius;
        this.color = color;
        this.opacity = 1;
        this.fades = fades
    }

    draw(){
        c.save()
        c.globalAlpha = this.opacity;
        c.beginPath()
        c.arc(this.position.x,this.position.y,this.radius,0, Math.PI * 2)
        c.fillStyle = this.color;
        c.fill()
        c.closePath()
        c.restore()
    }

    update(){
        this.draw()
        this.position.x+=this.velocity.x;
        this.position.y+=this.velocity.y;
        if(this.fades)
        this.opacity -=0.01
    }
}

class Invader{
    constructor({position}){
        this.velocity = {
            x: 0,
            y:0
        }
         const image = new Image();
         image.src='./img/alien.png';
         image.onload = () => {
            const scale = 0.20;
            this.image =  image;
            this.width= image.width*scale;
            this.height = image.height*scale;
            this.position = {
                x: position.x,
                y: position.y
            };
         }; 
    }
    draw(){
        //  c.fillStyle= 'red'
        //  c.fillRect (this.position.x,this.position.y,this.width,this.height)
        if(this.image && this.position)
        c.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.width,
        this.height
    );

    }
    update({velocity}){
        if(this.position){
        this.draw();
        this.position.x +=velocity.x;
        this.position.y +=velocity.y;
        }
        
    }

    shoot(invaderProjectiles){
        invaderProjectiles.push(new InvaderProjectile({
            position:{
                x: this.position.x,
                y:this.position.y+this.height
            },
            velocity:{
                x:0,
                y:5
            }
        }));

        invaderProjectiles.push(new InvaderProjectile({
            position:{
                x: this.position.x+this.width,
                y:this.position.y+this.height
            },
            velocity:{
                x:0,
                y:5
            }
        }));

    }
}

class Grid{
    constructor(){
        this.position = {
            x:0,
            y:0
        }

        this.velocity = {
            x: gameSettings.alienSpeed,
            y: 0
        }
        this.invaders=[]

         const columns = Math.floor(Math.random()*5+7)
         const rows = Math.floor(Math.random()*2+3)

         this.width = columns * 25

        for(let i = 0; i<columns; i++){
            for(let j = 0; j<rows; j++){

         this.invaders.push(new Invader({position:{
            x:i*25,
            y:j*55
         }}))}
        }
        
    }

    update(){
       this.position.x += this.velocity.x,
       this.position.y += this.velocity.y

        this.velocity.y =0
       if(this.position.x+this.width>=canvas.width || this.position.x<=0){
        this.velocity.x = -this.velocity.x
        this.velocity.y = 45
       }
    }
}

class InvaderProjectile{
    constructor({position,velocity}){
        this.position = position;
        this.velocity = velocity;

        this.width = 3;
        this.height = 10;
    }

    draw(){
        c.fillStyle = 'white';
        c.fillRect(this.position.x,this.position.y,this.width,this.height)
    }

    update(){
        this.draw()
        this.position.x+=this.velocity.x;
        this.position.y+=this.velocity.y;
    }
}

const player = new Player();
const projectiles = []
const grids = []
const invaderProjectiles = []
const particles = []
const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    space: {
        pressed: false
    }
}

let frames =0
let intervalrnd = Math.floor((Math.random()*200) + 200);


let score = 0
for(let i = 0; i<100; i++){
    particles.push(new Particle({
       position:{
           x:Math.random() * canvas.width,
           y:Math.random() * canvas.height
       },
       velocity:{
           x:0,
           y:0.3
       },
       radius:Math.random()*2,
       color:'white'
    }))
   }

function createParticles({object,color,fades}){
    for(let i = 0; i<95; i++){
        particles.push(new Particle({
           position:{
               x:object.position.x + object.width/2,
               y:object.position.y + object.height/2
           },
           velocity:{
               x:(Math.random() - 0.5)*2,
               y:(Math.random() - 0.5)*2
           },
           radius:Math.random()*3,
           color:color || 'magenta',
           fades:fades
        }))
       }   
}
function animate(){
    if(!game.active) {
        cancelAnimationFrame(animationId);
        return;
    }
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'black';
    c.fillRect(0,0,canvas.width, canvas.height);
    player.update();
    particles.forEach((particle,i) =>{
        if(particle.position.y-particle.radius>=canvas.height){
            particle.position.x = Math.random()*canvas.width
            particle.position.y = particle.radius
        }
        if (particle.opacity<=0){
            setTimeout(()=>{
                particles.splice(i,1)
            },0)
          
        }
        else{particle.update()}
        
    })
    invaderProjectiles.forEach((invaderProjectile,index) =>{
        if(invaderProjectile.position.y+10>=canvas.height){
            setTimeout(()=>{
                invaderProjectiles.splice(index, 1)
            
            },0)
        }
        else{
        invaderProjectile.update()
        }

        if(invaderProjectile.position.y + 10 >= player.position.y && 
           invaderProjectile.position.x + invaderProjectile.width >= player.position.x && 
           invaderProjectile.position.x <= player.position.x + player.width) {
            
            // Immediately set game as inactive to stop updates
            game.active = false;
            game.over = true;

            // Calculate the new session high score
            sessionHighScore = Math.max(sessionHighScore, score);
            
            // Update the database if the current score is higher than previous high score
            const playerName = nameInput.value.trim();
            if (playerName) {
                updateUserScore(playerName, gameSettings.mode, score, sessionHighScore);
            }
            
            // Show end screen after a short delay and store its timeout ID
            endScreenTimeoutId = setTimeout(() => {
                invaderProjectiles.splice(index, 1);
                player.opacity = 0;
                
                // Create particles
                createParticles({
                    object: player,
                    color: 'cyan',
                    fades: true
                });
                
                // Show end screen after a short delay
                setTimeout(() => {
                    document.body.appendChild(createEndScreen());
                }, 500);
            }, 0);
        }
    })
    projectiles.forEach((projectile, index) => {
        if(projectile.position.y+projectile.radius<=0){
            setTimeout(()=>{
                projectiles.splice(index,1)
            },0)
            
        }
        else{
            projectile.update()
        }
        
    })

    grids.forEach((grid,gridIndex) => {
        grid.update()
        
        if (frames % 70 === 0 && grid.invaders.length > 0) {
            const numShooters = Math.min(gameSettings.shootersCount, grid.invaders.length);
            const shooters = [];

            while (shooters.length < numShooters) {
                const randomIndex = Math.floor(Math.random() * grid.invaders.length);
                if (!shooters.includes(randomIndex)) {
                    shooters.push(randomIndex);
                }
            }

            shooters.forEach((index) => {
                grid.invaders[index].shoot(invaderProjectiles);
            });
        }
        grid.invaders.forEach((invader,i)=>{
            invader.update({velocity:grid.velocity})

            projectiles.forEach((projectile,j)=>{
                if(
                    projectile.position.y-projectile.radius<=invader.position.y+invader.height && projectile.position.x+projectile.radius>=invader.position.x&&projectile.position.x-projectile.radius<= invader.position.x + invader.width  && projectile.position.y+projectile.radius>=invader.position.y)
                      {
                    setTimeout(()=>{
                        const invaderFound = grid.invaders.find((invader2) => invader2 === invader
                        )

                        const projectileFound = projectiles.find((projectile2) => projectile2 === projectile
                        )

                        if(invaderFound&&projectileFound){
                            score+=10
                            scoreEt.innerHTML = score
                            createParticles({
                                object:invader,
                                fades : true
                            })
                            grid.invaders.splice(i,1)
                            projectiles.splice(j,1)

                            if(grid.invaders.length>0){
                                const firstInvader = grid.invaders[0]
                                const lastInvader = grid.invaders[grid.invaders.length-1]

                                grid.width = lastInvader.position.x-firstInvader.position.x +25
                            }else{
                                grids.splice(gridIndex,1)
                            }
                        }
                    },0)
                
         } })
        })
    })

    if(keys.a.pressed && player.position.x>=0){
        player.velocity.x=-5;
        player.rotation = -0.15;

    }
    else if (keys.d.pressed && player.position.x + player.width <= canvas.width){
        player.velocity.x = 5;
        player.rotation = 0.15;
    }
    else{
        player.velocity.x = 0;
        player.rotation = 0;
    }

    if(frames % Math.floor(gameSettings.alienSpawnInterval) === 0){
        grids.push(new Grid())
        intervalrnd = Math.floor((Math.random() * gameSettings.alienSpawnInterval) + gameSettings.alienSpawnInterval);
        frames = 0
    }

    if(gameSettings.continuousShooting && keys.space.pressed && player.canShoot) {
        const currentTime = Date.now();
        if (currentTime - lastShotTime >= SHOT_COOLDOWN) {
            projectiles.push(
                new Projectile({
                    position:{
                        x:player.position.x+player.width/2,
                        y:player.position.y
                    },
                    velocity:{
                        x:0,
                        y:-10
                    }
                })
            )
            lastShotTime = currentTime;
        }
    }

    frames++

}
animate()

addEventListener('keydown',({key})=>{
    if(game.over) return
    switch (key){
        case 'a':
            keys.a.pressed = true
            break;
        case 'd':
            keys.d.pressed = true
            break;      
        case ' ':
            keys.space.pressed = true;
            const currentTime = Date.now();
            if((gameSettings.continuousShooting || player.canShoot) && 
               currentTime - lastShotTime >= SHOT_COOLDOWN) {
                projectiles.push(
                    new Projectile({
                        position:{
                            x:player.position.x+player.width/2,
                            y:player.position.y
                        },
                        velocity:{
                            x:0,
                            y:-10
                        }
                    })
                )
                lastShotTime = currentTime;
                if(!gameSettings.continuousShooting) {
                    player.canShoot = false;
                }
            }
            break;
    }
});

addEventListener('keyup',({key})=>{
    switch (key){
        case 'a':
            keys.a.pressed = false
            break;
        case 'd':
            keys.d.pressed = false
            break;      
        case ' ':
            keys.space.pressed = false;
            if(!gameSettings.continuousShooting) {
                player.canShoot = true;
            }
            break;
    }
});

// Add end screen creation function
function createEndScreen() {
    const endScreen = document.createElement('div');
    
    // End screen styles
    endScreen.style.position = 'fixed';
    endScreen.style.top = '0';
    endScreen.style.left = '0';
    endScreen.style.width = '100%';
    endScreen.style.height = '100%';
    endScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    endScreen.style.display = 'flex';
    endScreen.style.flexDirection = 'column';
    endScreen.style.justifyContent = 'center';
    endScreen.style.alignItems = 'center';
    endScreen.style.gap = '20px';
    endScreen.style.zIndex = '10';

    // Score display
    const scoreDisplay = document.createElement('div');
    scoreDisplay.style.color = 'white';
    scoreDisplay.style.fontSize = '24px';
    scoreDisplay.style.fontFamily = 'sans-serif';
    scoreDisplay.style.textAlign = 'center';
    scoreDisplay.innerHTML = `
        <h2 style="color: #ff4444; font-size: 32px; margin-bottom: 20px;">Game Over</h2>
        <p>Current Score: ${score}</p>
        <p>High Score: ${sessionHighScore}</p>
    `;

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '20px';
    buttonContainer.style.marginTop = '20px';

    // Create buttons with same style as difficulty buttons
    const createEndButton = (text, onClick) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.padding = '15px 30px';
        button.style.fontSize = '20px';
        button.style.color = 'black';
        button.style.backgroundColor = 'white';
        button.style.border = '2px solid #007bff';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.fontFamily = 'sans-serif';
        button.style.transition = 'all 0.3s ease';
        
        button.onmouseover = () => {
            button.style.backgroundColor = '#007bff';
            button.style.color = 'white';
        };
        button.onmouseout = () => {
            button.style.backgroundColor = 'white';
            button.style.color = 'black';
        };
        
        button.addEventListener('click', onClick);
        return button;
    };

    // Restart button
    const restartButton = createEndButton('Restart Game', () => {
        // Store current game settings
        const currentSettings = {...gameSettings};
        
        // Reset everything
        resetGame();
        
        // Restore game settings
        gameSettings = currentSettings;
        
        // Remove end screen and start game
        if (document.body.contains(endScreen)) {
            document.body.removeChild(endScreen);
        }
        
        // Show canvas and start new game
        canvas.style.display = 'block';
        game.active = true;
        animate();
    });

    // Main Menu button
    const menuButton = createEndButton('Main Menu', () => {
        // Cancel any pending end-screen timeout
        if (endScreenTimeoutId) {
            clearTimeout(endScreenTimeoutId);
            endScreenTimeoutId = null;
        }
        // Refresh the page to return to the initial start screen and clear all backend state
        location.reload();
    });

    // Create leaderboard button
    const leaderboardButton = createEndButton('Leaderboard', async () => {
        const playerName = nameInput.value.trim();
        const mode = gameSettings.mode;
        if (playerName && mode) {
            await showLeaderboardUI(playerName, mode);
        } else {
            await showLeaderboardUI(null, null); // Show all scores if no player/mode
        }
    });

    buttonContainer.appendChild(restartButton);
    buttonContainer.appendChild(menuButton);
    buttonContainer.appendChild(leaderboardButton);
    endScreen.appendChild(scoreDisplay);
    endScreen.appendChild(buttonContainer);

    return endScreen;
}

// Modify the resetGame function
function resetGame() {
    // Cancel any existing animation frame
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Update session high score
    sessionHighScore = Math.max(sessionHighScore, score);
    
    // Update user score in the database and get new session high score
    const playerName = nameInput.value.trim();
    if (playerName) {
        updateUserScore(playerName, gameSettings.mode, score, sessionHighScore);
    }
    
    // Reset game state
    score = 0;
    scoreEt.innerHTML = score;
    game.over = false;
    game.active = false;
    frames = 0;  // Reset frames counter
    
    // Reset player
    player.opacity = 1;
    player.position.x = canvas.width/2 - player.width/2;
    player.position.y = canvas.height - player.height - 20;
    
    // Clear arrays
    projectiles.length = 0;
    grids.length = 0;
    invaderProjectiles.length = 0;
    
    // Reset particles (keep background stars)
    particles.length = 0;
    for(let i = 0; i<100; i++){
        particles.push(new Particle({
            position:{
                x:Math.random() * canvas.width,
                y:Math.random() * canvas.height
            },
            velocity:{
                x:0,
                y:0.3
            },
            radius:Math.random()*2,
            color:'white'
        }));
    }

    // Reset all key states
    keys.a.pressed = false;
    keys.d.pressed = false;
    keys.space.pressed = false;
}

// Modify the showStartScreen function
function showStartScreen() {
    // Cancel any existing animation
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Reset game state
    resetGame();
    
    // Reset game settings to default
    gameSettings = {
        mode: 'standard',
        alienSpeed: 3,
        shootersCount: 3,
        alienSpawnInterval: 200,
        continuousShooting: false
    };
    
    // Update display
    canvas.style.display = 'none';
    startScreen.style.display = 'flex';
}
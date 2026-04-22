document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('footballCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let state = 'playing';
    let stateTimer = 0;
    
    // Ball State
    const ball = { x: 0, y: 0, vx: 0, vy: 0, radius: 5, owner: null };
    
    const brazil = [];
    const portugal = [];
    const audience = [];
    const confetti = [];
    
    // Realistic 4-3-3 Formation Base Positions (X is percentage of pitch, Y is percentage)
    // LB/RB pushed up slightly compared to CBs, Midfielders staggered, Wingers wide
    const formation = [
        { x: 0.05, y: 0.50 }, // GK
        { x: 0.22, y: 0.15 }, { x: 0.15, y: 0.35 }, { x: 0.15, y: 0.65 }, { x: 0.22, y: 0.85 }, // DEF (LB, CB, CB, RB)
        { x: 0.35, y: 0.50 }, { x: 0.45, y: 0.25 }, { x: 0.45, y: 0.75 }, // MID (CDM, CM, CM)
        { x: 0.70, y: 0.15 }, { x: 0.75, y: 0.50 }, { x: 0.70, y: 0.85 }  // ATT (LW, ST, RW)
    ];

    class Player {
        constructor(team, id, isLeftToRight, color, shortsColor) {
            this.team = team;
            this.id = id;
            this.isLeftToRight = isLeftToRight;
            this.color = color;
            this.shortsColor = shortsColor;
            
            let formPos = formation[id];
            this.baseX = isLeftToRight ? formPos.x : 1 - formPos.x;
            this.baseY = formPos.y;
            
            this.x = 0;
            this.y = 0;
            this.vx = 0;
            this.vy = 0;
            
            this.speed = 1.8 + Math.random() * 0.5; // Slightly faster for realism
            this.runTimer = 0;
            this.theta = 0;
            this.action = 'home';
            this.passCooldown = 0;
        }

        update() {
            if (this.passCooldown > 0) this.passCooldown--;

            let targetX = this.x;
            let targetY = this.y;

            if (this.action === 'home') {
                let shiftX = (ball.x / width - 0.5) * 0.4 * width; 
                let shiftY = (ball.y / height - 0.5) * 0.3 * height; // Shift Y based on ball too
                
                if (this.id === 0) { shiftX = 0; shiftY = 0; } // GK stays near goal
                
                targetX = this.baseX * width + (this.isLeftToRight ? shiftX : shiftX);
                targetY = this.baseY * height + shiftY;
            } else if (this.action === 'chase') {
                targetX = ball.x;
                targetY = ball.y;
            } else if (this.action === 'dribble') {
                targetX = this.isLeftToRight ? width - 40 : 40;
                targetY = height / 2;
                
                ball.x = this.x + Math.cos(this.theta) * 10;
                ball.y = this.y + Math.sin(this.theta) * 10;
                ball.vx = 0;
                ball.vy = 0;

                let distToGoal = Math.abs(targetX - this.x);
                if (distToGoal < 180 && Math.abs(targetY - this.y) < 150) {
                    ball.owner = null;
                    ball.vx = (targetX - ball.x) * 0.05 + (Math.random()-0.5)*2; // Less accurate shot
                    ball.vy = ((targetY + (Math.random()-0.5)*50) - ball.y) * 0.05;
                    this.action = 'home';
                    this.passCooldown = 60;
                } else if (this.passCooldown === 0) {
                    let teammates = this.team === 'brazil' ? brazil : portugal;
                    let bestMate = null;
                    let bestScore = -999;
                    
                    teammates.forEach(m => {
                        if (m !== this) {
                            let forwardProgress = this.isLeftToRight ? (m.x - this.x) : (this.x - m.x);
                            if (forwardProgress > 20 && forwardProgress < 400) {
                                if (Math.random() > 0.4) { // Increased pass frequency
                                    if (forwardProgress > bestScore) {
                                        bestScore = forwardProgress;
                                        bestMate = m;
                                    }
                                }
                            }
                        }
                    });

                    if (bestMate) {
                        ball.owner = null;
                        let pdx = bestMate.x - this.x;
                        let pdy = bestMate.y - this.y;
                        let dist = Math.sqrt(pdx*pdx + pdy*pdy);
                        ball.vx = (pdx / dist) * 7;
                        ball.vy = (pdy / dist) * 7;
                        this.action = 'home';
                        this.passCooldown = 40;
                        bestMate.action = 'chase';
                    }
                }
            }

            let dx = targetX - this.x;
            let dy = targetY - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 3) {
                this.vx = (dx / dist) * this.speed;
                this.vy = (dy / dist) * this.speed;
                this.theta = Math.atan2(this.vy, this.vx);
            } else {
                this.vx = 0;
                this.vy = 0;
            }

            // Soft collision
            let allPlayers = brazil.concat(portugal);
            allPlayers.forEach(p => {
                if (p !== this) {
                    let cdx = this.x - p.x;
                    let cdy = this.y - p.y;
                    let cdist = Math.sqrt(cdx*cdx + cdy*cdy);
                    if (cdist < 15 && cdist > 0) {
                        this.x += (cdx / cdist) * 1.5;
                        this.y += (cdy / cdist) * 1.5;
                    }
                }
            });

            this.x += this.vx;
            this.y += this.vy;
            
            // Boundary constraints (Keep out of stands)
            const standHeight = 60;
            if (this.x < 10) this.x = 10;
            if (this.x > width-10) this.x = width-10;
            if (this.y < standHeight) this.y = standHeight;
            if (this.y > height-standHeight) this.y = height-standHeight;

            if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
                this.runTimer += Math.sqrt(this.vx*this.vx + this.vy*this.vy);
            } else {
                this.runTimer = 0;
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            let isFacingLeft = Math.cos(this.theta || 0) < 0;
            if (isFacingLeft) ctx.scale(-1, 1);

            let swing = Math.sin(this.runTimer * 0.4); 
            if (state === 'goal' && stateTimer > 0) swing = 0;
            
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            let skin = '#F1C27D';

            // Realistic drawing with joints (simplified IK)
            let kneeBend = Math.abs(swing) * 3;
            let elbowBend = Math.abs(swing) * 2;

            // Back Arm
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = skin; 
            ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-swing * 4, 1); ctx.lineTo(-swing * 6 - elbowBend, 4); ctx.stroke();
            ctx.strokeStyle = this.color; 
            ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-swing * 3, -1); ctx.stroke();

            // Back Leg
            ctx.lineWidth = 3;
            ctx.strokeStyle = skin; 
            ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(swing * 5, 10 - kneeBend); ctx.lineTo(swing * 8, 14); ctx.stroke();
            ctx.strokeStyle = this.shortsColor; 
            ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(swing * 3, 8); ctx.stroke();

            // Torso
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(-3, -5); ctx.lineTo(4, -5); // shoulders
            ctx.lineTo(3, 5); ctx.lineTo(-2, 5); // waist
            ctx.fill();

            // Front Leg
            ctx.lineWidth = 3;
            ctx.strokeStyle = skin; 
            ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(-swing * 5, 10 - kneeBend); ctx.lineTo(-swing * 8, 14); ctx.stroke();
            ctx.strokeStyle = this.shortsColor; 
            ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(-swing * 3, 8); ctx.stroke();

            // Front Arm
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = skin; 
            ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(swing * 4, 1); ctx.lineTo(swing * 6 + elbowBend, 4); ctx.stroke();
            ctx.strokeStyle = this.color; 
            ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(swing * 3, -1); ctx.stroke();

            // Head (Neck & Head)
            ctx.strokeStyle = skin; ctx.beginPath(); ctx.moveTo(0,-5); ctx.lineTo(1,-7); ctx.stroke();
            ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(1, -9, 3.5, 0, Math.PI*2); ctx.fill();
            
            // Hair (Slight variation per player based on id)
            ctx.fillStyle = this.id % 3 === 0 ? '#111' : (this.id % 2 === 0 ? '#3a2512' : '#d2b48c'); 
            ctx.beginPath(); ctx.arc(1, -10, 3.8, Math.PI*0.8, Math.PI*2.2); ctx.fill();

            if (ball.owner === this) {
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.stroke();
            }

            ctx.restore();
        }
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function resetMatch() {
        state = 'playing';
        stateTimer = 0;
        ball.owner = null;
        ball.x = width / 2;
        ball.y = height / 2;
        ball.vx = (Math.random() > 0.5 ? 2.5 : -2.5); 
        ball.vy = (Math.random() - 0.5) * 3;
        
        brazil.length = 0;
        portugal.length = 0;
        confetti.length = 0;
        
        for(let i=0; i<11; i++) {
            let b = new Player('brazil', i, true, '#FFDF00', '#002776');
            b.x = b.baseX * width; b.y = b.baseY * height;
            brazil.push(b);

            let p = new Player('portugal', i, false, '#FF0000', '#006600');
            p.x = p.baseX * width; p.y = p.baseY * height;
            portugal.push(p);
        }
    }

    function init() {
        resize();
        window.addEventListener('resize', resize);
        resetMatch();
        
        // Massive Realistic Audience (Thousands of fans)
        for(let i=0; i<1500; i++) {
            // Position in top or bottom stands
            let isTopStand = Math.random() > 0.5;
            let yPos = isTopStand ? Math.random() * 60 : height - Math.random() * 60;
            
            // Randomly assign team colors to audience (Yellow/Blue for Brazil, Red/Green for Portugal)
            let isBrazilFan = Math.random() > 0.5;
            let c1 = isBrazilFan ? (Math.random()>0.5?'#FFDF00':'#002776') : (Math.random()>0.5?'#FF0000':'#006600');
            let c2 = isBrazilFan ? (Math.random()>0.5?'#002776':'#FFDF00') : (Math.random()>0.5?'#006600':'#FF0000');

            audience.push({
                x: Math.random() * width,
                y: yPos,
                color1: c1, // shirt
                color2: c2, // pants
                jumpOffset: Math.random() * Math.PI * 2,
                cheerSpeed: Math.random() * 0.3 + 0.1,
                fanBase: isBrazilFan ? 'brazil' : 'portugal'
            });
        }
        animate();
    }

    function updateAI() {
        let allPlayers = brazil.concat(portugal);
        const standHeight = 60;

        if (!ball.owner) {
            ball.x += ball.vx;
            ball.y += ball.vy;
            ball.vx *= 0.985;
            ball.vy *= 0.985;
            
            if (ball.y < standHeight || ball.y > height - standHeight) ball.vy *= -0.8;
            if (ball.x < 10 || ball.x > width - 10) ball.vx *= -0.8;

            allPlayers.forEach(p => {
                let dx = p.x - ball.x;
                let dy = p.y - ball.y;
                if (Math.sqrt(dx*dx + dy*dy) < 14 && p.passCooldown === 0) {
                    ball.owner = p;
                    p.action = 'dribble';
                }
            });
        } else {
            let opponents = ball.owner.team === 'brazil' ? portugal : brazil;
            opponents.forEach(p => {
                let dx = p.x - ball.owner.x;
                let dy = p.y - ball.owner.y;
                if (Math.sqrt(dx*dx + dy*dy) < 14) {
                    if (Math.random() > 0.65) { 
                        ball.owner.action = 'home';
                        ball.owner.passCooldown = 35; 
                        ball.owner = p;
                        p.action = 'dribble';
                    }
                }
            });
        }

        if (!ball.owner) {
            let getClosest = (team) => {
                let closest = null;
                let minDist = 9999;
                team.forEach(p => {
                    let d = Math.pow(p.x - ball.x, 2) + Math.pow(p.y - ball.y, 2);
                    if (d < minDist) { minDist = d; closest = p; }
                });
                return closest;
            };

            let closestBrazil = getClosest(brazil);
            let closestPortugal = getClosest(portugal);

            brazil.forEach(p => p.action = (p === closestBrazil) ? 'chase' : 'home');
            portugal.forEach(p => p.action = (p === closestPortugal) ? 'chase' : 'home');
        } else {
            let attackers = ball.owner.team === 'brazil' ? brazil : portugal;
            let defenders = ball.owner.team === 'brazil' ? portugal : brazil;

            attackers.forEach(p => { if (p !== ball.owner) p.action = 'home'; });

            defenders.forEach(p => p.action = 'home');
            let sortedDefenders = defenders.slice().sort((a,b) => {
                return (Math.pow(a.x-ball.x, 2) + Math.pow(a.y-ball.y, 2)) - (Math.pow(b.x-ball.x, 2) + Math.pow(b.y-ball.y, 2));
            });
            if (sortedDefenders[0]) sortedDefenders[0].action = 'chase';
            if (sortedDefenders[1]) sortedDefenders[1].action = 'chase';
        }

        allPlayers.forEach(p => p.update());

        // Goal logic
        if (ball.x > width - 30 && ball.y > height/2 - 50 && ball.y < height/2 + 50) {
            triggerGoal('BRAZIL SCORES!');
        } else if (ball.x < 30 && ball.y > height/2 - 50 && ball.y < height/2 + 50) {
            triggerGoal('PORTUGAL SCORES!');
        }
    }

    function triggerGoal(message) {
        state = 'goal';
        stateTimer = 0;
        ball.owner = null;
        window.goalMessage = message;
        
        for(let i=0; i<300; i++) {
            confetti.push({
                x: ball.x + (Math.random()-0.5)*300,
                y: height/2 + (Math.random()-0.5)*300,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 12 - 5,
                color: Math.random() > 0.5 ? '#FFDF00' : (message.includes('PORTUGAL') ? '#FF0000' : '#009B3A')
            });
        }
    }

    function drawPitch() {
        const standHeight = 60;
        
        // Dark theme pitch
        ctx.fillStyle = '#0a230f'; 
        ctx.fillRect(0, standHeight, width, height - standHeight*2);
        
        // Pitch markings
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 3;
        
        ctx.beginPath(); ctx.moveTo(width/2, standHeight); ctx.lineTo(width/2, height-standHeight); ctx.stroke();
        ctx.beginPath(); ctx.arc(width/2, height/2, 80, 0, Math.PI*2); ctx.stroke();
        
        ctx.strokeRect(0, height/2 - 140, 140, 280); 
        ctx.strokeRect(width - 140, height/2 - 140, 140, 280); 
        
        // Goals
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(0, height/2 - 50, 20, 100);
        ctx.fillRect(width - 20, height/2 - 50, 20, 100);

        // Draw Stands (Bleachers)
        let gradientTop = ctx.createLinearGradient(0,0,0,standHeight);
        gradientTop.addColorStop(0, '#050505');
        gradientTop.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = gradientTop;
        ctx.fillRect(0, 0, width, standHeight);

        let gradientBot = ctx.createLinearGradient(0,height-standHeight,0,height);
        gradientBot.addColorStop(0, '#1a1a1a');
        gradientBot.addColorStop(1, '#050505');
        ctx.fillStyle = gradientBot;
        ctx.fillRect(0, height-standHeight, width, standHeight);
        
        // Stand lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for(let i=0; i<standHeight; i+=10) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, height-i); ctx.lineTo(width, height-i); ctx.stroke();
        }
    }

    function drawAudience() {
        // Optimizing audience draw by grouping colors
        audience.forEach(a => {
            let jumpY = 0;
            if (state === 'goal') {
                // Only winning fans cheer wildly
                if (window.goalMessage.includes('BRAZIL') && a.fanBase === 'brazil') {
                    jumpY = Math.abs(Math.sin(stateTimer * a.cheerSpeed * 2 + a.jumpOffset)) * 8;
                } else if (window.goalMessage.includes('PORTUGAL') && a.fanBase === 'portugal') {
                    jumpY = Math.abs(Math.sin(stateTimer * a.cheerSpeed * 2 + a.jumpOffset)) * 8;
                } else {
                    jumpY = Math.abs(Math.sin(stateTimer * a.cheerSpeed*0.5 + a.jumpOffset)) * 2; // Sad/slow jump
                }
            } else {
                // Normal Mexican wave based on ball position
                let distToBallX = Math.abs(a.x - ball.x);
                if (distToBallX < 200) {
                    jumpY = Math.max(0, (200 - distToBallX)/40) * Math.abs(Math.sin(Date.now()*0.01 + a.jumpOffset));
                }
            }

            ctx.fillStyle = a.color2; 
            ctx.fillRect(a.x - 1.5, a.y - jumpY, 3, 5);
            ctx.fillStyle = a.color1; 
            ctx.fillRect(a.x - 2, a.y - 4 - jumpY, 4, 4);
            ctx.fillStyle = '#F1C27D'; 
            ctx.beginPath(); ctx.arc(a.x, a.y - 6 - jumpY, 2, 0, Math.PI*2); ctx.fill();
        });
    }

    function draw() {
        drawPitch();
        drawAudience();
        
        brazil.forEach(p => p.draw());
        portugal.forEach(p => p.draw());
        
        // Draw Ball
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth=1; ctx.stroke();
        
        if (state === 'goal') {
            confetti.forEach(c => {
                ctx.fillStyle = c.color;
                ctx.fillRect(c.x, c.y, 6, 6);
            });
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);
        
        if (state === 'playing') {
            updateAI();
        } else if (state === 'goal') {
            stateTimer++;
            brazil.forEach((p, i) => { if (window.goalMessage.includes('BRAZIL')) p.y += Math.sin(stateTimer * 0.4 + i) * 3; });
            portugal.forEach((p, i) => { if (window.goalMessage.includes('PORTUGAL')) p.y += Math.sin(stateTimer * 0.4 + i) * 3; });
            
            confetti.forEach(c => {
                c.x += c.vx;
                c.y += c.vy;
                c.vy += 0.2; 
            });
            if (stateTimer > 250) resetMatch();
        }
        
        draw();
    }
    
    init();
});

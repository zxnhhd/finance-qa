class GomokuGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 40;
        this.gridSize = 15;
        this.board = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.aiMode = false;

        this.init();
    }

    init() {
        this.drawBoard();
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('aiModeBtn').addEventListener('click', () => this.toggleAIMode());
    }

    drawBoard() {
        this.ctx.fillStyle = '#deb887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;

        // 绘制网格线
        for (let i = 0; i < this.gridSize; i++) {
            const pos = i * this.cellSize + this.cellSize;
            // 垂直线
            this.ctx.beginPath();
            this.ctx.moveTo(pos, this.cellSize);
            this.ctx.lineTo(pos, this.canvas.height - this.cellSize);
            this.ctx.stroke();
            // 水平线
            this.ctx.beginPath();
            this.ctx.moveTo(this.cellSize, pos);
            this.ctx.lineTo(this.canvas.width - this.cellSize, pos);
            this.ctx.stroke();
        }

        // 绘制棋子
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.board[i][j]) {
                    this.drawPiece(i, j, this.board[i][j]);
                }
            }
        }
    }

    drawPiece(row, col, color) {
        const x = col * this.cellSize + this.cellSize;
        const y = row * this.cellSize + this.cellSize;

        this.ctx.beginPath();
        this.ctx.arc(x, y, this.cellSize * 0.4, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.strokeStyle = color === 'black' ? '#000' : '#ccc';
        this.ctx.stroke();
    }

    handleClick(e) {
        if (this.gameOver || (this.aiMode && this.currentPlayer === 'white')) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.round((x - this.cellSize) / this.cellSize);
        const row = Math.round((y - this.cellSize) / this.cellSize);

        if (this.isValidMove(row, col)) {
            this.makeMove(row, col);

            if (this.aiMode && !this.gameOver) {
                setTimeout(() => this.makeAIMove(), 500);
            }
        }
    }

    isValidMove(row, col) {
        return row >= 0 && row < this.gridSize && 
               col >= 0 && col < this.gridSize && 
               this.board[row][col] === null;
    }

    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        this.drawBoard();

        if (this.checkWin(row, col)) {
            this.gameOver = true;
            document.getElementById('gameStatus').textContent = 
                `游戏结束！${this.currentPlayer === 'black' ? '黑' : '白'}子获胜！`;
            return;
        }

        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        document.getElementById('gameStatus').textContent = 
            `轮到${this.currentPlayer === 'black' ? '黑' : '白'}子下`;
    }

    checkWin(row, col) {
        const directions = [
            [1, 0],  // 垂直
            [0, 1],  // 水平
            [1, 1],  // 对角线
            [1, -1]  // 反对角线
        ];

        return directions.some(([dx, dy]) => {
            return this.countPieces(row, col, dx, dy) + 
                   this.countPieces(row, col, -dx, -dy) - 1 >= 5;
        });
    }

    countPieces(row, col, dx, dy) {
        const color = this.board[row][col];
        let count = 0;
        let x = row;
        let y = col;

        while (x >= 0 && x < this.gridSize && 
               y >= 0 && y < this.gridSize && 
               this.board[x][y] === color) {
            count++;
            x += dx;
            y += dy;
        }

        return count;
    }

    makeAIMove() {
        let bestScore = -Infinity;
        let bestMove = null;

        // 简单的评分算法
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.board[i][j] === null) {
                    const score = this.evaluateMove(i, j);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = [i, j];
                    }
                }
            }
        }

        if (bestMove) {
            this.makeMove(bestMove[0], bestMove[1]);
        }
    }

    evaluateMove(row, col) {
        // 模拟落子
        this.board[row][col] = 'white';
        
        let score = 0;
        // 检查是否能赢
        if (this.checkWin(row, col)) {
            score = 1000;
        } else {
            // 评估位置
            score += this.evaluatePosition(row, col);
        }

        // 撤销模拟
        this.board[row][col] = null;
        return score;
    }

    evaluatePosition(row, col) {
        // 简单的位置评分
        // 靠近棋盘中心的位置得分较高
        const centerDist = Math.abs(row - 7) + Math.abs(col - 7);
        let score = (14 - centerDist) * 2;

        // 检查周围是否有己方棋子
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.gridSize && 
                    newCol >= 0 && newCol < this.gridSize) {
                    if (this.board[newRow][newCol] === 'white') {
                        score += 5;
                    } else if (this.board[newRow][newCol] === 'black') {
                        score += 3; // 阻止对手连子
                    }
                }
            }
        }

        return score;
    }

    restart() {
        this.board = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.drawBoard();
        document.getElementById('gameStatus').textContent = '游戏开始！轮到黑子下';
    }

    toggleAIMode() {
        this.aiMode = !this.aiMode;
        this.restart();
        document.getElementById('aiModeBtn').textContent = 
            this.aiMode ? '关闭AI模式' : '切换AI模式';
    }
}

// 初始化游戏
new GomokuGame();
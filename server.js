const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const size = 20; // Kích thước bàn cờ
let board = Array(size).fill().map(() => Array(size).fill(''));
let playerScore = 0; // Điểm số người chơi
let botScore = 0;    // Điểm số bot
let currentTurn = 'Player'; // Lượt hiện tại

app.use(express.static('public')); // Phục vụ tệp tĩnh

// Hàm reset bàn cờ
function resetBoard() {
    board = Array(size).fill().map(() => Array(size).fill(''));
}

// Gửi điểm số tới tất cả client
function updateScores() {
    io.emit('scoreUpdate', { playerScore, botScore });
}

// Kiểm tra thắng
function checkWin(row, col, mark) {
    return checkDirection(row, col, mark, 1, 0) ||  // Hàng ngang
           checkDirection(row, col, mark, 0, 1) ||  // Cột dọc
           checkDirection(row, col, mark, 1, 1) ||  // Chéo xuống
           checkDirection(row, col, mark, 1, -1);   // Chéo lên
}

// Kiểm tra số lượng quân cùng loại trong một hướng
function checkDirection(row, col, mark, rowDir, colDir) {
    let count = 1; // Bắt đầu với 1 quân
    let r = row + rowDir, c = col + colDir;

    // Kiểm tra hướng đầu tiên
    while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === mark) {
        count++;
        r += rowDir;
        c += colDir;
    }

    // Kiểm tra hướng ngược lại
    r = row - rowDir;
    c = col - colDir;
    while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === mark) {
        count++;
        r -= rowDir;
        c -= colDir;
    }

    return count >= 5; // Kiểm tra xem có 5 quân liên tiếp không
}

// Bot đi nước ngẫu nhiên
function botMove() {
    const emptyCells = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (board[i][j] === '') {
                emptyCells.push({ row: i, col: j });
            }
        }
    }

    if (emptyCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const move = emptyCells[randomIndex];
        board[move.row][move.col] = 'O';
        return move;
    }
    return null;
}

io.on('connection', (socket) => {
    console.log('Người chơi kết nối');

    // Gửi board ban đầu và điểm số hiện tại
    socket.emit('board', board);
    socket.emit('scoreUpdate', { playerScore, botScore });

    // Xử lý nước đi của người chơi
    socket.on('playMove', (data) => {
        if (currentTurn !== 'Player') return; // Chỉ cho phép người chơi đi nếu đến lượt

        const { row, col } = data;

        if (board[row][col] === '') {
            board[row][col] = 'X';

            // Kiểm tra người chơi thắng
            if (checkWin(row, col, 'X')) {
                playerScore++;
                io.emit('winner', { winner: 'Player' });
                updateScores();
                resetBoard();
                io.emit('board', board);
                currentTurn = 'Player'; // Người chơi bắt đầu lại
                return;
            }

            // Chuyển lượt cho bot
            currentTurn = 'Bot';
            const botPosition = botMove();
            if (botPosition) {
                io.emit('botMove', botPosition);

                // Kiểm tra bot thắng
                if (checkWin(botPosition.row, botPosition.col, 'O')) {
                    botScore++;
                    io.emit('winner', { winner: 'Bot' });
                    updateScores();
                    resetBoard();
                    io.emit('board', board);
                    currentTurn = 'Player'; // Người chơi bắt đầu lại
                    return;
                }
            }

            // Gửi cập nhật board cho tất cả client
            io.emit('board', board);
            currentTurn = 'Player'; // Chuyển lượt về người chơi
        }
    });

    socket.on('disconnect', () => {
        console.log('Người chơi đã ngắt kết nối');
    });
});

// Bắt đầu server
server.listen(3004, () => {
    console.log('Server đang chạy trên http://localhost:3004');
});

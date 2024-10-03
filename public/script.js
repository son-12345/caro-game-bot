const socket = io();

// Tạo bàn cờ 20x20
const board = document.getElementById('board');
const size = 20;
const cells = [];
let currentPlayer = 'Player';  // Người chơi là 'Player', bot sẽ là 'Bot'

// Hiển thị điểm số cho người chơi và bot
const playerXScoreElement = document.getElementById('playerXScore');
const botOScoreElement = document.getElementById('botOScore');

// Tạo các ô trong bàn cờ
for (let i = 0; i < size; i++) {
    cells[i] = [];
    for (let j = 0; j < size; j++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = i;
        cell.dataset.col = j;
        board.appendChild(cell);
        cells[i][j] = cell;

        // Sự kiện khi người chơi click vào ô
        cell.addEventListener('click', () => {
            if (cell.innerHTML === '' && currentPlayer === 'Player') {
                // Gửi nước đi của người chơi lên server
                socket.emit('playMove', { row: i, col: j });
            }
        });
    }
}

// Lắng nghe sự kiện cập nhật board từ server
socket.on('board', (updatedBoard) => {
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            cells[i][j].innerHTML = updatedBoard[i][j];
            cells[i][j].classList.remove('X', 'O');
            if (updatedBoard[i][j] === 'X') {
                cells[i][j].classList.add('X');
            } else if (updatedBoard[i][j] === 'O') {
                cells[i][j].classList.add('O');
            }
        }
    }
});

// Lắng nghe nước đi của bot
socket.on('botMove', (data) => {
    const { row, col } = data;
    const botCell = cells[row][col];
    botCell.innerHTML = 'O';
    botCell.classList.add('O');
});

// Hiển thị điểm số từ server
socket.on('scoreUpdate', (data) => {
    playerXScoreElement.textContent = data.playerScore;
    botOScoreElement.textContent = data.botScore;
});

// Lắng nghe sự kiện thông báo người thắng
socket.on('winner', (data) => {
    alert(`${data.winner} đã thắng!`);
});

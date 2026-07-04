// app.js
import { testMessage } from './config.js';
import { storageMessage } from './storage.js';

// HTMLのタイトル（h1）の下あたりに、確認メッセージを強制的に追加して表示します
const debugDiv = document.createElement('div');
debugDiv.style.padding = '10px';
debugDiv.style.background = '#e2f0d9';
debugDiv.innerHTML = `
    <p>【連動テスト結果】</p>
    <ul>
        <li>${testMessage}</li>
        <li>${storageMessage}</li>
    </ul>
`;
document.body.insertBefore(debugDiv, document.body.firstChild);

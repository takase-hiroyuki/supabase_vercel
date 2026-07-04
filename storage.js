// storage.js

// 1. 記憶ポケットに「値を保存する」ための関数
export function saveToStorage(key, value) {
    localStorage.setItem(key, value);
}

// 2. 記憶ポケットから「値を取り出す」ための関数
export function getFromStorage(key) {
    return localStorage.getItem(key);
}

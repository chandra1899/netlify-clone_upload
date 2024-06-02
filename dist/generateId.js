"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
function generate() {
    let s = "";
    const str = "123456789abcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < 5; i++) {
        s += str[Math.floor(Math.random() * str.length)];
    }
    return s;
}
exports.generate = generate;

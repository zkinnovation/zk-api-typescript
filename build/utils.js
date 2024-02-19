"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomID = void 0;
const generateRandomID = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=<>?';
    let randomID = '';
    for (let i = 0; i < 18; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomID += characters.charAt(randomIndex);
    }
    return randomID;
};
exports.generateRandomID = generateRandomID;
//# sourceMappingURL=utils.js.map
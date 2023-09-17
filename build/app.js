"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const exampleRoutes_1 = __importDefault(require("./routes/exampleRoutes"));
const app = (0, express_1.default)();
app.use('/api', exampleRoutes_1.default);
const app = (0, express_1.default)();
app.use('/api', exampleRoutes_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map
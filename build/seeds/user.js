"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const uuid_1 = require("uuid");
const bcrypt_1 = __importDefault(require("bcrypt"));
async function seed(knex) {
    await knex("users").del();
    const hashedPassword = await bcrypt_1.default.hash('password', 10);
    const now = Date.now();
    await knex("users").insert([
        {
            id: (0, uuid_1.v4)(),
            name: 'Test User',
            email: 'tes@gmail.com',
            phone: null,
            is_verified: false,
            membership_date: null,
            is_admin: false,
            password: hashedPassword,
            remember_me_token: null,
            created_at: now,
            updated_at: now
        }
    ]);
}
;
//# sourceMappingURL=user.js.map
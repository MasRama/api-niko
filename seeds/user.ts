import { Knex } from "knex";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("users").del();

    // Hash password
    const hashedPassword = await bcrypt.hash('password', 10);
    const now = Date.now();

    // Inserts seed entries
    await knex("users").insert([
        {
            id: uuidv4(),
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
};

/**
 * Authentication Service
 * Handles user authentication operations including password hashing, verification,
 * session management, and login/logout functionality.
 */

import DB from "./DB"; 
import { Request, Response } from "../../type";
import { randomUUID, pbkdf2Sync, randomBytes } from "crypto";
import bcrypt from "bcrypt";

// PBKDF2 configuration
const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = 'sha512';
const SALT_SIZE = 16;

/**
 * Authentication class providing core authentication functionality
 */
class Autenticate {
   /**
    * Hashes a plain text password using PBKDF2
    * @param {string} password - The plain text password to hash
    * @returns {string} The hashed password with salt (format: salt:hash)
    */
   async hash(password: string) {
      const salt = randomBytes(SALT_SIZE).toString('hex');
      const hash = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
      return `${salt}:${hash}`;
   }

   /**
    * Compares a plain text password with a hashed password
    * Supports both bcrypt and PBKDF2 formats
    * @param {string} password - The plain text password to verify
    * @param {string} storedHash - The stored password hash (bcrypt format or salt:hash format)
    * @returns {boolean} True if passwords match, false otherwise
    */
   async compare(password: string, storedHash: string) {
      // Check if it's bcrypt format (starts with $2a$, $2b$, $2x$, $2y$)
      if (storedHash.startsWith('$2')) {
         return await bcrypt.compare(password, storedHash);
      }
      
      // Otherwise, use PBKDF2 format (salt:hash)
      const [salt, hash] = storedHash.split(':');
      const newHash = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
      return hash === newHash;
   }

   /**
    * Processes user login by creating a new session
    * @param {Object} user - The user object containing user details
    * @param {Request} request - The HTTP request object
    * @param {Response} response - The HTTP response object
    * 
    * @description
    * 1. Generates a unique session token
    * 2. Creates a session record in the database
    * 3. Sets a session cookie
    * 4. Redirects to the home page
    */
   async process(user, request: Request, response: Response) {
      const token = randomUUID();

      await DB.table("sessions").insert({
         id: token,
         user_id: user.id,
         user_agent: request.headers["user-agent"],
      });

      // Set cookie with 60-day expiration and redirect to home
      response
         .cookie("auth_id", token, 1000 * 60 * 60 * 24 * 60)
         .redirect("/home");
   }

   /**
    * Handles user logout by removing the session
    * @param {Request} request - The HTTP request object
    * @param {Response} response - The HTTP response object
    * 
    * @description
    * 1. Deletes the session from the database
    * 2. Clears the session cookie
    * 3. Redirects to the login page
    */
   async logout(request: Request, response: Response) {
      await DB.from("sessions").where("id", request.cookies.auth_id).delete();

      response.cookie("auth_id", "", 0).redirect("/login");
   }
}

// Export a singleton instance
export default new Autenticate();

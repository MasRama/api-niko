import inertia from "./app/middlewares/inertia";

import Web from "./routes/web";

import HyperExpress from "hyper-express";

import cors from 'cors';

const webserver = new HyperExpress.Server();
 
require("dotenv").config();

//  rendering html files
import "./app/services/View"; 


// CORS configuration for mobile app support
webserver.use(cors({
   origin: true, // Allow all origins for mobile apps
   credentials: true, // Allow credentials
   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
   allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
   ],
   exposedHeaders: ['Authorization']
}));

webserver.use(inertia());

webserver.use(Web); 

const PORT = parseInt(process.env.PORT) || 5555;
 
webserver.set_error_handler((req, res, error: any) => {
   console.log(error);

   if (error.code == "SQLITE_ERROR") {
      res.status(500);
   }

   res.json(error);
});

webserver
   .listen(PORT)
   .then(() => {
      console.log(`Server is running at http://localhost:${PORT}`);
   })
   .catch((err: any) => {});

process.on("SIGTERM", () => {
   console.info("SIGTERM signal received.");
   process.exit(0);
});

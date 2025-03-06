// Import the 'express' module
import "./env";
import express, { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import { AppDataSource } from "./data-source";
import UserEntity from "./entity/UserEntity";
import path from "path";
import NotificationRouter from "./routers/NotificationRouter";
import PantryRouter from "./routers/PantryRouter";
import UserRouter from "./routers/UserRouter";
import MenuRouter from "./routers/MenuRouter";
import DailyMenuRouter from "./routers/DailyMenuRouter";
import StudentRouter from "./routers/StudentRouter";
import OrderRouter from "./routers/OrderRouter";
import SessionRouter from "./routers/SessionRouter";
import SchoolRouter from "./routers/SchoolRouter";
import LoginRouter from "./routers/LoginRouter";
import { validateAuthorizationToken } from "./routers/RouterUtils";

declare global {
  namespace Express {
    interface Request {
      user: UserEntity;
    }
  }
}

const authorizeRequest: RequestHandler<any, any, any, any> = async (
  req,
  res,
  next
) => {
  const result = await validateAuthorizationToken(req);
  if (typeof result === 'string') {
    res.status(401).send(result);
  } else {
    req.user = (result as UserEntity);
    next();

  }
};

AppDataSource.initialize()
  .then(async () => {

    // Create an Express application
    const app = express();
    // parse application/x-www-form-urlencoded
    app.use(express.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use((req, res, next) => {
      if (
        /(.ico|.js|.css|.jpg|.png|.map|.svg)$/i.test(req.path) ||
        /\/api\//i.test(req.path)
      ) {
        next();
      } else {
        res.header(
          "Cache-Control",
          "private, no-cache, no-store, must-revalidate"
        );
        res.header("Expires", "-1");
        res.header("Pragma", "no-cache");
        res.sendFile(
          path.join(__dirname, "../../cafeteria-frontend/build", "index.html")
        );
      }
    });
    app.use(
      express.static(path.join(__dirname, "../../cafeteria-frontend/build"))
    );


    app.use("/api/notification", authorizeRequest, NotificationRouter);
    app.use("/api/pantry", authorizeRequest, PantryRouter);
    app.use("/api/user", authorizeRequest, UserRouter);
    app.use("/api/menu", authorizeRequest, MenuRouter);
    app.use("/api/dailymenu", authorizeRequest, DailyMenuRouter);
    app.use("/api/student", authorizeRequest, StudentRouter);
    app.use("/api/order", authorizeRequest, OrderRouter);
    app.use("/api/session", authorizeRequest, SessionRouter);
    app.use("/api/schoolsettings", authorizeRequest, SchoolRouter);
    app.use("/api/login", LoginRouter);

    // This code makes sure that any request that does not matches a static file
    // in the build folder, will just serve index.html. Client side routing is
    // going to make sure that the correct content will be loaded.
    // parse application/json

    interface Empty {}


    // Set the port number for the server
    const port = parseInt(process.env.CAFETERIA_PORT || "3000");

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => console.log(error));
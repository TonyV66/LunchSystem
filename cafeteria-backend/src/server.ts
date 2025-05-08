// Import the 'express' module
import "./env";
import express, { RequestHandler } from "express";
import bodyParser from "body-parser";
import { AppDataSource } from "./data-source";
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
import { authorizeRequest } from "./routers/RouterUtils";


AppDataSource.initialize()
  .then(async () => {
    // Create an Express application
    const app = express();
    // parse application/x-www-form-urlencoded
    app.use(express.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use((req, res, next) => {
      if (/(.ico|.js|.css|.jpg|.png|.map|.svg)$/i.test(req.path)) {
        res.header("Cache-Control", "max-age=31536000");
        next();
      } else if (/\/api\//i.test(req.path)) {
        next();
      } else {
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
    app.use("/api/menu", authorizeRequest, MenuRouter);
    app.use("/api/dailymenu", authorizeRequest, DailyMenuRouter);
    app.use("/api/student", authorizeRequest, StudentRouter);
    app.use("/api/order", authorizeRequest, OrderRouter);
    app.use("/api/session", authorizeRequest, SessionRouter);
    app.use("/api/schoolsettings", authorizeRequest, SchoolRouter);
    app.use("/api/user", UserRouter);
    app.use("/api/login", LoginRouter);

    interface Empty {}

    // Set the port number for the server
    const port = parseInt(process.env.CAFETERIA_PORT || "3000");

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => console.log(error));

// Import the 'express' module
import "./env";
import express, { RequestHandler } from "express";
import bodyParser from "body-parser";
import { AppDataSource } from "./data-source";
import path from "path";
import NotificationRouter from "./routers/NotificationRouter";
import PantryRouter from "./routers/PantryRouter";
import IngredientRouter from "./routers/IngredientRouter";
import UnitOfMeasureRouter from "./routers/UnitOfMeasureRouter";
import UserRouter from "./routers/UserRouter";
import MenuRouter from "./routers/MenuRouter";
import DailyMenuRouter from "./routers/DailyMenuRouter";
import StudentRouter from "./routers/StudentRouter";
import OrderRouter from "./routers/OrderRouter";
import MealRouter from "./routers/MealRouter";
import SessionRouter from "./routers/SessionRouter";
import SchoolRouter from "./routers/SchoolRouter";
import LoginRouter from "./routers/LoginRouter";
import { authorizeUserWithRole } from "./routers/RouterUtils";
import SchoolYearRouter from "./routers/SchoolYearRouter";
import ReportsRouter from "./routers/ReportsRouter";
import SchoolRegistrationRouter from "./routers/SchoolRegistrationRouter";
import SurveyRouter from "./routers/SurveyRouter";
import CalendarNoteRouter from "./routers/CalendarNoteRouter";
import { EmailSchedulerService } from "./services/EmailSchedulerService";

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
      } else if (/\/api\//i.test(req.path) || /\/reports\//i.test(req.path)) {
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

    app.use("/api/notification", authorizeUserWithRole(), NotificationRouter);
    app.use("/api/pantry", authorizeUserWithRole(), PantryRouter);
    app.use("/api/ingredient", authorizeUserWithRole(), IngredientRouter);
    app.use("/api/unit-of-measure", authorizeUserWithRole(), UnitOfMeasureRouter);
    app.use("/api/menu", authorizeUserWithRole(), MenuRouter);
    app.use("/api/dailymenu", authorizeUserWithRole(), DailyMenuRouter);
    app.use("/api/student", authorizeUserWithRole(), StudentRouter);
    app.use("/api/order", authorizeUserWithRole(), OrderRouter);
    app.use("/api/meal", authorizeUserWithRole(), MealRouter);
    app.use("/api/session", authorizeUserWithRole(), SessionRouter);
    app.use("/api/school", authorizeUserWithRole(), SchoolRouter);
    app.use("/api/schoolyear", authorizeUserWithRole(), SchoolYearRouter);
    app.use("/api/survey", authorizeUserWithRole(), SurveyRouter);
    app.use("/api/calendar-note", authorizeUserWithRole(), CalendarNoteRouter);
    app.use("/api/user", UserRouter);
    app.use("/api/login", LoginRouter);
    app.use("/api/register", SchoolRegistrationRouter);
    app.use("/reports", ReportsRouter);

    // Start the email scheduler
    await EmailSchedulerService.startScheduler();

    interface Empty {}

    // Set the port number for the server
    const port = parseInt(process.env.CAFETERIA_PORT || "3000");

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => console.log(error));

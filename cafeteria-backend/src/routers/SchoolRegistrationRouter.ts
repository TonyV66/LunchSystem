import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { Credentials, LoginResponse } from "./LoginRouter";
import UserEntity from "../entity/UserEntity";
import { DeepPartial } from "typeorm";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { JWT_PRIVATE_KEY } from "./RouterUtils";
import { getSessionInfo } from "./SessionRouter";
import SchoolEntity from "../entity/SchoolEntity";

const SchoolRegistrationRouter: Router = express.Router();
interface Empty {}

interface RegistrationRequest extends Credentials {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  schoolName: string;
}

// Function to generate a unique 6-character registration code
const generateUniqueRegistrationCode = async (): Promise<string> => {
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);
  
  // Characters allowed: A-Z (excluding I, O) and 2-9 (excluding 0, 1)
  const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops
  
  while (attempts < maxAttempts) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
    }
    
    // Check if this code already exists
    const existingSchool = await schoolRepository.findOne({
      where: { registrationCode: code }
    });
    
    if (!existingSchool) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('Unable to generate unique registration code after maximum attempts');
};

SchoolRegistrationRouter.post<
  Empty,
  LoginResponse | string,
  RegistrationRequest,
  Empty
>("/", async (req, res) => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);

  try {
    const registrationCode = await generateUniqueRegistrationCode();
    
    const school = await schoolRepository.save({
      name: req.body.schoolName,
      registrationCode: registrationCode,
    });

    if (
      req.body.username.match(
        /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/
      )
    ) {
      res.status(401).send("Invalid username.");
      return;
    }

    const existingUser = await userRepository.findOne({
      where: { userName: req.body.username.toLowerCase() },
    });

    if (existingUser) {
      res.status(401).send("Username already exists.");
      return;
    }

    const hash = bcrypt.hashSync(req.body.pwd, 5);

    const user: DeepPartial<UserEntity> = {
      ...req.body,
      id: undefined,
      pwd: hash,
      email: req.body.email.toLowerCase(),
      phone: req.body.phone || "",
      school: school,
    };

    user.userName = user.userName?.toLowerCase();
    const savedUser = await userRepository.save(user);

    const jwtToken = jwt.sign({ userId: user.id }, JWT_PRIVATE_KEY);
    const sessionInfo = await getSessionInfo(savedUser);

    res.send({
      ...sessionInfo,
      jwtToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).send("Failed to create registration. Please try again.");
  }
});

export default SchoolRegistrationRouter;

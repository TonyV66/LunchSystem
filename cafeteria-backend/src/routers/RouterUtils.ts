import jwt from "jsonwebtoken";
import { Request, RequestHandler, Response } from "express";
import { AppDataSource } from "../data-source";
import SchoolEntity from "../entity/SchoolEntity";
import UserEntity from "../entity/UserEntity";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import UserStatusEntity from "../entity/UserStatusEntity";
import { Role } from "../models/User";
import { getUserStatus } from "../utils/UserStatusUtils";

export const JWT_PRIVATE_KEY = "your-secret-key";

type JwtPayload = {
  userId: number;
};

declare global {
  namespace Express {
    interface Request {
      user: UserEntity;
      userStatus: UserStatusEntity;
      school: SchoolEntity;
      schoolYear: SchoolYearEntity | undefined;
    }
  }
}

export const getCurrentSchoolYear = (school: SchoolEntity) => {
  let latestSchoolYear = school!.schoolYears.find((sy) => sy.isCurrent);
  return latestSchoolYear;
};

const attachAuthenticatedUser = async (
  req: Request,
  res: Response
): Promise<boolean> => {
  if (req.user && req.userStatus && req.school) {
    return true;
  }

  const result = await validateAuthorizationToken(req);
  if (typeof result === "string") {
    res.status(401).send(result);
    return false;
  }

  const userStatus = getUserStatus(result);
  if (!userStatus?.school) {
    res.status(401).send("Access denied. No school registration found");
    return false;
  }

  req.user = result;
  req.userStatus = userStatus;
  req.school = userStatus.school;
  req.schoolYear = getCurrentSchoolYear(userStatus.school);
  return true;
};

export const authorizeUserWithRole = (
  ...allowedRoles: Role[]
): RequestHandler<any, any, any, any> => {
  return async (req, res, next) => {
    const authenticated = await attachAuthenticatedUser(req, res);
    if (!authenticated) {
      return;
    }

    if (
      allowedRoles.length > 0 &&
      !allowedRoles.includes(req.userStatus.role)
    ) {
      res.status(403).send("Unauthorized");
      return;
    }

    next();
  };
};

export const validateAuthorizationToken = async (
  request: Request<any, any, any, any, Record<string, any>>
): Promise<UserEntity | string> => {
  const userRepository = AppDataSource.getRepository(UserEntity);

  const jwtToken = request.header("Authorization")?.replace("Bearer ", "");

  if (!jwtToken) {
    return "Access denied. No token provided";
  } else {
    try {
      const jwtPayload = jwt.verify(jwtToken, JWT_PRIVATE_KEY) as JwtPayload;

      const user = await userRepository.findOne({
        where: { id: jwtPayload.userId },
        relations: {
          userStatuses: {
            school: {
              schoolYears: true,
            },
          },
        },
      });

      if (user) {
        return user;
      } else {
        return "Access denied. Invalid authorization token";
      }
    } catch (err) {
      return "Access denied. Unable to process authorization token";
    }
  }
};

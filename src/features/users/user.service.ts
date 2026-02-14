import { PrismaClient } from "../../../prisma/generated";
import { User } from "./user.model";

const prisma = new PrismaClient();

export async function getUser(): Promise<User> {}

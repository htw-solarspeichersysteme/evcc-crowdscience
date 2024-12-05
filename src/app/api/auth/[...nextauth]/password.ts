import bcrypt from "bcrypt";

export async function hashPassword(password: string): Promise<string> {
    const saltrounds = 10;
    return await bcrypt.hash(password, saltrounds);
    }
   
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}
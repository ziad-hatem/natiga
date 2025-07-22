import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function GET(req: NextRequest) {
  // Optionally, you can add more payload data or validation here
  const payload = {
    iat: Math.floor(Date.now() / 1000),
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2m" });
  return NextResponse.json({ token });
}

import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validators/auth";

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email address");
    }
  });

  it("rejects password shorter than 6 characters", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Password must be at least 6 characters"
      );
    }
  });

  it("accepts password with exactly 6 characters", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });
});

describe("registerSchema", () => {
  const valid = {
    email: "user@example.com",
    password: "StrongP1",
    confirmPassword: "StrongP1",
    fullName: "John Doe",
  };

  it("accepts valid registration data", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "Short1", confirmPassword: "Short1" });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase letter", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "alllower1",
      confirmPassword: "alllower1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Must contain at least one uppercase letter");
    }
  });

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "NoNumbers",
      confirmPassword: "NoNumbers",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Must contain at least one number");
    }
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Passwords do not match");
    }
  });

  it("rejects empty fullName", () => {
    const result = registerSchema.safeParse({ ...valid, fullName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects fullName longer than 100 characters", () => {
    const result = registerSchema.safeParse({
      ...valid,
      fullName: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

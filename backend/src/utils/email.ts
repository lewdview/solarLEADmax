import validator from "email-validator";

export const isValidEmail = (email: string): boolean => validator.validate(email);

import { z } from 'zod';

// Strict email regex
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Phone validation - must have at least 10 digits, prevent dummy entries
const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{6,}$/;

// Check for dummy phone numbers
const isDummyPhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check for repeated digits (like 1111111111)
  if (/^(\d)\1{5,}$/.test(digitsOnly)) return true;
  
  // Check for sequential patterns (like 123456789)
  if (/^0?1234567|^0?12345678|^123456/.test(digitsOnly)) return true;
  
  // Check for obvious fake numbers
  if (['1234567890', '0987654321', '1111111111', '0000000000'].includes(digitsOnly)) return true;
  
  // Must have at least 10 digits for international format
  if (digitsOnly.length < 10) return true;
  
  return false;
};

export const optInFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please enter your full name')
    .max(100, 'Name must be less than 100 characters')
    .refine(
      (val) => val.split(/\s+/).filter(Boolean).length >= 1,
      'Please enter your name'
    ),
  
  phone: z
    .string()
    .trim()
    .min(10, 'Please enter a valid phone number')
    .max(20, 'Phone number is too long')
    .refine(
      (val) => phoneRegex.test(val),
      'Please enter a valid international phone number'
    )
    .refine(
      (val) => !isDummyPhone(val),
      'Please enter a real phone number'
    ),
  
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .refine(
      (val) => emailRegex.test(val),
      'Please enter a valid email address'
    ),
  
  jobRole: z
    .string()
    .trim()
    .min(2, 'Please enter your current designation')
    .max(100, 'Designation must be less than 100 characters'),
});

export type OptInFormData = z.infer<typeof optInFormSchema>;

export const adminLoginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export type AdminLoginData = z.infer<typeof adminLoginSchema>;

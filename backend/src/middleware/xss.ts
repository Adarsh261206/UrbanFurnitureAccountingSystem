import { Request, Response, NextFunction } from 'express';

const DANGEROUS_PATTERNS = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<applet/gi,
  /<form/gi,
  /expression\(/gi,
  /vbscript:/gi,
  /livescript:/gi,
  /<svg\s+onload/gi,
];

function sanitizeString(str: string): string {
  let sanitized = str;
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  return sanitized;
}

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = sanitizeObject(obj[key]);
    }
    return result;
  }
  return obj;
}

export function xssSanitizer(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        (req.query as any)[key] = sanitizeString(req.query[key] as string);
      }
    }
  }
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      if (typeof req.params[key] === 'string') {
        (req.params as any)[key] = sanitizeString(req.params[key] as string);
      }
    }
  }
  next();
}

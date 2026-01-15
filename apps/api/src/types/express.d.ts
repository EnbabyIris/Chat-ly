// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestTime?: string;
    }
  }
}

export {};
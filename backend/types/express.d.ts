// Express request interfaces with user property
declare global namespace Express {
  interface Request {
    user?: {
      _id: string;
      [key: string]: any;
    };
    headers: {
      [key: string]: any;
      "accept-language": string | undefined;
    };
  }
}
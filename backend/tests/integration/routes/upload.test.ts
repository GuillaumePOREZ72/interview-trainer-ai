import request from "supertest";
import { createApp } from "../../../app";

// Mock the upload middleware BEFORE importing app
jest.mock("../../../middlewares/uploadMiddleware", () => {
  return (req: any, res: any, next: any) => {
    // Just populate for any POST mock call in this test context
    if (req.method === "POST") {
      req.file = {
        filename: "test-image",
        originalname: "test-image.png",
        mimetype: "image/png",
        path: "https://res.cloudinary.com/demo/image/upload/v1/test-image.png",
        size: 1024,
      };
      return next();
    }
    next();
  };
});

const app = createApp();

/**
 * Upload Image Integration Tests
 * Updated for Cloudinary Refactor
 */
describe("Upload Routes (Cloudinary Mocked)", () => {
  describe("POST /api/auth/upload-image", () => {
    it("should return the Cloudinary URL on success", async () => {
      // Since we mocked the middleware to always succeed and return a fixed URL,
      // we just need to trigger the route.
      // We still send multipart data to match the route definition if we were using real multer,
      // but our mock bypasses the actual parsing.

      const response = await request(app)
        .post("/api/auth/upload-image")
        // We attach just to set proper headers, though our mock ignores the content
        .attach("image", Buffer.from("fake-image"), "test.png");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("imageUrl");
      expect(response.body.imageUrl).toContain("https://res.cloudinary.com");
    });
  });
});

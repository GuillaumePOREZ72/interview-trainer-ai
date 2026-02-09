/**
 * Upload Middleware Unit Tests
 * Tests file validation and error handling
 */

import { handleUploadError, deleteUploadedFile } from "../../../middlewares/uploadMiddleware";
import { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

describe("📤 Upload Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe("handleUploadError", () => {
    it("should handle LIMIT_FILE_SIZE error", () => {
      const error = new multer.MulterError("LIMIT_FILE_SIZE", "File too large");
      
      handleUploadError(error, mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Maximum size"),
        })
      );
    });

    it("should handle LIMIT_UNEXPECTED_FILE error", () => {
      const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE", "audio");
      
      handleUploadError(error, mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("'audio'"),
        })
      );
    });

    it("should handle generic errors", () => {
      const error = new Error("Invalid file format");
      
      handleUploadError(error, mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid file format",
        })
      );
    });

    it("should call next() when no error", () => {
      handleUploadError(null, mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("deleteUploadedFile", () => {
    it("should delete file if it exists", () => {
      const testFile = "/tmp/test-file.txt";
      fs.writeFileSync(testFile, "test content");
      
      deleteUploadedFile(testFile);
      
      expect(fs.existsSync(testFile)).toBe(false);
    });

    it("should not throw if file does not exist", () => {
      const nonExistentFile = "/tmp/non-existent-file.txt";
      
      expect(() => deleteUploadedFile(nonExistentFile)).not.toThrow();
    });

    it("should handle null path gracefully", () => {
      expect(() => deleteUploadedFile(null as any)).not.toThrow();
    });
  });
});

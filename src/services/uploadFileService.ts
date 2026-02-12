import { v2 as cloudinary } from "cloudinary";
import * as fs from "fs";
import { Readable } from "stream";

export class UploadFileService {
  // Create Group Service

  uploadFile = async (file: Express.Multer.File): Promise<string> => {
    try {
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: "twezimbe/files",
        resource_type: "raw",
        use_filename: true,
        type: "upload",
        unique_filename: true,
      });
      const url = uploadResult.secure_url;
      // Clean up the temporary file
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });

      return url;
    } catch (error: any) {
      // Clean up the temporary file even if upload fails
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });
      throw new Error(`Failed to upload file: ${error?.message}`);
    }
  };
  uploadProfileImage = async (file: Express.Multer.File): Promise<string> => {
    return this.uploadImage({ file, path: "/profile-image" });
  };

  private uploadImage = async ({
    file,
    path,
  }: {
    file: Express.Multer.File;
    path?: string;
  }): Promise<string> => {
    try {
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: `twezimbe${path || "/others"}`,
        resource_type: "raw",
        use_filename: true,
        type: "upload",
        unique_filename: true,
      });
      const url = uploadResult.secure_url;

      // Clean up the temporary file
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });

      return url;
    } catch (error: any) {
      // Clean up the temporary file even if upload fails

      fs.unlink(file.path, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });
      throw new Error(`Failed to upload image: ${error?.message}`);
    }
  };

  uploadGroupCoverImage = async (
    file: Express.Multer.File,
  ): Promise<string> => {
    return this.uploadImage({ file, path: "/group-cover-image" });
  };

  uploadGroupCoverAndIconImage = async (
    file: Express.Multer.File,
  ): Promise<{ coverUrl: string; iconUrl: string }> => {
    try {
      const coverUrl = await this.uploadImage({
        file,
        path: "/group-cover-image",
      });
      const iconUrl = await this.uploadImage({
        file,
        path: "/group-icon-image",
      });

      return {
        coverUrl,
        iconUrl,
      };
    } catch (error: any) {
      throw new Error(`Failed to upload group images: ${error.message}`);
    }
  };
  uploadGroupIconImage = async (file: Express.Multer.File): Promise<string> => {
    return this.uploadImage({ file, path: "/group-icon-image" });
  };

  findFile = async (
    filePath: string,
  ): Promise<{ url: string; dateUploaded: Date; found: boolean }> => {
    try {
      // Get file details from cloudinary
      const result = await cloudinary.api.resource(filePath);
      if (result) {
        return {
          url: result.secure_url,
          dateUploaded: new Date(result.created_at),
          found: false,
        };
      } else {
        return {
          url: "",
          dateUploaded: new Date(),
          found: false,
        };
      }
    } catch (error: any) {
      // Clean up the temporary file even if operation fails
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });
      throw new Error(`Failed to process file: ${error.message}`);
    }
  };
  async uploadFileStream(
    fileStream: Readable,
    fileInfo: { originalname: string; mimetype: string },
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          filename_override: fileInfo.originalname,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result?.secure_url as string);
        },
      );

      fileStream.pipe(uploadStream);
    });
  }
}


export  const uploadFileService = new UploadFileService()

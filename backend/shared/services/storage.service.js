import path from "path";
import { env } from "../config/env.js";

const safeFileName = (fileName) => fileName.replace(/[^a-zA-Z0-9._-]/g, "-");

export const storageService = {
  buildObjectPath({ restaurantId, folder, fileName }) {
    const name = `${Date.now()}-${safeFileName(fileName)}`;
    return path.posix.join(String(restaurantId), folder, name);
  },

  buildPublicUrl(objectPath) {
    return `${env.storageBaseUrl}/${objectPath}`.replace(/\\/g, "/");
  },

  async uploadBuffer({ restaurantId, folder, file }) {
    const objectPath = this.buildObjectPath({ restaurantId, folder, fileName: file.originalname });
    return {
      provider: "local",
      objectPath,
      url: this.buildPublicUrl(objectPath),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  },
};

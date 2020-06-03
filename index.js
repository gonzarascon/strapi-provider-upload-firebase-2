"use strict";

/**
 * Module dependencies
 */

const admin = require("firebase-admin"),
  fs = require("fs"),
  path = require("path");
let bucket = undefined;

module.exports = {
  init(providerOptions) {
    if (!bucket) {
      admin.initializeApp({
        credential: admin.credential.cert(providerOptions.serviceAccount),
        storageBucket: providerOptions.bucket,
      });
      bucket = admin.storage().bucket();
    }

    return {
      upload: (file) => {
        const base_temp_url = path.join(
          strapi.config.paths.static,
          `/uploads/temp_${file.hash}${file.ext}`
        );

        return new Promise((resolve, reject) => {
          fs.writeFile(base_temp_url, file.buffer, async (err) => {
            if (err) reject(err);
            try {
              const [firestoreFile] = await bucket.upload(base_temp_url, {
                destination: `${file.hash}${file.ext}`,
                contentType: file.mime,
              });
              const [url] = await firestoreFile.getSignedUrl({
                action: "read",
                expires: "03-01-2500",
              });

              resolve(Object.assign(file, { url }));
            } catch (error) {
              console.log(`Upload failed, try again: ${error}`);
            }
          });
        });
      },
      delete: async (file) => {
        const filename = `${file.hash}${file.ext}`;
        try {
          await bucket.file(filename).delete();
        } catch (error) {
          console.log(`Could not delete: ${error}`);
        }
      },
    };
  },
};

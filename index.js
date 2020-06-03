"use strict";

/**
 * Module dependencies
 */

const admin = require("firebase-admin");
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
      upload: async (file) => {
        console.log("UPLOADED FILE", file);
        const path = file.path
          ? `${file.path}/`
          : `/uploads/${file.hash}${file.ext}`;
        try {
          const [firestoreFile] = await bucket.upload(path, {
            destination: `${file.hash}${file.ext}`,
            contentType: file.mime,
          });
          const [url] = await firestoreFile.getSignedUrl({
            action: "read",
            expires: "03-01-2500",
          });
          file.url = url;
        } catch (error) {
          console.log(`Upload failed, try again: ${error}`);
        }
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

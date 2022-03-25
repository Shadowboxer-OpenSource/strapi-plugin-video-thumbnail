"use strict";

/**
 * video-thumbnail.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const _ = require("lodash");
const ffmpeg = require("fluent-ffmpeg");
const AWS = require("aws-sdk");
const { Readable } = require("stream");

module.exports = ({ strapi }) => ({
  async generateThumbnail(videoData) {
    // Image manipulation process (same as upload plugin)
    const { getDimensions, generateThumbnail, generateResponsiveFormats } =
      strapi.plugins.upload.services["image-manipulation"];

    const screenshotData = await getScreenshot(videoData);
    if (screenshotData) {
      const { width, height } = await getDimensions(screenshotData);
      _.assign(screenshotData, {
        width,
        height,
      });
      _.assign(videoData, {
        width,
        height,
      });

      const thumbnailFile = await generateThumbnail(screenshotData);
      if (thumbnailFile) {
        thumbnailFile.buffer = await streamToBuffer(thumbnailFile.getStream());
        const result = await strapi.plugins.upload.provider.upload(
          thumbnailFile
        );
        delete thumbnailFile.buffer;
        _.set(videoData, "formats.thumbnail", thumbnailFile);
      }
      const formats = await generateResponsiveFormats(screenshotData);
      if (Array.isArray(formats) && formats.length > 0) {
        for (const format of formats) {
          if (!format) continue;
          const { key, file } = format;
          file.buffer = await streamToBuffer(file.getStream());
          await strapi.plugins.upload.provider.upload(file);
          delete file.buffer;
          _.set(videoData, ["formats", key], file);
        }
      }
    }
  },
});

const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => {
      chunks.push(chunk);
    });
    stream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    stream.on("error", reject);
  });

const getScreenshot = (videoData) =>
  new Promise(async (resolve, reject) => {
    // Saved file name
    const videoFileName = `${videoData.hash}${videoData.ext}`;

    // Create temp folder
    const tmpPath = path.join(
      os.tmpdir(),
      `strapi${crypto.randomBytes(6).toString("hex")}`
    );
    fs.mkdirSync(tmpPath);

    // Path of video file
    const videoPath = videoData.url;
    const screenshotExt = ".png";
    const screenshotFileName = videoData.hash + screenshotExt;

    // Take screenshot
    try {
      ffmpeg(videoPath)
        .screenshots({
          count: 1,
          filename: screenshotFileName,
          folder: tmpPath,
        })
        .on("end", () => {
          // console.log("FFMPEG DONE");
          // console.log(path.join(tmpPath, screenshotFileName));
          fs.readFile(path.join(tmpPath, screenshotFileName), (err, buffer) => {
            resolve({
              name: screenshotFileName,
              hash: videoData.hash,
              tmpWorkingDirectory: tmpPath,
              // path: path.join(tmpPath, screenshotFileName),
              ext: screenshotExt,
              mime: "image/png",
              buffer: buffer,
              getStream: () => Readable.from(buffer),
            });
          });
        });
    } catch (e) {
      console.error("FFMPEG ERROR");
      console.error(e);
      reject(e);
    }

    // clean up
    fs.rmdir(tmpPath, () => {});
  });

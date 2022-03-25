const ffmpeg = require("fluent-ffmpeg");

("use strict");

module.exports = ({ strapi }) => {
  const { generateThumbnail } =
    strapi.plugins["video-thumbnail"].services.thumbnailService;

  // subscribe to lifecycle hook for file uploads
  strapi.db.lifecycles.subscribe({
    models: ["plugin::upload.file"],
    async beforeCreate(event) {
      // Run if file type is video
      const data = event.params.data;
      if (data.mime.startsWith("video")) {
        await generateThumbnail(data);
      } else {
        console.log("NOT A VIDEO FILE");
      }
    },
  });
};

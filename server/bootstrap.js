const ffmpeg = require("fluent-ffmpeg");

("use strict");

module.exports = ({ strapi }) => {
  const { generateThumbnail } =
    strapi.plugins["video-thumbnail"].services.thumbnailService;

  // subscribe to lifecycle hook for file uploads
  strapi.db.lifecycles.subscribe({
    models: ["plugin::upload.file"],
    async beforeCreate(event) {
      console.log(event.params.data);
      // Run if file type is video
      if (event.params.data.mime.startsWith("video")) {
        await generateThumbnail(event.params.data);
      } else {
        // console.log("NOT A VIDEO FILE");
      }
    },
  });
};

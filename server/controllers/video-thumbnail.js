"use strict";

/**
 * video-thumbnail.js controller
 *
 * @description: A set of functions called "actions" of the `video-thumbnail` plugin.
 */

module.exports = ({ strapi }) => ({
  /**
   * Default action.
   *
   * @return {Object}
   */

  index: async (ctx) => {
    // Add your own logic here.

    // Send 200 `ok`
    ctx.send({
      message: "ok",
    });
  },
});

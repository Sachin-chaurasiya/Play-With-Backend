import multer from "multer";

/**
 * Multer configuration
 * @param {Object} req
 * @param {Object} file
 * @param {Function} cb
 * @returns {Function}
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

/**
 * Multer upload
 * @type {multer}
 * @returns {multer}
 */
export const upload = multer({ storage });

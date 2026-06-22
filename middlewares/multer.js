import multer from "multer";

// const storage = multer.diskStorage({
//   destination: function (req, file, callback) {
//     callback(null, "./images");
//   },
//   filename: function (req, file, callback) {
//     callback(null, file.originalname);
//   },
// });
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export default upload;

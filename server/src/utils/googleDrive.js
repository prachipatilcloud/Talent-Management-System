// import drive from "../config/googleDrive.js";
// import { PassThrough } from "stream";

// export const uploadFileToDrive = async (file) => {
//   const bufferStream = new PassThrough();
//   bufferStream.end(file.buffer);
  
//   const response = await drive.files.create({
//       requestBody: {
//           name: file.originalname,
//           mimeType: file.mimetype,
//           parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
//         },
//         media: {
//             mimeType: file.mimetype,
//             body: bufferStream,
//         },
//     });
//     console.log("Uploading to folder:", process.env.GOOGLE_DRIVE_FOLDER_ID);
        
//   const fileId = response.data.id;

//   await drive.permissions.create({
//     fileId,
//     requestBody: {
//       role: "reader",
//       type: "anyone",
//     },
//   });

//   const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;

//   return { fileId, fileUrl };
// };
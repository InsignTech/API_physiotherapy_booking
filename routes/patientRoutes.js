import express from "express";
import {
  addPatients,
  getAllPatients,
  getAppointment,
  appointmentDetails,
  updateAppointmentDetails,
  getAllAppointment,
  deleteAppointment,
  updatePatients,
  deletePatients,
  getDashboardStats,
  searchPatients,
  getPatientById,
} from "../controller/patientController.js";
import protect from "../middleWare/userMiddleWare.js";
const app = express.Router();

app.route("/").post(protect,addPatients).get(protect,getAllPatients);
app.route("/dashboard").get(protect,getDashboardStats);
app.route("/search").get(protect,searchPatients);
app.route('/getAllAppointmnets').get(protect,getAppointment).post(protect,appointmentDetails)
app
  .route("/:id")
   .get(protect, getPatientById)
  .put(protect,updatePatients)
  .delete(protect,deletePatients)
  
app
  .route("/appointments/:id")
  .put(protect,updateAppointmentDetails)
  .get(protect,getAllAppointment)
  .delete(protect,deleteAppointment);
export default app;

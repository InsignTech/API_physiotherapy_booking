import express from "express";
import {
  addPatients,
  getAllPatients,
  getAppointment,
  getPatients,
  appointmentDetails,
  updateAppointmentDetails,
  getAllAppointment,
  deleteAppointment,
  updatePatients,
  deletePatients,
  getDashboardStats,
} from "../controller/patientController.js";
import protect from "../middleWare/userMiddleWare.js";
const app = express.Router();

app.route("/").post(protect,addPatients).get(protect,getAllPatients);
app.route("/dashboard").get(protect,getDashboardStats);
app.route("/search").get(protect,getPatients);
app
  .route("/:id")
  .put(protect,updatePatients)
  .delete(protect,deletePatients)
app.route('/getAllAppointmnets').get(protect,getAppointment).post(protect,appointmentDetails)
  
app
  .route("/appointments/:id")
  .put(protect,updateAppointmentDetails)
  .get(protect,getAllAppointment)
  .delete(protect,deleteAppointment);
export default app;

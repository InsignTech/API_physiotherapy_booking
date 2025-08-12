import express from 'express'
import {addPatients,getAllPatients,getAppointment,getPatients,appointmentDetails,updateAppointmentDetails,getAllAppointment,deleteAppointment,updatePatients,deletePatients, getDashboardStats} from '../controller/patientController.js'
const app = express.Router()

app.route('/').post(addPatients).get(getAllPatients)
app.route('/dashboard').get(getDashboardStats)
app.route('/search').get(getPatients)
app.route('/:id').put(updatePatients).delete(deletePatients).get(getAppointment)
app.route('/appointment/:id').post(appointmentDetails).put(updateAppointmentDetails).get(getAllAppointment).delete(deleteAppointment)
export default app
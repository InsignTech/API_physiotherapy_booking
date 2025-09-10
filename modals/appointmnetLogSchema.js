import mongoose from "mongoose";

var Schema = mongoose.Schema;
var logSchema = new Schema(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointments",
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patients",
      required: true,
    },
    totalAmount: {
      type: Number,
      ref: "Appoinments",
      default: 0,
    },
    paidAmount: {
      type: Number,
      ref: "Appoinments",
      default: 0,
    },
    previousAmount: {
      type: Number,
      ref: "Appointments",
      default: 0,
    },
    appointmentDate: {
      type: Date,
      ref: "Appointments",
    },
    appointmentTime: {
      type: String,
      ref: "Appointments",
    },
    action: {
      type: String,
      enum: ["add", "edit", "delete"],
      required: true,
    },
  },
  { timestamps: true }
);

const logDetails = mongoose.model("logSchema", logSchema);

export default logDetails;

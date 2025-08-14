import mongoose from "mongoose";

var Schema = mongoose.Schema;

var appointmentSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patients",
      required: true,
    },
    totalAmount: {
      type: Number,
      default:0
    },
    paidAmount: {
      type: Number,
      required: true,
    },
    appointmentDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
    previousBalance:{
      type:Number,
      default:0
    }
  },
  { timestamps: true }
);

const Appointments = mongoose.model("Appointments", appointmentSchema);
export default Appointments;

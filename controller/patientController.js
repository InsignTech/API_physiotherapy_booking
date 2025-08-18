import Patients from "../modals/patientsSchema.js";
import Appointments from "../modals/appointmentSchema.js";

const addPatients = async (req, res) => {
  const { name, phoneNumber } = req.body;
  try {
    const existPatient = await Patients.findOne({
      phoneNumber,
      name: { $regex: `^${name}$`, $options: "i" },
    });
    if (existPatient) {
      return res.status(400).json({
        msg: "Patient already exist",
      });
    }
    const patientDetails = await Patients.create(req.body);
    return res.status(201).json({
      msg: "Patient details addded successfully",
      data: patientDetails,
    });
  } catch (err) {
    res.status(400).json({
      err,
    });
  }
};

const updatePatients = async (req, res) => {
  try {
    const id = req.params.id;
    const patient = await Patients.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!patient) {
      return res.status(404).json({ msg: "not valid record in this id" });
    }
    return res.status(201).json({
      msg: "patient details updated successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(400).json({
      msg: "Error creating appointment",
      error: error.message,
    });
  }
};

const deletePatients = async (req, res) => {
  try {
    const id = req.params.id;
    const patientDetails = await Patients.deleteOne({ _id: id });
    if (!patientDetails) {
      return res.status(404).json({ msg: "invalid patient id" });
    }
    return res
      .status(200)
      .json({ msg: "the record of patients deleted successfully" });
  } catch (error) {
    console.error("error during deleting the Patient details", error);
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patients.findById(id).lean();

    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    // Count total appointments for this patient
    const totalAppointments = await Appointments.countDocuments({
      patientId: id,
    });

    // Get latest appointment for previousBalance
    const latestAppointment = await Appointments.findOne({
      patientId: id,
    }).sort({ appointmentDate: -1, createdAt: -1 });

    return res.status(200).json({
      msg: "Patient fetched successfully",
      data: {
        ...patient,
        totalAppointments,
        previousBalance: latestAppointment?.previousBalance || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching patient by ID:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

const getAllPatients = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    const patientDetails = await Patients.find()
      .sort({ appointmentDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    console.log("previous", patientDetails);

    const enhancedPatients = await Promise.all(
      patientDetails.map(async (patient) => {
        // Count total appointments
        const totalAppointments = await Appointments.countDocuments({
          patientId: patient._id,
        });

        // Get latest appointment for previousBalance
        const latestAppointment = await Appointments.findOne({
          patientId: patient._id,
        }).sort({ appointmentDate: -1, createdAt: -1 });
        console.log(patient);
        return {
          ...patient,
          totalAppointments,
          previousBalance: latestAppointment?.previousBalance || 0,
        };
      })
    );

    // Get total number of matching patients
    const total = await Patients.countDocuments();

    // Send paginated response
    return res.status(200).json({
      msg: "Patients fetched successfully",
      data: enhancedPatients,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error during fetching patients:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

// const getAppointment = async (req, res) => {
//   const { id, date } = req.query;
//   let filter = {};
// if (id) filter.patientId = id;
//   if (date) {
//     // Match only appointments for that specific date
//     const startOfDay = new Date(date);
//     startOfDay.setHours(0, 0, 0, 0);
//     const endOfDay = new Date(date);
//     endOfDay.setHours(23, 59, 59, 999);

//     filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
//   }

//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;

//   try {
//     const appointments = await Appointments.find(filter)
//       .sort({ appointmentDate: -1 }) // newest first
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .populate("patientId", "name age gender phoneNumber address email");

//       console.log("appointmetsn",appointments)

//     const total = await Appointments.countDocuments(filter);

//     res.status(200).json({
//       msg: "Appointments fetched successfully",
//       data: appointments,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//         totalRecords: total,
//         hasNextPage: page * limit < total,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching appointments", error);
//     res.status(500).json({ msg: "Internal server error" });
//   }
// };

const getAppointment = async (req, res) => {
  const { id, startDate, endDate } = req.query;
  let filter = {};

  if (id) filter.patientId = id;

  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.appointmentDate = { $gte: start, $lte: end };
  } else if (startDate && !endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(startDate);
    end.setHours(23, 59, 59, 999);
    filter.appointmentDate = { $gte: start, $lte: end };
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    // Step 1: Get paginated appointments
    const appointments = await Appointments.find(filter)
      .sort({ appointmentDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(
        "patientId",
        "name age gender phoneNumber address email previousBalance"
      )
      .lean();

    console.log("appointmnets", appointments);

    // Convert UTC to IST (+5:30)
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const appointmentsIST = appointments.map((app) => ({
      ...app,
      appointmentDateIST: new Date(app.appointmentDate.getTime() + IST_OFFSET),
    }));

    const total = await Appointments.countDocuments(filter);

    res.status(200).json({
      msg: "Appointments fetched successfully",
      data: appointmentsIST,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNextPage: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching appointments", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

const searchPatients = async (req, res) => {
  try {
    const { query } = req.query;

    let searchConditions = {};

    if (query && query.trim().length > 0) {
      const searchQuery = query.trim();
      const orConditions = [
        {
          name: { $regex: searchQuery, $options: "i" },
        },
        { phoneNumber: { $regex: searchQuery, $options: "i" } },
      ];

      searchConditions = { $or: orConditions };
    }

    const patients = await Patients.find(searchConditions)
      .sort({ appointmentDate: -1, createdAt: -1 })
      .limit(10)

      .lean();
    for (let patient of patients) {
      const latestAppointment = await Appointments.findOne(
        { patientId: patient._id },
        { previousBalance: 1 },
        { sort: { appointmentDate: -1, createdAt: -1 } }
      )

      patient.previousBalance = latestAppointment?.previousBalance || 0;
      const totalAppointments = await Appointments.countDocuments({
        patientId: patient._id,
      });
      patient.totalAppointments = totalAppointments;
    }
console.log("patients....",patients)
    res.status(200).json({
      success: true,
      message: "Patients retrieved successfully",
      data: patients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching patients",
      error: error.message,
    });
  }
};
const appointmentDetails = async (req, res) => {
  try {
    const { patientId, totalAmount, paidAmount, appointmentDate, notes } =
      req.body;

    // Find patient’s latest appointment to get their previous balance
    const lastAppointment = await Appointments.findOne({ patientId }).sort({
      appointmentDate: -1,
      createdAt: -1,
    });

    const prevBalance = lastAppointment?.previousBalance || 0;

    // Parse amounts safely
    const total = parseFloat(totalAmount) || 0;
    const paid = parseFloat(paidAmount) || 0;

    // New previous balance calculation
    let updatedPreviousBalance =
      Number(prevBalance || 0) + Number(total || 0) - Number(paid || 0);

      if(updatedPreviousBalance < 0){
        updatedPreviousBalance = 0

      }

    const newAppointment = await Appointments.create({
      patientId,
      totalAmount: total,
      paidAmount: paid,
      appointmentDate,
      notes,
      previousBalance: updatedPreviousBalance,
    });

    return res.status(201).json({
      msg: "Appointment created successfully",
      data: newAppointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(400).json({
      msg: "Error creating appointment",
      error: error.message,
    });
  }
};

const updateAppointmentDetails = async (req, res) => {
  const { id } = req.params;
  const { totalAmount, paidAmount, appointmentDate, notes } = req.body;

  try {
    const existingAppointment = await Appointments.findById(id);
    if (!existingAppointment) {
      return res.status(404).json({ msg: "No appointment found" });
    }

    // Parse amounts safely
    const total = parseFloat(totalAmount) || 0;
    const paid = parseFloat(paidAmount) || 0;

    // Calculate updated previousBalance
    let updatedPreviousBalance =
      (existingAppointment.previousBalance || 0) + (total || 0) - paid;
      if(updatedPreviousBalance < 0){
        updatedPreviousBalance = 0

      }

    console.log("balance", updatedPreviousBalance);

    const updatedAppointment = await Appointments.findByIdAndUpdate(
      id,
      {
        totalAmount: total,
        paidAmount: paid,
        appointmentDate,
        previousBalance: updatedPreviousBalance,
        notes,
      },
      { new: true }
    );

    return res.status(200).json({
      msg: "Patient appointment details updated successfully",
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Error during update appointment:", error);
    return res
      .status(400)
      .json({ msg: "Error updating appointment", error: error.message });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const id = req.params.id;
    const appointmentDetails = await Appointments.deleteOne({ _id: id });
    if (!appointmentDetails) {
      return res.status(404).json({ msg: "no valid records found" });
    }
    return res.status(200).json({ msg: "appointment deleted successfully" });
  } catch (error) {
    console.error("error during fetching appointment", error);
  }
};

const getAllAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    const appointments = await Appointments.find({ patientId: id });
    if (!appointments || appointments.length === 0) {
      return res
        .status(404)
        .json({ msg: "No appointments found for this patient ID" });
    }
    return res
      .status(200)
      .json({ msg: "appointments fetched successfully", data: appointments });
  } catch (error) {
    console.error("Error during fetching appointmnets", error);
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalPatientsPromise = Patients.countDocuments();

    // --- Start of Corrected Timezone Logic ---
    const now = new Date();
    const IST_OFFSET = 330;
    const istNow = new Date(now.getTime() + IST_OFFSET * 60000);

    // ✅ FIX: Use getUTC... methods to correctly extract the date parts for IST
    const istStartOfDay = new Date(
      Date.UTC(
        istNow.getUTCFullYear(),
        istNow.getUTCMonth(),
        istNow.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );

    const istEndOfDay = new Date(
      Date.UTC(
        istNow.getUTCFullYear(),
        istNow.getUTCMonth(),
        istNow.getUTCDate(),
        23,
        59,
        59,
        999
      )
    );

    // Convert IST start/end to the correct UTC query range
    const utcStartOfDay = new Date(
      istStartOfDay.getTime() - IST_OFFSET * 60000
    );
    const utcEndOfDay = new Date(istEndOfDay.getTime() - IST_OFFSET * 60000);
    // --- End of Corrected Timezone Logic ---

    const todaysAppointmentsPromise = Appointments.countDocuments({
      appointmentDate: { $gte: utcStartOfDay, $lte: utcEndOfDay },
    });

    const totalRevenuePromise = Appointments.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const pendingAmountPromise = Appointments.aggregate([
      {
        $sort: { patientId: 1, appointmentDate: -1, createdAt: -1 },
      },
      {
        $group: {
          _id: "$patientId",
          previousBalance: { $first: "$previousBalance" },
        },
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: "$previousBalance" },
        },
      },
    ]);

    const [totalPatients, todaysAppointments, totalRevenue, pendingAmount] =
      await Promise.all([
        totalPatientsPromise,
        todaysAppointmentsPromise,
        totalRevenuePromise,
        pendingAmountPromise,
      ]);

    return res.status(200).json({
      msg: "Dashboard stats retrieved successfully",
      totalPatients,
      todaysAppointments,
      totalRevenue: totalRevenue[0] ? totalRevenue[0].total : 0,
      pendingAmount: pendingAmount[0] ? pendingAmount[0].totalPending : 0,
    });
  } catch (error) {
    console.error("Error retrieving dashboard stats:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

export {
  getPatientById,
  addPatients,
  updatePatients,
  deletePatients,
  getAllPatients,
  getAppointment,
  searchPatients,
  appointmentDetails,
  updateAppointmentDetails,
  getAllAppointment,
  deleteAppointment,
  getDashboardStats,
};

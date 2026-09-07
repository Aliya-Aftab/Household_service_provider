import Complaint from "../models/Complaint.js";

export const raiseComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.create(req.body);
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
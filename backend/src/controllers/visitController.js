const { query, pool } = require('../config/database');

// Create consultation / visit (Doctor / Admin)
// Can also accept prescription items to atomically record both consultation and prescription
exports.createVisit = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      appointment_id,
      patient_id,
      doctor_id,
      chief_complaint,
      associated_complaints,
      past_history,
      family_history,
      appetite,
      thirst,
      desire,
      aversion,
      thermal_state,
      disagree,
      allergy,
      stool,
      urine,
      sleep,
      dreams,
      habit,
      menstrual_history,
      obstetric_history,
      weight,
      pulse,
      tongue,
      conjunctiva,
      height,
      blood_pressure,
      temperature,
      nail,
      cvs,
      cns,
      rs,
      git,
      mental_symptoms,
      lab_investigation,
      diagnosis,
      totality_of_symptoms,
      treatment_dose,
      doctor_notes,
      follow_up_date,
      prescription_notes,
      prescription_items, // Array of { medicine_name, dosage, frequency, duration, instructions }
    } = req.body;

    if (!patient_id || !chief_complaint || !diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'Patient, Chief complaint, and Diagnosis are required',
      });
    }

    // Determine doctor_id: use specified doctor_id, Admin doctor_id, or default clinic doctor
    let finalDoctorId = doctor_id || req.user.doctor_id;
    if (!finalDoctorId) {
      const defaultDoc = await client.query('SELECT id FROM doctors ORDER BY id ASC LIMIT 1');
      if (defaultDoc.rows.length > 0) {
        finalDoctorId = defaultDoc.rows[0].id;
      }
    }

    if (!finalDoctorId) {
      return res.status(400).json({ success: false, message: 'Doctor ID is required' });
    }

    await client.query('BEGIN');

    // 1. Insert Visit with Complete Homeopathic Case Taking Record
    const visitRes = await client.query(
      `INSERT INTO visits (
        appointment_id, patient_id, doctor_id, chief_complaint, associated_complaints,
        past_history, family_history, appetite, thirst, desire, aversion, thermal_state,
        disagree, allergy, stool, urine, sleep, dreams, habit, menstrual_history,
        obstetric_history, weight, pulse, tongue, conjunctiva, height, blood_pressure,
        temperature, nail, cvs, cns, rs, git, mental_symptoms, lab_investigation,
        diagnosis, totality_of_symptoms, treatment_dose, doctor_notes, follow_up_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
      )
      RETURNING *`,
      [
        appointment_id || null,
        patient_id,
        finalDoctorId,
        chief_complaint,
        associated_complaints || null,
        past_history || null,
        family_history || null,
        appetite || null,
        thirst || null,
        desire || null,
        aversion || null,
        thermal_state || null,
        disagree || null,
        allergy || null,
        stool || null,
        urine || null,
        sleep || null,
        dreams || null,
        habit || null,
        menstrual_history || null,
        obstetric_history || null,
        weight || null,
        pulse || null,
        tongue || null,
        conjunctiva || null,
        height || null,
        blood_pressure || null,
        temperature || null,
        nail || null,
        cvs || null,
        cns || null,
        rs || null,
        git || null,
        mental_symptoms || null,
        lab_investigation || null,
        diagnosis,
        totality_of_symptoms || null,
        treatment_dose || null,
        doctor_notes || null,
        follow_up_date || null,
      ]
    );
    const visit = visitRes.rows[0];

    // 2. If appointment_id is present, update status to 'COMPLETED'
    if (appointment_id) {
      await client.query(
        `UPDATE appointments 
         SET status = 'COMPLETED' 
         WHERE id = $1`,
        [appointment_id]
      );
    }

    // 3. If prescription items provided, create prescription and items
    let createdPrescription = null;
    if (prescription_items && Array.isArray(prescription_items) && prescription_items.length > 0) {
      const presRes = await client.query(
        `INSERT INTO prescriptions (visit_id, patient_id, doctor_id, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [visit.id, patient_id, finalDoctorId, prescription_notes || null]
      );
      createdPrescription = presRes.rows[0];

      const insertedItems = [];
      for (const item of prescription_items) {
        if (item.medicine_name && item.dosage) {
          const itemRes = await client.query(
            `INSERT INTO prescription_items (
              prescription_id, medicine_name, dosage, frequency, duration, instructions
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
              createdPrescription.id,
              item.medicine_name.trim(),
              item.dosage.trim(),
              item.frequency ? item.frequency.trim() : '1-0-1',
              item.duration ? item.duration.trim() : '5 days',
              item.instructions ? item.instructions.trim() : null,
            ]
          );
          insertedItems.push(itemRes.rows[0]);
        }
      }
      createdPrescription.items = insertedItems;
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Consultation visit recorded successfully',
      visit,
      prescription: createdPrescription,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating visit:', error);
    res.status(500).json({ success: false, message: 'Failed to record consultation visit', error: error.message });
  } finally {
    client.release();
  }
};

// Get visits for a patient
exports.getPatientVisits = async (req, res) => {
  try {
    const { id } = req.params; // patient_id

    const result = await query(
      `SELECT v.*,
              u.full_name as doctor_name, d.specialization as doctor_specialization,
              a.appointment_date, a.start_time as appointment_time,
              (
                SELECT json_build_object(
                  'id', pr.id,
                  'notes', pr.notes,
                  'items', COALESCE(
                    json_agg(
                      json_build_object(
                        'id', pi.id,
                        'medicine_name', pi.medicine_name,
                        'dosage', pi.dosage,
                        'frequency', pi.frequency,
                        'duration', pi.duration,
                        'instructions', pi.instructions
                      )
                    ) FILTER (WHERE pi.id IS NOT NULL), '[]'
                  )
                )
                FROM prescriptions pr
                LEFT JOIN prescription_items pi ON pi.prescription_id = pr.id
                WHERE pr.visit_id = v.id
                GROUP BY pr.id
              ) as prescription
       FROM visits v
       JOIN doctors d ON v.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       LEFT JOIN appointments a ON v.appointment_id = a.id
       WHERE v.patient_id = $1
       ORDER BY v.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      visits: result.rows,
    });
  } catch (error) {
    console.error('Error fetching patient visits:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch visits', error: error.message });
  }
};

// Get visit details by ID
exports.getVisitById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT v.*,
              p.patient_code, p.first_name, p.last_name, p.phone, p.gender, p.blood_group,
              u.full_name as doctor_name, d.specialization as doctor_specialization,
              d.registration_number as doctor_reg_no,
              a.appointment_date
       FROM visits v
       JOIN patients p ON v.patient_id = p.id
       JOIN doctors d ON v.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       LEFT JOIN appointments a ON v.appointment_id = a.id
       WHERE v.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    const visit = result.rows[0];

    // Fetch prescription if any
    const presRes = await query(
      `SELECT pr.*, 
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', pi.id,
                    'medicine_name', pi.medicine_name,
                    'dosage', pi.dosage,
                    'frequency', pi.frequency,
                    'duration', pi.duration,
                    'instructions', pi.instructions
                  )
                ) FILTER (WHERE pi.id IS NOT NULL), '[]'
              ) as items
       FROM prescriptions pr
       LEFT JOIN prescription_items pi ON pi.prescription_id = pr.id
       WHERE pr.visit_id = $1
       GROUP BY pr.id`,
      [id]
    );

    visit.prescription = presRes.rows.length > 0 ? presRes.rows[0] : null;

    res.json({ success: true, visit });
  } catch (error) {
    console.error('Error fetching visit by id:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch visit', error: error.message });
  }
};

// Assign a volunteer (admin). Backend: backend/src/routes/pickupRoutes.js
// (assignRules) and pickupController.js assign().
//
//   volunteerId  required: one of the approved volunteers listed
//                "Choose a volunteer"
//
// The request being assigned (claimRequestId) is not a field: it is the
// slip the admin opened the dialog from.
export const assignRules = {
  volunteerId: {
    required: 'Choose a volunteer',
  },
};

/** Field names on the form, for putting server errors under the right input. */
export const ASSIGN_FIELDS = ['volunteerId'];

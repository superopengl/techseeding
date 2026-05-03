import { db } from "../db/index.js";
import { user, studentProfile } from "../db/schema.js";
import { generateStudentId } from "../lib/generateStudentId.js";
import { success, error } from "../lib/response.js";

export function adminCreateStudent(fastify) {
  fastify.post("/api/admin/student", async (request, reply) => {
    const { accountName, firstName, lastName, dob, gender, homeAddress, contactNumber, custodianName, notes } = request.body || {};

    if (!accountName || !firstName || !lastName) {
      return error(reply, 400, "VALIDATION_ERROR", "accountName, firstName and lastName are required");
    }

    const limits = { accountName: 50, firstName: 50, lastName: 50, homeAddress: 100, contactNumber: 20, custodianName: 50, notes: 2000 };
    for (const [field, max] of Object.entries(limits)) {
      const val = request.body[field];
      if (val && val.length > max) {
        return error(reply, 400, "VALIDATION_ERROR", `${field} must be ${max} characters or less`);
      }
    }

    const { newUser, profile: newProfile } = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(user)
        .values({ userName: accountName, role: "student" })
        .returning();

      const studentId = generateStudentId();

      const [profile] = await tx
        .insert(studentProfile)
        .values({
          userId: newUser.id,
          studentId,
          firstName: firstName,
          lastName: lastName,
          dob: dob || null,
          gender: gender || null,
          homeAddress: homeAddress || null,
          contactNumber: contactNumber || null,
          custodianName: custodianName || null,
          notes: notes || null,
        })
        .returning();

      return { newUser, profile };
    });

    return reply.status(201).send(success({
      id: newUser.id,
      userName: newUser.userName,
      role: newUser.role,
      profile: {
        id: newProfile.id,
        studentId: newProfile.studentId,
        firstName: newProfile.firstName,
        lastName: newProfile.lastName,
        joinedAt: newProfile.joinedAt,
      },
    }));
  });
}

import { db } from "../db/index.js";
import { user, studentProfile } from "../db/schema.js";
import { generateStudentId } from "../lib/generateStudentId.js";
import { success, error } from "../lib/response.js";

export function adminCreateStudent(fastify) {
  fastify.post("/api/admin/student", async (request, reply) => {
    const { firstName, lastName, nickname, dob, gender, homeAddress, contactNumber, custodianName, notes } = request.body || {};

    if (!firstName || !lastName) {
      return error(reply, 400, "VALIDATION_ERROR", "firstName and lastName are required");
    }

    const { newUser, profile: newProfile } = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(user)
        .values({ userName: nickname, role: "student" })
        .returning();

      const studentId = generateStudentId();

      const [profile] = await tx
        .insert(studentProfile)
        .values({
          userId: newUser.id,
          studentId,
          firstName: firstName,
          lastName: lastName,
          nickname: nickname || firstName,
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
        nickname: newProfile.nickname,
        joinedAt: newProfile.joinedAt,
      },
    }));
  });
}

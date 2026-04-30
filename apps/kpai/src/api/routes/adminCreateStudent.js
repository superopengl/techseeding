import { db } from "../db/index.js";
import { user, studentProfile } from "../db/schema.js";
import { generateStudentId } from "../lib/generateStudentId.js";

export function adminCreateStudent(fastify) {
  fastify.post("/api/admin/student", async (request, reply) => {
    const { firstName, lastName, nickname, dob, gender, school, homeAddress, contactNumber, custodianName, notes } = request.body || {};

    if (!firstName || !lastName) {
      return reply.status(400).send({ error: "firstName and lastName are required" });
    }

    const { newUser, profile } = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(user)
        .values({ displayName: nickname, role: "student" })
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
          school: school || null,
          homeAddress: homeAddress || null,
          contactNumber: contactNumber || null,
          custodianName: custodianName || null,
          notes: notes || null,
        })
        .returning();

      return { newUser, profile };
    });

    return reply.status(201).send({
      id: newUser.id,
      displayName: newUser.displayName,
      role: newUser.role,
      profile: {
        id: profile.id,
        studentId: profile.studentId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        nickname: profile.nickname,
        joinedAt: profile.joinedAt,
      },
    });
  });
}

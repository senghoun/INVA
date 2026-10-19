CREATE TABLE "employee_hr_roles" (
 "employee_id" UUID NOT NULL REFERENCES "employee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "role_id" UUID NOT NULL REFERENCES "hr_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 PRIMARY KEY ("employee_id", "role_id")
);

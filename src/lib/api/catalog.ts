import { apiGet } from "@/api/client";

export async function getOdontologos() {
  return apiGet("/catalog/odontologos");
}

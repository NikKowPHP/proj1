/** @jest-environment node */

import { GET } from "./route";
import { NextRequest } from "next/server";

describe("GET /api/jobs/suggest-exposures", () => {
  it("should return suggested exposures for a known job title", async () => {
    const req = new NextRequest(
      "http://localhost/api/jobs/suggest-exposures?jobTitle=welder",
    );
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(["welding_fumes"]);
  });

  it("should return an empty array for a job title with no ISCO code mapping", async () => {
    const req = new NextRequest(
      "http://localhost/api/jobs/suggest-exposures?jobTitle=florist",
    );
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("should return an empty array for a job title with an ISCO code but no JEM entry", async () => {
    // 'nurse' has an ISCO code but no entry in our jem.map.ts
    const req = new NextRequest(
      "http://localhost/api/jobs/suggest-exposures?jobTitle=nurse",
    );
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("should return a 400 Bad Request if the jobTitle parameter is missing", async () => {
    const req = new NextRequest(
      "http://localhost/api/jobs/suggest-exposures",
    );
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "jobTitle parameter is required" });
  });

  it("should handle job titles with spaces correctly", async () => {
    // Assuming a job title like "construction worker" could be added later
    const req = new NextRequest(
      "http://localhost/api/jobs/suggest-exposures?jobTitle=construction%20worker",
    );
    const response = await GET(req);
    // Since it's not in the map, we expect an empty array. The main point is to ensure it doesn't crash.
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });
});

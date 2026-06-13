import { getDistance, formatDistance } from "../lib/location";

describe("getDistance (Haversine, km)", () => {
  it("vaut 0 pour deux points identiques", () => {
    expect(getDistance(6.13, 1.21, 6.13, 1.21)).toBeCloseTo(0, 5);
  });

  it("≈ 111 km pour 1° de latitude à l'équateur", () => {
    expect(getDistance(0, 0, 1, 0)).toBeGreaterThan(110);
    expect(getDistance(0, 0, 1, 0)).toBeLessThan(112);
  });
});

describe("formatDistance", () => {
  it("affiche en mètres sous 1 km", () => {
    expect(formatDistance(0.5)).toBe("500 m");
    expect(formatDistance(0.05)).toBe("50 m");
  });

  it("affiche une décimale entre 1 et 10 km", () => {
    expect(formatDistance(2.345)).toBe("2.3 km");
  });

  it("arrondit au-delà de 10 km", () => {
    expect(formatDistance(15.6)).toBe("16 km");
  });
});

import { describe, expect, it } from "vitest";
import {
  extractLatLngFromGoogleMapsSrc,
  isGoogleMapsInput,
} from "../google-maps-utils";

describe("google-maps-utils", () => {
  describe("extractLatLngFromGoogleMapsSrc", () => {
    it("should extract coordinates from Pattern A (!2d{lng}!3d{lat})", () => {
      const embedUrl =
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12345!2d-0.127647!3d51.507351!...";
      const result = extractLatLngFromGoogleMapsSrc(embedUrl);

      expect(result).toEqual({
        lat: 51.507351,
        lng: -0.127647,
      });
    });

    it("should extract coordinates from Pattern B (@lat,lng,zoom)", () => {
      const mapsUrl = "https://www.google.com/maps/@51.507351,-0.127647,15z";
      const result = extractLatLngFromGoogleMapsSrc(mapsUrl);

      expect(result).toEqual({
        lat: 51.507351,
        lng: -0.127647,
      });
    });

    it("should extract coordinates from Pattern C (q=lat,lng)", () => {
      const queryUrl = "https://www.google.com/maps?q=51.507351,-0.127647&z=15";
      const result = extractLatLngFromGoogleMapsSrc(queryUrl);

      expect(result).toEqual({
        lat: 51.507351,
        lng: -0.127647,
      });
    });

    it("should extract coordinates from iframe embed code", () => {
      const iframe =
        '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12345!2d-0.127647!3d51.507351!" width="600" height="450"></iframe>';
      const result = extractLatLngFromGoogleMapsSrc(iframe);

      expect(result).toEqual({
        lat: 51.507351,
        lng: -0.127647,
      });
    });

    it("should handle negative coordinates", () => {
      const url = "https://www.google.com/maps/@-33.865143,151.209900,15z";
      const result = extractLatLngFromGoogleMapsSrc(url);

      expect(result).toEqual({
        lat: -33.865143,
        lng: 151.2099,
      });
    });

    it("should return null for invalid input", () => {
      expect(extractLatLngFromGoogleMapsSrc("")).toBeNull();
      expect(extractLatLngFromGoogleMapsSrc("not a maps url")).toBeNull();
      expect(extractLatLngFromGoogleMapsSrc("https://example.com")).toBeNull();
    });
  });

  describe("isGoogleMapsInput", () => {
    it("should return true for Google Maps URLs", () => {
      expect(isGoogleMapsInput("https://maps.google.com/maps?q=paris")).toBe(
        true,
      );
      expect(isGoogleMapsInput("https://maps.app.goo.gl/abc123")).toBe(true);
      expect(isGoogleMapsInput("https://goo.gl/maps/xyz789")).toBe(true);
      expect(isGoogleMapsInput("https://www.google.com/maps/@51,0,15z")).toBe(
        true,
      );
    });

    it("should return true for iframe embeds", () => {
      expect(isGoogleMapsInput('<iframe src="https://maps.google.com">')).toBe(
        true,
      );
    });

    it("should return false for non-Google Maps input", () => {
      expect(isGoogleMapsInput("")).toBe(false);
      expect(isGoogleMapsInput("https://example.com")).toBe(false);
      expect(isGoogleMapsInput("Louvre Museum, Paris")).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(isGoogleMapsInput("https://MAPS.GOOGLE.COM/maps?q=paris")).toBe(
        true,
      );
    });
  });
});

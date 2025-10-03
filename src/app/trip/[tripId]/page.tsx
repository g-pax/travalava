"use client";
import { useEffect, useState } from "react";
import TripPage from "./TripPage";

interface TripPageProps {
  params: Promise<{ tripId: string }>;
}

const Trip = ({ params }: TripPageProps) => {
  const [tripId, setTripId] = useState<string>("");

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setTripId(resolvedParams.tripId);
    };
    fetchParams();
  }, [params]);

  return <TripPage params={{ tripId }} />;
};

export default Trip;

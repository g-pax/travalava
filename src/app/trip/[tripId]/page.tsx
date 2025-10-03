import TripPage from './TripPage';

interface TripPageProps {
    params: Promise<{ tripId: string }>;
}

const Trip = async ({ params }: TripPageProps) => {
    const { tripId } = await params;

    return (
        <TripPage params={{ tripId }} />
    )
}

export default Trip
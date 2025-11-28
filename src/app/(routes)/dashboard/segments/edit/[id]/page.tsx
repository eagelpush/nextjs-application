import { notFound } from "next/navigation";
import { getSegmentById } from "../../lib/actions";
import { EditSegmentForm } from "../../components/edit-segment-form";

interface EditSegmentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSegmentPage({ params }: EditSegmentPageProps) {
  try {
    const { id } = await params;
    const segment = await getSegmentById(id);

    if (!segment) {
      notFound();
    }

    return <EditSegmentForm segment={segment} />;
  } catch (error) {
    console.error("Error fetching segment:", error);
    notFound();
  }
}

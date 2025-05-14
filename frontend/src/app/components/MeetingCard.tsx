import { motion } from 'framer-motion';
import { Badge } from '../../components/ui/badge';

export function MeetingCard({ meeting, dragHandleProps }: {
  meeting: {
    id: string;
    client: { firstName: string; lastName: string };
    date: Date;
    status: 'Requested' | 'Scheduled' | 'Completed';
  };
  dragHandleProps: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 border rounded-lg mb-2 bg-white shadow-sm hover:shadow-md transition-shadow"
      {...dragHandleProps}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{meeting.client.firstName} {meeting.client.lastName}</h3>
          <p className="text-sm text-gray-500">
            {new Date(meeting.date).toLocaleString()}
          </p>
        </div>
        <Badge 
          variant={
            meeting.status === 'Requested' ? 'secondary' :
            meeting.status === 'Scheduled' ? 'default' : 'outline'
          }
        >
          {meeting.status}
        </Badge>
      </div>
    </motion.div>
  );
}
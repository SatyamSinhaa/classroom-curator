import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const YearCalendar = ({ scheduledUnits = [] }) => {
  // Transform scheduled units into calendar events
  const events = scheduledUnits
    .filter(unit => unit.status === 'scheduled' && unit.dates && unit.dates.length > 0)
    .map(unit => ({
      id: unit.title,
      title: unit.title,
      start: new Date(unit.calculated_start_date),
      end: new Date(unit.calculated_end_date),
      resource: {
        color: unit.color,
        dates: unit.dates,
        estimatedHours: unit.estimated_hours
      }
    }));

  // Custom event styling
  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.resource.color,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  // Custom event component to show more info
  const EventComponent = ({ event }) => (
    <div className="text-xs font-medium truncate">
      {event.title}
    </div>
  );

  return (
    <div className="h-96">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        components={{
          event: EventComponent
        }}
        views={['month']}
        defaultView="month"
        popup
        selectable
        onSelectEvent={(event) => {
          alert(`${event.title}\nStart: ${event.start.toLocaleDateString()}\nEnd: ${event.end.toLocaleDateString()}\nEstimated Hours: ${event.resource.estimatedHours}`);
        }}
      />
    </div>
  );
};

export default YearCalendar;